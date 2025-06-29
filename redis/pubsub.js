import { createClient } from "redis";

const pub = createClient({
  socket: {
    host: process.env.REDIS_HOST,       // e.g. redis-xxxxx.c123.us-east-1-4.ec2.cloud.redislabs.com
    port: parseInt(process.env.REDIS_PORT, 10), // e.g. 11123                        // required for Redis Cloud
  },
  password: process.env.REDIS_PASSWORD,
});

const sub = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  },
  password: process.env.REDIS_PASSWORD,
});

await pub.connect();
await sub.connect();

export { pub, sub };
