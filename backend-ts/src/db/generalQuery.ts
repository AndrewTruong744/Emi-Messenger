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

// implement pagination
// prevent currentUser from showing up
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
// implement pagination
/*
  user-${userId} (HSET):
  id: string
  username: string
  picture: (implement later)

  user-${userId}-conversations (ZSET):
  {conversationId: timeStamp} 

  conversation-${conversationId} (HSET):
  id: string,
  name: string,
  isGroup: bool
  participants: string[] of userIds, JSON.stringify
  recentMessage: Message JSON.stringify
  timestamp: string
  picture: (implement later)

  conversation-${conversationId}-messages (KEY VAL): Message[] JSON.stringify
  ttl: 7d
*/

interface ConversationList {
  id: string,
  name: string,
  isGroup: boolean | string,
  participants: string[] | string
  recentMessage: string,
  timeStamp: string,
  online?: boolean
}

async function getAllConversationIds(userId : string) {
  const conversationIds = await redis.zrange(`user-${userId}-conversations`, 0, -1);

  if (conversationIds.length > 0)
    return conversationIds;
  else {
    const query = await prisma.conversationParticipant.findMany({
      where: {
        userId: userId
      },
      include: {
        conversation: true
      }
    });

    const setUserConversationCache : (number | string)[] = [];
    query.forEach((queryEntry) => {
      conversationIds.push(queryEntry.conversationId);
      setUserConversationCache.push(queryEntry.conversation.timeStamp.getTime());
      setUserConversationCache.push(queryEntry.conversationId);
    });

    if (setUserConversationCache.length > 0)
      await redis.zadd(`user-${userId}-conversations`, ...setUserConversationCache);

    return query.map(queryEntry => queryEntry.conversationId);
  }
}

