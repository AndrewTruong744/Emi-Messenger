import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

async function getDatabaseId(username) {
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

async function getUsers(username) {
  const users = await prisma.user.findMany({
    where: {
      username: {
        startsWith: username
      }
    },
    select: {
      username: true,
    }
  });

  return users;
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
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

async function getConversations(userId) {
  // returns an array of contact entry objects where userId is
  // in the first column
  const usersAddedEntry = await prisma.contact.findMany({
    where: {
      userAId: userId
    },
    include: {
      userB: {
        select: {
          username: true,
        }
      }
    }
  });

  // returns an array of contact entry objects where userId is
  // in the second column
  const usersOfEntry = await prisma.contact.findMany({
    where: {
      userBId: userId
    },
    include: {
      userA: {
        select: {
          username: true,
        }
      }
    }
  });

  const usersAdded = usersAddedEntry.map(userAdded => userAdded.userB);
  const usersOf = usersOfEntry.map(userAdded => userAdded.userA);

  return [...usersAdded, ...usersOf];
}

// add a contact if there isnt an existing relationship between userA and userB
// ex. if A -> B or B -> A exist, no need to add a contact
async function addContact(userAId, userBId) {
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
    })
  }
}

async function getMessages(userAId, userBId) {
  let sentMessages = await prisma.message.findMany({
    where: {
      AND: [
        {senderId: userAId},
        {receiverId: userBId}
      ]
    },
    select: {
      sent: true,
      content: true
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
    select: {
      sent: true,
      content: true
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

async function addMessage(userAId, userBId, message) {
  await prisma.message.create({
    data: {
      content: message,
      senderId: userAId,
      receiverId: userBId
    }
  });
}

export default {
  getDatabaseId,
  getUsers,
  getCurrentUser,
  getConversations,
  addContact,
  getMessages,
  addMessage,
}