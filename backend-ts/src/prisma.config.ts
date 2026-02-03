import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

const url = [
  `postgresql://${encodeURIComponent(process.env['DB_USER']!)}`,
  `:${encodeURIComponent(process.env['DB_PASSWORD']!)}@`,
  `${process.env['DB_HOST']}:${process.env['DB_PORT']}/${process.env['DB_NAME']}`,
  `?${process.env['DB_PARAMS']}`,
].join('');

export default defineConfig({
  schema: '../prisma/schema.prisma',
  datasource: {
    url: url,
  },
  migrations: {
    path: '../prisma/migrations'
  }
});