async function getConversations(userId : string, lastConversationTimeStamp : string | null) {
  const getRedis = (lastConversationTimeStamp) ? redis.zrevrangebyscore(
    `user-${userId}-conversations`,
    `(${lastConversationTimeStamp}`,
    '-inf',
    'LIMIT', 0, 20
  ) : redis.zrevrange(`user-${userId}-conversations`, 0, 19);

  let conversationIds = await getRedis;

  if (conversationIds.length == 0) {
    const query = await prisma.conversationParticipant.findMany({
      where: {
        userId: userId
      },
      include: {
        conversation: true
      }
    });

    const setUserConversationCache : (number | string)[] = [];
    query.forEach((queryEntry) => {
      conversationIds.push(queryEntry.conversationId);
      setUserConversationCache.push(queryEntry.conversation.timeStamp.getTime());
      setUserConversationCache.push(queryEntry.conversationId);
    });

    if (setUserConversationCache.length > 0)
      await redis.zadd(`user-${userId}-conversations`, ...setUserConversationCache);
  }

  if (conversationIds.length == 0) {
    return {
      conversationList: [],
      lastConversationTimestamp: null,
      userIdToUsernames: {},
    }
  }

  const p1 = redis.pipeline();
  conversationIds.forEach((conversationId) => {
    p1.hgetall(`conversation-${conversationId}`);
  });

  const p1Result = (await p1.exec())!;
  let conversationList : ConversationList[] = [];
  const queryConversations : [string, number][] = [];
  const notGroupChatIds : string[] = [];

  p1Result!.forEach((result, index) => {
    const redisResult = result[1] as ConversationList
    if (!result[1] || Object.keys(redisResult).length === 0)
      queryConversations.push([conversationIds[index]!, index]);
    else {
      const participants : string[] = JSON.parse(redisResult.participants as string);
      if (participants.length == 2) {
        const otherUserId = participants.filter(participant => participant.trim() != userId.trim())[0];
        if (otherUserId)
          notGroupChatIds.push(otherUserId);
      }
      const conversation = {
        id: redisResult.id,
        name: redisResult.name,
        isGroup: redisResult.isGroup === "true" ? true : false,
        participants: participants,
        recentMessage: redisResult.recentMessage,
        timeStamp: redisResult.timeStamp,
        online: false
      }
      conversationList[index] = conversation;
    }
  });

  if (queryConversations.length > 0) {
    const queryConversationIds = queryConversations.map((queryConversation) => queryConversation[0]);
    const query = await prisma.conversation.findMany({
      where: {
        id: {in: queryConversationIds}
      },
      include: {
        participants: true
      }
    });

    const conversationsObj = query.reduce((acc, queryEntry) => {
      const participants : string[] = queryEntry.participants.map((participant) => participant.userId);
      if (participants.length == 2) {
        const otherUserId = participants.filter(participant => participant.trim() != userId.trim())[0];

        if (otherUserId)
          notGroupChatIds.push(otherUserId);
      }

      acc[queryEntry.id] = {
        id: queryEntry.id,
        name: queryEntry.name,
        isGroup: queryEntry.isGroup,
        participants: queryEntry.participants.map((participant) => participant.userId),
        recentMessage: queryEntry.recentMessage,
        timeStamp: String(queryEntry.timeStamp.getTime()),
        online: false
      }
      return acc;
    }, {} as Record<string, ConversationList>);

    const p2 = redis.pipeline();
    queryConversations.forEach((queryConversation) => {
      conversationList[queryConversation[1]] = conversationsObj[queryConversation[0]] as ConversationList;
      const redisConversation = {...conversationsObj[queryConversation[0]]};
      redisConversation.participants = JSON.stringify(redisConversation.participants);
      p2.hset(`conversation-${queryConversation[0]}`,  redisConversation);
    });
    p2.exec();
  }

  if (conversationList.length == 0) {
    return {
      conversationList: [],
      lastConversationTimestamp: null,
      userIdToUsernames: {},
    }
  }

  let userIdList : string[] = [];
  conversationList.forEach((conversation) => {
    (conversation.participants as string[]).forEach((participant) => {
      userIdList.push(participant);
    });
  });
  userIdList = [...new Set(userIdList)];

  // get usernames
  let userIdToUsernames : Record<string,string> = {};
  const queryUsernames : string[] = [];
  const p3 = redis.pipeline();
  userIdList.forEach((otherUserId) => {
    p3.hget(`user-${otherUserId}`, 'username');
  })
  const p3Result = await p3.exec();
  p3Result?.forEach((result, index) => {
    if (result[1])
      userIdToUsernames[userIdList[index]!] = result[1] as string;
    else
      queryUsernames.push(userIdList[index]!);
  });

  if (queryUsernames.length > 0) {
    const usernamesQuery = await prisma.user.findMany({
      where: {
        id: {in: queryUsernames}
      },
      select: {
        id: true,
        username: true
      }
    });

    const p5 = redis.pipeline();
    usernamesQuery.forEach((queryEntry) => {
      userIdToUsernames[queryEntry.id] = queryEntry.username;
      p5.hset(`user-${queryEntry.id}`, queryEntry);
    })
  }

  const p4 = redis.pipeline();
  notGroupChatIds.forEach(id => {
    p4.exists(`user-${id}-online`);
  });

  const p4Result = await p4.exec();

  // contains userIds
  const onlineResult = p4Result?.reduce((acc, result, index) => {
    if (result[1] === 1)
      acc.add(notGroupChatIds[index]!);

    return acc;
  }, new Set())

  conversationList = conversationList.map(conversation => {
    if (!conversation.isGroup) {
      const otherUserId = (conversation.participants as string[]).filter(participant => participant != userId)[0];
      if (otherUserId && onlineResult?.has(otherUserId))
        conversation.online = true;
    }
    
    return conversation;
  });

  // gets rid of holes
  conversationList = conversationList.filter(Boolean);

  return {
    conversationList: conversationList,
    lastConversationTimestamp: conversationList[conversationList.length - 1]!.timeStamp,
    userIdToUsernames: userIdToUsernames
  }
}

