import {prisma} from '../prisma.js';
import redis from '../../cache/redisClient.js';
import { getUsernames, getUsersOnline } from './userQuery.js';

export interface Conversation {
  id: string,
  name: string,
  isGroup: boolean | string, // stores booleans as strings in redis
  participants: string[] | string // need to stringify array to store in redis
  recentMessage: string,
  timeStamp: string, // string representation of Unix Time * 1000 since TypeScript uses milliseconds
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

    /* 
      an array of Unix Time * 1000 followed by the conversationId to be able
      to store in a zset in redis, allowing zset to be sorted based on which
      conversation is most recent
    */
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

// gets conversations exluding online status
async function getConversationList(conversationIds : string[]) {
  const p1 = redis.pipeline();
  conversationIds.forEach((conversationId) => {
    p1.hgetall(`conversation-${conversationId}`);
  });

  // retains the order of conversationIds
  const p1Result = (await p1.exec())!;
  let conversationList : Conversation[] = [];
  const queryConversations : [string, number][] = [];
  p1Result!.forEach((result, index) => {
    const redisResult = result[1] as Conversation

    /* 
      if there did not exist a conversation entry in redis for this conversationId,  
      add to queryConversations to find in database later
    */
    if (!result[1] || Object.keys(redisResult).length === 0)
      queryConversations.push([conversationIds[index]!, index]);
    else {
      // parse stringified array back into an array
      const participants : string[] = JSON.parse(redisResult.participants as string);
      const conversation = {
        ...redisResult,
        isGroup: redisResult.isGroup === "true" ? true : false, // since redis stores booleans as strings
        participants: participants,
        online: false // placeholder
      }
      conversationList[index] = conversation;
    }
  });

  // query all conversations needed that are not stored in redis
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
    }, {} as Record<string, Conversation>);

    // add all conversations need that were not stored in redis into redis
    const p2 = redis.pipeline();
    queryConversations.forEach((queryConversation) => {
      conversationList[queryConversation[1]] = conversationsObj[queryConversation[0]] as Conversation;
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

// TODO: add pagination
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

  // get every user from every conversation this user is in
  let userIdList : string[] = [];
  conversationList.forEach((conversation) => {
    (conversation.participants as string[]).forEach((participant) => {
      userIdList.push(participant);
    });
  });

  // remove duplicates
  userIdList = [...new Set(userIdList)];

  let userIdToUsernames = await getUsernames(userIdList);
  
  const onlineResult = await getUsersOnline(userIdList);
  conversationList = conversationList.map(conversation => {
    // if this conversation is 1 to 1, check to see if other user is online to display online status
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

export async function addConversation(userIds : string[]) {
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

    // add created conversation into redis
    p1.hset(`conversation-${createdConversation.id}`, {
      id: createdConversation.id,
      name: "",
      isGroup: userIds.length >= 3,
      participants: JSON.stringify(userIds),
      recentMessage: "",
      timeStamp: createdConversation.timeStamp.getTime()
    });

    // for each user in conversation, add conversationId to their zset in redis
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
  // checks to see if the user changing the name belongs in the conversation
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

  // checks to see if user deleting conversation belongs in the conversation
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
  conversationEntry.participants.forEach((participant) => {
    p1.zrem(`user-${participant.userId}-conversations`, conversationId);
  });

  await p1.exec();

  return "success";
}