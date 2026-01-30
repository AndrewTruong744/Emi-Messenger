// to let TypeScript know the structure of environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REFRESH_TOKEN_SECRET: string;
      ACCESS_TOKEN_SECRET: string;
      MODE: string;
      ORIGIN: string;
      SUBDOMAIN: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      REDIS_HOST: string,
      REDIS_PORT: string,
    }
  }
}