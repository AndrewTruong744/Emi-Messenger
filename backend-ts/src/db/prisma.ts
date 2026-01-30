import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: 20,
});
const adapter = new PrismaPg(pool);

// Prevents multiple instances of Prisma Client when using Hot Reload (HMR)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

if (process.env['MODE'] !== 'production') globalForPrisma.prisma = prisma;