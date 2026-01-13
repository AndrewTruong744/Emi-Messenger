import {Prisma, PrismaClient} from '@prisma/client';
import redis from '../cache/redisClient.js';

const prisma = new PrismaClient();

async function getDatabaseId(username : string) {
  const userIdObj = await prisma.user.findUnique({
    where: {
      username: username
    },
    select: {
      id: true
    }
  });

  // if not found, returns undefined
  return userIdObj?.id;
}

async function getUsername(uuid : string) {
  const usernameObj = await prisma.user.findUnique({
    where: {
      id : uuid
    },
    select: {
      username: true
    }
  });

  return usernameObj?.username ?? null;
}

async function getUsers(username : string) {
  const users = await prisma.user.findMany({
    where: {
      username: {
        startsWith: username
      }
    },
    select: {
      id: true,
      username: true,
    }
  });

  return users;
}

async function getCurrentUser(userId : string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      username: true,
      email: true,
      settings: {
        select: {
          id: true
        }
      }
    }
  });

  return user;
}

// create a shared user-conversations and stringify metadata
async function getConversations(userId : string) {
  const redisConversations = await redis.hgetall(`user-${userId}-conversations`);
  let conversationList = Object.entries(redisConversations).map(([id, name]) => {
    return {
      id,
      name
    }
  });

  let userIdList = await redis.smembers(`user-${userId}-users`);
  let usernames : (string | null)[];
  let userIdToUsernames = new Map<string, string>();
  if (userIdList.length > 0) {
    usernames = await redis.hmget('usernames', ...userIdList);
    userIdList.forEach((otherUserId, index) => {
      userIdToUsernames.set(otherUserId, usernames[index]!);
    });
  }

  const p4 = redis.pipeline();
  conversationList.forEach((conversation) => {
    p4.smembers(`conversation-${conversation.id}-participants`);
  });
  const participantsResults = await p4.exec();

  let conversationParticipants: Record<string, string[]> = Object.fromEntries(
    conversationList.map((conversation, index) => [
      conversation.id, 
      (participantsResults?.[index]?.[1] ?? []) as string[]
    ])
  );

  if (conversationList.length === 0) {
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: userId },
      include: {
        user: {
          select: {
            username: true
          }
        },
        conversation: {
          include : {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    conversationList = conversations.map((conversation) => {
      return {
        id: conversation.conversationId,
        name: conversation.conversation.participants.reduce((acc, person, index) => {
          return (index === 0) ? person.user.username : acc + ", " + person.user.username;
        }, "")
      }
    }) ?? [];

    userIdList = [];
    usernames = [];
    for (const conversation of conversations) {
      const participants = [] as string[]
      conversation.conversation.participants.forEach((participant) => {
        participants.push(participant.userId);
        userIdList.push(participant.userId);
        usernames.push(participant.user.username);
      });
      conversationParticipants[conversation.conversationId] = participants;
    }

    if (conversationList.length !== 0) {
      const dataObject = conversationList.reduce((acc, conversation) => {
        acc[conversation.id] = conversation.name;
        return acc;
      }, {} as Record<string, string>);

      userIdList = [...new Set(userIdList)];
      usernames = [...new Set(usernames)];

      const userMap = new Map<string, string>();
      for (const conversation of conversations) {
        conversation.conversation.participants.forEach(participant => {
         userMap.set(participant.userId, participant.user.username);
        });
      }

      userIdToUsernames = userMap;

      const p5 = redis.pipeline();

      p5.hset(`user-${userId}-conversations`, dataObject);
      if (userIdList.length > 0)
        p5.sadd(`user-${userId}-users`, ...(userIdList.filter((otherUserId) => otherUserId != userId)));
      p5.hset('usernames', Object.fromEntries(userMap));
      Object.entries(conversationParticipants).forEach((conversationParticipant) => {
        p5.sadd(`conversation-${conversationParticipant[0]}-participants`, ...conversationParticipant[1]);
      });
      await p5.exec();
    }
  }

  if (conversationList.length === 0) 
    return {
    conversationList: [],
    userIdToUsernames: {}
  };

  const p1 = redis.pipeline();
  userIdList.forEach(otherUserId => {
    p1.exists(`user-${otherUserId}-online`);
  });
  const onlineResults = await p1.exec();

  const p2 = redis.pipeline();
  conversationList.forEach(conversation => {
    p2.get(`conversation-${conversation.id}-recentMessage`);
  })
  const recentMessageResults = await p2.exec();

  const userOnlineListObject = {} as Record<string, boolean>
  userIdList.forEach((otherUserId, index) => {
    userOnlineListObject[otherUserId] = onlineResults?.[index]?.[1] === 1;
  })

  const queryRecentMessages = {} as Record<string, number>;
  const updatedConversationList = conversationList.map((conversation, index) => {
    const participants = conversationParticipants[conversation.id] || [];
    const partnerId = (participants.length == 2) ? participants.find(id => id !== userId) : null;
    const isOnline = (partnerId && userOnlineListObject[partnerId] === true) ? true : false;
    const recentMessage = 
      (recentMessageResults?.[index]?.[1]) ? JSON.parse(recentMessageResults?.[index]?.[1] as string) : null;
    
    if (!recentMessage)
      queryRecentMessages[conversation.id] = index;

    return {
      ...conversation,
      isGroup: participants.length >= 3,
      online: isOnline,
      recentMessage: recentMessage?.content ?? null,
      timeStamp: recentMessage?.sent,
      participants: participants
    }
  });

  if (Object.keys(queryRecentMessages).length > 0) {
    const queryIds = Object.keys(queryRecentMessages);
    const dbMessages = await prisma.message.findMany({
      where: {conversationId: {in: queryIds as string[]}},
      orderBy: {sent: 'desc'},
      distinct: ['conversationId']
    });

    for (const dbMessage of dbMessages) {
      const index = queryRecentMessages[dbMessage.conversationId];
      updatedConversationList[index!]!.recentMessage = dbMessage.content;
      updatedConversationList[index!]!.timeStamp = dbMessage.sent;
    }

    const p3 = redis.pipeline();
    for (const messageEntry of dbMessages) {
      p3.set(`conversation-${messageEntry.conversationId}-recentMessage`, JSON.stringify(messageEntry));
    }

    await p3.exec();
  }

  return {
    conversationList: updatedConversationList,
    userIdToUsernames: Object.fromEntries(userIdToUsernames)
  };
}

async function addConversation(userIds : string[]) {
  const conversationIdsObject = await redis.hgetall(`user-${userIds[0]}-conversations`);
  const conversationIds = Object.keys(conversationIdsObject);

  const p1 = redis.pipeline();
  conversationIds.forEach((conversationId) => {
    p1.smembers(`conversation-${conversationId}-participants`);
  })
  const participantsResults = await p1.exec();
  const conversationsParticipants = participantsResults?.map((participantsResult) => {
    return participantsResult[1] as string[];
  }) ?? [];

  const indexFound = conversationsParticipants.findIndex((conversationParticipants) => {
    if (conversationParticipants.length != userIds.length)
      return false;

    return userIds.every(userId => conversationParticipants.includes(userId)); 
  });

  let conversationId = indexFound !== -1 ? conversationIds[indexFound] : null; 

  if (conversationId) {
    return {
      id: conversationId,
      name: conversationIdsObject[conversationId],
      created: false
    }
  }
  else {
    const conversationEntry = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              every: {userId: {in: userIds}} 
            },
          },
          ...userIds.map(userId => ({
            participants: {
              some: {userId: userId}
            }
          }))
        ]
      },
      include: {
        participants: {
          select: {
            userId: true
          }
        }
      }
    });

    conversationId = (conversationEntry) ? conversationEntry.id : null;
  }

  if (!conversationId) {
    const createdConversation = await prisma.conversation.create({
      data: {
        isGroup: userIds.length >= 3,
        participants: {
          create: userIds.map((userId) => ({
            userId: userId
          })),
        },
      }
    });

    let usernames = await redis.hmget('usernames', ...userIds);
    if (usernames.some(username => username === null)) {
      const usersQuery = await prisma.user.findMany({
        where: {id: {in: userIds}},
        select: {
          id: true,
          username: true
        }        
      });

      usernames = usersQuery.map(userQuery => userQuery.username);
      const usernamesObj = usersQuery.reduce((acc, user)  => {
        acc[user.id] = user.username;
        return acc;
      }, {} as Record<string,string>)
      await redis.hset('usernames', usernamesObj)
    }
    const conversationName = usernames.reduce((acc, username, index) => {
      return (index === 0) ? username : acc + ', ' + username;
    }, "") ?? "";

    const p2 = redis.pipeline();
    userIds.forEach((userId) => {
      p2.hset(`user-${userId}-conversations`, createdConversation.id, conversationName);
    })
    p2.sadd(`conversation-${createdConversation.id}-participants`, ...userIds);

    await p2.exec();

    return {
      id: createdConversation.id,
      name: conversationName,
      created: true,
    };
  }

  return null;
}

