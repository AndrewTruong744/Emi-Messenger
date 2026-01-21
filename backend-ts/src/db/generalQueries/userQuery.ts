import { Prisma } from '@prisma/client';
import {prisma} from '../prisma.js';
import redis from '../../cache/redisClient.js';
import {getAllConversationIds} from './conversationQuery.js';

export async function getUsernames(userIdList : string[]) {
  const userIdToUsernames : Record<string,string> = {};
  const queryUsernames : string[] = [];

  const p1 = redis.pipeline();
  userIdList.forEach((otherUserId) => {
    p1.hget(`user-${otherUserId}`, 'username');
  })

  const p3Result = await p1.exec();
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

    const p2 = redis.pipeline();
    usernamesQuery.forEach((queryEntry) => {
      userIdToUsernames[queryEntry.id] = queryEntry.username;
      p2.hset(`user-${queryEntry.id}`, queryEntry);
    })
  }

  return userIdToUsernames;
}

export async function getUsersOnline(userIdList : string[]) {
  const p4 = redis.pipeline();
  userIdList.forEach(id => {
    p4.exists(`user-${id}-online`);
  });

  const p4Result = await p4.exec();

  // contains userIds
  const onlineResult = p4Result?.reduce((acc, result, index) => {
    if (result[1] === 1)
      acc.add(userIdList[index]!);

    return acc;
  }, new Set());

  return onlineResult;
}

export async function updateUsername(userId : string, newUsername: string) {
  const user = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      username: newUsername
    }
  });

  if (!user)
    return "invalid";

  await redis.hset(`user-${userId}`, "username", newUsername);
  
  const conversationIds = await getAllConversationIds(userId);
  return conversationIds;
} 

export async function getUsers(username : string, currUserId : string | null) {
  const prismaQuery : Prisma.UserFindManyArgs = {
    take: 50,
    where: {
      username: {
        startsWith: username,
        mode: 'insensitive'
      },
    },
    select: {
      id: true,
      username: true,
    },
    orderBy: {
      username: 'asc'
    }
  };

  if (currUserId) {
    prismaQuery.where = {
      ...prismaQuery.where,
      NOT: {
        id: currUserId
      }
    }
  }

  const users = await prisma.user.findMany(prismaQuery);

  return users;
}

export async function getCurrentUser(userId : string) {
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

// purges all data from user and all chats the user is involved in
export async function deleteUserData(userId : string) {
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