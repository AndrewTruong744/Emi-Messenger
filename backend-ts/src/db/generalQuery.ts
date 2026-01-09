import {PrismaClient} from '@prisma/client';
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

  return usernameObj?.username;
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
      displayName: true,
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

async function getConversations(userId : string) {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [{userAId: userId}, {userBId: userId}],
    },
    include: {
      userA: {select: {id: true, username: true}},
      userB: {select: {id: true, username: true}},
    },
  });

  const conversationList = contacts.map((contact) => {
    return (contact.userAId === userId) ? contact.userB : contact.userA;
  });

  if (conversationList.length === 0) 
    return [];

  const pipeline = redis.pipeline();

  conversationList.forEach(user => {
    pipeline.exists(`user-${user.id}-online`);
  });
  
  const pipelineResults = await pipeline.exec();

  return conversationList.map((user, index) => {
    const isOnline = pipelineResults?.[index]?.[1];
    console.log(user);
    console.log(isOnline);
    return {
      ...user,
      online: (isOnline && (isOnline as number) > 0),
    }
  });
}

// add a contact if there isnt an existing relationship between userA and userB
// ex. if A -> B or B -> A exist, no need to add a contact
async function addContact(userAId : string, userBId : string) {
  const contactEntry = await prisma.contact.findMany({
    where: {
      OR: [
        {
          AND: [
            {userAId: userAId},
            {userBId: userBId}
          ]
        },
        {
          AND: [
            {userAId: userBId},
            {userBId: userAId}
          ]
        }
      ]
    }
  });

  if (contactEntry.length == 0) {
    await prisma.contact.create({
      data: {
        userAId: userAId,
        userBId: userBId
      }
    });

    return true;
  }

  return false;
}

async function getMessages(userAId : string, userBId : string) {
  let sentMessages = await prisma.message.findMany({
    where: {
      AND: [
        {senderId: userAId},
        {receiverId: userBId}
      ]
    },
    orderBy: {
      sent: 'desc'
    }
  });

  let receivedMessages = await prisma.message.findMany({
    where: {
      AND: [
        {senderId: userBId},
        {receiverId: userAId}
      ]
    },
    orderBy: {
      sent: 'desc'
    }
  });

  sentMessages = sentMessages.map(sentMessage => {
    return {
      ...sentMessage,
      from: "sender",
    }
  });

  receivedMessages = receivedMessages.map(receivedMessages => {
    return {
      ...receivedMessages,
      from: "receiver",
    }
  });

  const messages = [...receivedMessages, ...sentMessages];
  messages.sort((a, b) => a.sent.getTime() - b.sent.getTime());
  return messages;
}

async function addMessage(userAId : string, userBId : string, message : string) {
  const messageCreated = await prisma.message.create({
    data: {
      content: message,
      senderId: userAId,
      receiverId: userBId
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true
        }
      },
      receiver: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  return messageCreated;
}

async function deleteUserData(userId : string) {
  await prisma.user.delete({
    where: {
      id: userId
    }
  });
}


export default {
  getDatabaseId,
  getUsername,
  getUsers,
  getCurrentUser,
  getConversations,
  addContact,
  getMessages,
  addMessage,
  deleteUserData,
}