// offset for pagination
async function getMessages(conversationId : string, prevMessageId : string | null) {
  const redisMessages = (!prevMessageId) ? await redis.get(`conversation-${conversationId}-messages`) : null;
  
  let messages;
  if (redisMessages)
    return JSON.parse(redisMessages);
  
  if (!redisMessages) {
    const prismaQuery : Prisma.MessageFindManyArgs = {
      where: {
        conversationId: conversationId
      },
      take: 50,
      skip: 0,
      orderBy: {
        sent: 'desc'
      }
    }

    if (prevMessageId) {
      prismaQuery['cursor'] = {id: prevMessageId};
      prismaQuery['skip'] = 1;
    }

    messages = await prisma.message.findMany(prismaQuery);
    messages.reverse();

    if (messages.length === 0)
      return [];

    if (!prevMessageId) {
      const p1 = redis.pipeline();
      p1.set(`conversation-${conversationId}-messages`, JSON.stringify(messages));
      p1.expire(`conversation-${conversationId}-messages`, 60 * 60 * 24);
      await p1.exec();
    }
  }

  return messages;
}

async function addMessage(conversationId : string, senderId : string, message : string) {
  const messageCreated = await prisma.message.create({
    data: {
      content: message,
      senderId: senderId,
      conversationId: conversationId
    },
  });

  const redisResult = await redis.get(`conversation-${conversationId}-messages`);
  await redis.set(`conversation-${conversationId}-recentMessage`, JSON.stringify(messageCreated));

  if (redisResult) {
    const messages = JSON.parse(redisResult);
    if (messages.length >= 50)
      messages.shift();
    messages.push(messageCreated);
    await redis.set(`conversation-${conversationId}-messages`, JSON.stringify(messages));
    await redis.expire(`conversation-${conversationId}-messages`, 60 * 60 * 24);
  }

  return messageCreated;
}

