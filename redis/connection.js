import Redis from 'ioredis';

const client = new Redis({
  host: process.env.REDIS_HOST,               // e.g., 'redis-xxxx.c123.us-east-1-4.ec2.cloud.redislabs.com'
  port: parseInt(process.env.REDIS_PORT, 10), // e.g., 11123
  password: process.env.REDIS_PASSWORD,       // From Redis Cloud dashboard                                   // Required for Redis Cloud
});

client.on('connect', () => {
  console.log('🔌 Connected to Redis Cloud');
});

client.on('ready', () => {
  console.log('✅ Redis client is ready to use');
});

client.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

client.on('close', () => {
  console.log('❎ Redis connection closed');
});

export default client;
