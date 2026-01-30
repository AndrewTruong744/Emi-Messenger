import { Prisma } from '../../generated/prisma/client.js';
import {prisma} from '../prisma.js';
import redis from '../../cache/redisClient.js';

// utilizes cursor pagination, where you get the messages that come before this prevMessageId
export async function getMessages(conversationId : string, prevMessageId : string | null, userId : string) {
  
  // gets conversation to check if user is a participant (authorization)
  const redisParticipants : string | null = 
    await redis.hget(`conversation-${conversationId}`, "participants");
  if (redisParticipants) {
    const hasUserId = JSON.parse(redisParticipants).includes(userId);
    if (!hasUserId)
      return null;
  }
  else {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {userId: userId}
        }
      },
      include: {
        participants: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!conversation)
      return null;

    const participants = conversation.participants.map((participant) => participant.userId);

    const redisConversation = {
      ...conversation,
      participants: JSON.stringify(participants),
      timeStamp: String(conversation.timeStamp.getTime()),
    };

    await redis.hset(`conversation-${conversationId}`, redisConversation);
  }

  /* 
    if getting the first 50 messages, check redis first since redis will only hold the first 50 messages
  */
  const redisMessages = (!prevMessageId) ? 
    await redis.lrange(`conversation-${conversationId}-messages`, 0, 49) : [];
  
  let messages;
  if (redisMessages.length > 0) {
    // need to reverse the messages since it is latest at first index
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
      prismaQuery['skip'] = 1; // to prevent getting the same previous message that was passed in
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

  // need to reverse the messages since it is latest at first index
  return messages?.reverse();
}

export async function addMessage(conversationId : string, senderId : string, message : string) {
  const timeStamp = new Date();
  const [authCheck, messageCreated, updatedConversation] = await prisma.$transaction([
    // if user does not belong to conversation, prevent adding the message
    prisma.conversationParticipant.findUniqueOrThrow({
      where: {
        userId_conversationId: {
          userId: senderId,
          conversationId: conversationId,
        },
      }
    }), 
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

  // update to move this conversation to the top of each user's conversation lists
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