import { Redis }  from "ioredis";

/*
  connects to Redis server
*/

const redis = new Redis({
  host: process.env['REDIS_HOST'],
  port: 6379
});

export default redis;