import { defineConfig, env } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'), // Still uses your .env variable!
  },
  migrations: {
    path: 'prisma/migrations'
  }
});