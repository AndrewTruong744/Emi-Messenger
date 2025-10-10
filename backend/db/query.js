const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function getUser(username = '', email = '') {
  if (username === '' && email === '')
    return []

  const user = await prisma.user.findUnique({
    where: {
      AND: [
        {username: {contains: username}},
        {email: {contains: email}}
      ]
    }
  });

  return user;
}

module.exports = {userByEmail};