async function addConversation(userIds : string[], usernames : string[]) {
  if (userIds.length < 2)
    return null;

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
  });

 
  if (conversationEntry) {
    return {
      conversation: conversationEntry,
      created: false
    };
  }
  else {
    const createdConversation = await prisma.conversation.create({
      data: {
        name: usernames
                .map(username => username.trim())
                .join(', '),
        isGroup: userIds.length >= 3,
        participants: {
          create: userIds.map((userId) => ({
            userId: userId
          })),
        },
      }
    });

    const p1 = redis.pipeline();

    p1.hset(`conversation-${createdConversation.id}`, {
      id: createdConversation.id,
      name: usernames
                .map(username => username.trim())
                .join(', '),
      isGroup: userIds.length >= 3,
      participants: JSON.stringify(userIds),
      recentMessage: "",
      timeStamp: createdConversation.timeStamp.getTime()
    });

    userIds.forEach((userId) => {
      p1.zadd(`user-${userId}-conversations`, 
        String(createdConversation.timeStamp.getTime()), createdConversation.id
      );
    });

    await p1.exec();

    return {
      conversation: {
        ...createdConversation,
        timeStamp: createdConversation.timeStamp.getTime(),
      },
      created: true,
    };
  }
}

async function updateConversationName(conversationId : string, name : string) {
  
}

async function getMessages(conversationId : string, prevMessageId : string | null) {
  const redisMessages = (!prevMessageId) ? 
    await redis.lrange(`conversation-${conversationId}-messages`, 0, 49) : [];
  
  let messages;
  if (redisMessages.length > 0) {
    messages = redisMessages
      .map((message) => JSON.parse(message))
      .reverse();
    return messages;
  }
    
  
  if (redisMessages.length === 0) {
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
    if (messages.length === 0)
      return [];

    if (!prevMessageId) {
      const p1 = redis.pipeline();
      messages.forEach((message) => {
        p1.rpush(`conversation-${conversationId}-messages`, JSON.stringify(message));
      })
      p1.expire(`conversation-${conversationId}-messages`, 60 * 60 * 24);
      await p1.exec();
    }
  }

  return messages?.reverse();
}

async function addMessage(conversationId : string, senderId : string, message : string) {
  const timeStamp = new Date();
  const [messageCreated, updatedConversation] = await prisma.$transaction([
    prisma.message.create({
      data: {
        content: message,
        senderId: senderId,
        conversationId: conversationId
      }
    }),
    prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        recentMessage: message,
        timeStamp: timeStamp
      },
      include: {
        participants: true
      }
    })
  ]);

  const p1 = redis.pipeline();

  updatedConversation.participants.forEach((participant) => {
    p1.zadd(`user-${participant.userId}-conversations`, timeStamp.getTime(), conversationId);
  });

  p1.hset(`conversation-${conversationId}`, {
    recentMessage: message,
    timeStamp: timeStamp.getTime()
  });

  p1.lpush(`conversation-${conversationId}-messages`, JSON.stringify(messageCreated));
  p1.ltrim(`conversation-${conversationId}-messages`, 0, 49);
  p1.expire(`conversation-${conversationId}-messages`, 60*60*24*7);

  await p1.exec();

  return {
    ...messageCreated,
    sent: timeStamp.getTime(),
  };
}

// implement redis caching
async function deleteConversation(conversationId : string) {
  const conversationEntry = await prisma.conversation.findFirst({
    where: {
      id: conversationId
    },
    include : {
      participants: {
        select: {
          userId: true
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
  p1.del(`conversation-${conversationId}`);
  if (conversationEntry) {
    conversationEntry.participants.forEach((participant) => {
      p1.zrem(`user-${participant.userId}-conversations`, conversationId);
    });
  }

  await p1.exec();
}

// purges all data from user and all chats the user is involved in
// update
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
                select: {
                  userId: true
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
  p1.del(`user-${userId}`);
  user?.conversations.forEach((conversationParticipant) => {
    conversationParticipant.conversation.participants.forEach((participant) => {
      p1.zrem(`user-${participant.userId}-conversations`, conversationParticipant.conversationId);
    });

    p1.del(`conversation-${conversationParticipant.conversationId}-messages`);
    p1.del(`conversation-${conversationParticipant.conversationId}`);
  });

  await p1.exec();
}


export default {
  getDatabaseId,
  getUsername,
  getUsers,
  getCurrentUser,
  getAllConversationIds,
  getConversations,
  addConversation,
  getMessages,
  addMessage,
  deleteConversation,
  deleteUserData,
}