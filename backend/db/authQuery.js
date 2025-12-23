import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

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
  const hashedToken = await bcrypt.hash(token, 10);

  const decodedRefreshToken = jwt.decode(token);
  const expiresBy = decodedRefreshToken.exp * 1000;

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      tokens: {
        create: {
          refreshToken: hashedToken,
          expiresBy: new Date(expiresBy)
        }
      }
    },
    include: {
      tokens: true
    }
  });

  return user;
}

async function checkRefreshTokenWithUserId(userId, token) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      tokens: true
    }
  });

  if (!user)
    return null;

  const tokenEntries = user.tokens;
  for (const tokenEntry of tokenEntries) {
    const found = await bcrypt.compare(token, tokenEntry.refreshToken);
    if (found)
      return user;
  }

  return null;
}

async function deleteRefreshToken(userId, token) {
  const tokenEntries = await prisma.token.findMany({
    where: {
      userId: userId,
    }
  });

  let tokenEntryId = "";
  for (const tokenEntry of tokenEntries) {
    const found = await bcrypt.compare(token, tokenEntry.refreshToken);
    if (found) {
      tokenEntryId = tokenEntry.id;
      break;
    }
  }

  if (tokenEntryId === "")
    return 0;

  const deleteTokensCount = await prisma.token.delete({
    where: {
      id: tokenEntryId
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
  checkRefreshTokenWithUserId,
  deleteRefreshToken,
};

