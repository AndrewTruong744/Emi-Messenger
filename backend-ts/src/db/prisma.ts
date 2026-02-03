import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const url = [
  `postgresql://${encodeURIComponent(process.env['DB_USER']!)}`,
  `:${encodeURIComponent(process.env['DB_PASSWORD']!)}@`,
  `${process.env['DB_HOST']}:${process.env['DB_PORT']}/${process.env['DB_NAME']}`,
  `?${process.env['DB_PARAMS']}`,
].join('');

const pool = new Pool({
  connectionString: url,
  max: 20,
});
const adapter = new PrismaPg(pool);

// Prevents multiple instances of Prisma Client when using Hot Reload (HMR)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

if (process.env['MODE'] !== 'production') globalForPrisma.prisma = prisma;