import { Redis }  from "ioredis";

/*
  connects to Redis server
*/

interface RedisOptions {
  host: string,
  port: number,
  password?: string,
  tls?: {}
}

const redisOptions : RedisOptions = {
  host: process.env['REDIS_HOST']!,
  port: Number(process.env['REDIS_PORT']),
};

if (process.env['MODE'] === 'production') {
  // redisOptions.password = process.env['REDIS_PASSWORD']!;
  redisOptions.tls = {}
}

const redis = new Redis(redisOptions);

redis.on('error', (err) => {
  console.error('Redis Error');
});

export default redis;