import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser(reqBody) {
  const hashedPassword = 
    (reqBody.password === undefined) ? null : await bcrypt.hash(reqBody.password, 10);
  const user = await prisma.user.create({
    data: {
      username: reqBody.username,
      displayName: reqBody.displayName,
      email: reqBody.email,
      password: hashedPassword,
      sub: (reqBody.sub === undefined) ? null : reqBody.sub,

      settings: {
        create: {}
      }
    }
  });

  return user;
}

async function getUser(username='', email='') {
  if (username === '' && email === '')
    return []

  const user = await prisma.user.findFirst({
    where: {
      AND: [
        {username: {contains: username}},
        {email: {contains: email}},
      ]
    }
  });

  return user;
}

async function getUserById(id) {
  const user = await prisma.user.findFirst({
    where: {
      id: id
    }
  })

  return user;
}

async function getUserBySub(sub) {
  const user = await prisma.user.findFirst({
    where: {
      sub: sub
    }
  });

  return user;
}

async function saveRefreshToken(userId, token) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      tokens: {
        create: {
          refreshToken: token
        }
      }
    },
    include: {
      tokens: true
    }
  });

  return user;
}

async function checkRefreshToken(token) {
  const user = await prisma.token.findFirst({
    where: {
      refreshToken: token
    },
    include: {
      user: true
    }
  });

  return user;
}

async function checkRefreshTokenWithUserId(userId, token) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tokens: {
        some: {
          refreshToken: token,
        }
      }
    }
  });

  return user;
}

async function deleteRefreshToken(userId, token) {
  const deleteTokensCount = await prisma.token.deleteMany({
    where: {
      refreshToken: token,
      userId: userId
    }
  });

  return deleteTokensCount;
}

export default {
  createUser,
  getUser, 
  getUserById,
  getUserBySub,
  saveRefreshToken,
  checkRefreshToken,
  checkRefreshTokenWithUserId,
  deleteRefreshToken,
};