async function deleteConversation(conversationId : string) {
  const conversationEntry = await prisma.conversation.findFirst({
    where: {
      id: conversationId
    },
    include : {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      }
    }
  });

  if (!conversationEntry) 
    return;

  await prisma.conversation.delete({
    where: {
      id: conversationId
    }
  });

  const p1 = redis.pipeline();
  p1.del(`conversation-${conversationId}-messages`);
  p1.del(`conversation-${conversationId}-recentMessage`);
  p1.del(`conversation-${conversationId}-participants`);
  if (conversationEntry) {
    conversationEntry.participants.forEach((participant) => {
      p1.hdel(`user-${participant.userId}-conversations`, conversationId);
    });
  }

  await p1.exec();
}

// purges all data from user and all chats the user is involved in
async function deleteUserData(userId : string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      username: true,
      conversations: {
        include: {
          conversation: {
            include: {
              participants : {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
  });

  await prisma.conversation.deleteMany({
    where: {
      participants: {
        some: {
          userId : userId
        }
      }
    }
  });

  await prisma.user.delete({
    where: {
      id: userId
    }
  });

  const p1 = redis.pipeline();
  p1.del(`user-${userId}-conversations`);
  p1.del(`user-${userId}-users`);
  p1.hdel('usernames', userId);
  user?.conversations.forEach((conversationParticipant) => {
    conversationParticipant.conversation.participants.forEach((participant) => {
      p1.hdel(`user-${participant.userId}-conversations`, conversationParticipant.conversationId);
    });

    p1.del(`conversation-${conversationParticipant.conversationId}-messages`);
    p1.del(`conversation-${conversationParticipant.conversationId}-recentMessage`);
    p1.del(`conversation-${conversationParticipant.conversationId}-participants`);
  });

  await p1.exec();
}


export default {
  getDatabaseId,
  getUsername,
  getUsers,
  getCurrentUser,
  getConversations,
  addConversation,
  getMessages,
  addMessage,
  deleteConversation,
  deleteUserData,
}