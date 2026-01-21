import {prisma} from '../prisma.js';
import redis from '../../cache/redisClient.js';
import { getUsernames, getUsersOnline } from './userQuery.js';

export interface ConversationList {
  id: string,
  name: string,
  isGroup: boolean | string,
  participants: string[] | string
  recentMessage: string,
  timeStamp: string,
  online?: boolean
}

export async function getAllConversationIds(userId : string) {
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

async function getConversationList(conversationIds : string[]) {
  const p1 = redis.pipeline();
  conversationIds.forEach((conversationId) => {
    p1.hgetall(`conversation-${conversationId}`);
  });

  const p1Result = (await p1.exec())!;
  let conversationList : ConversationList[] = [];
  const queryConversations : [string, number][] = [];

  p1Result!.forEach((result, index) => {
    const redisResult = result[1] as ConversationList
    if (!result[1] || Object.keys(redisResult).length === 0)
      queryConversations.push([conversationIds[index]!, index]);
    else {
      const participants : string[] = JSON.parse(redisResult.participants as string);
      const conversation = {
        ...redisResult,
        isGroup: redisResult.isGroup === "true" ? true : false,
        participants: participants,
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
      acc[queryEntry.id] = {
        ...queryEntry,
        participants: queryEntry.participants.map((participant) => participant.userId),
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

  // gets rid of holes
  conversationList = conversationList.filter(Boolean);

  return conversationList;
}

// add pagination later
export async function getConversations(userId : string, lastConversationTimeStamp : string | null) {
  const conversationIds = await getAllConversationIds(userId);
  if (conversationIds.length == 0) {
    return {
      conversationList: [],
      lastConversationTimestamp: null,
      userIdToUsernames: {},
    }
  }

  let conversationList = await getConversationList(conversationIds);
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

  let userIdToUsernames = await getUsernames(userIdList);
  
  const onlineResult = await getUsersOnline(userIdList);
  conversationList = conversationList.map(conversation => {
    if (!conversation.isGroup) {
      const otherUserId = (conversation.participants as string[]).filter(participant => participant != userId)[0];
      if (otherUserId && onlineResult?.has(otherUserId))
        conversation.online = true;
    }
    
    return conversation;
  });

  return {
    conversationList: conversationList,
    lastConversationTimestamp: conversationList[conversationList.length - 1]!.timeStamp,
    userIdToUsernames: userIdToUsernames
  }
}

export async function addConversation(userIds : string[], usernames : string[]) {
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
      name: "",
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

export async function updateConversationName(conversationId : string, userId : string, name : string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      isGroup: true, 
      participants: {
        some: { userId: userId }
      }
    }
  });

  if (!conversation)
    return "invalid";

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      name: name,
    }
  });

  await redis.hset(`conversation-${conversationId}`, {name: name, isCustomName: true});
  
  return "success";
}

// implement redis caching
export async function deleteConversation(conversationId : string, userId : string) {
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

  const participants = conversationEntry?.participants.map(participant => participant.userId);
  if (!conversationEntry || !participants?.includes(userId)) 
    return "invalid";

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

  return "success";
}