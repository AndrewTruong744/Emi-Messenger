import { PrismaClient } from '@prisma/client';

// Prevents multiple instances of Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env['MODE'] !== 'production') globalForPrisma.prisma = prisma;