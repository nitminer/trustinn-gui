import Redis from 'ioredis';

let redisClient: Redis | null = null;

export async function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Create Redis client with retry strategy
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 0,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`[redis] Retry attempt ${times}, delay ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      console.log('[redis] ✅ Connected to Redis');
    });

    redisClient.on('error', (err) => {
      console.error('[redis] ❌ Connection error:', err.message);
    });

    redisClient.on('reconnecting', () => {
      console.log('[redis] 🔄 Reconnecting to Redis...');
    });

    // Test connection
    await redisClient.ping();
    console.log('[redis] ✅ Ping successful');

    return redisClient;
  } catch (error) {
    console.error('[redis] Failed to initialize Redis:', error);
    redisClient = null;
    return null;
  }
}

export async function getRedisClient() {
  if (!redisClient) {
    return await initializeRedis();
  }
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[redis] ✅ Connection closed');
  }
}

export async function getCache(key: string) {
  const redis = await getRedisClient();
  if (!redis) {
    console.warn(`[redis] Cache unavailable for key: ${key}`);
    return null;
  }
  
  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.warn(`[redis] Cache get error for ${key}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function setCache(key: string, value: any, ttl: number = 3600) {
  const redis = await getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[redis] Cache set error for ${key}:`, error);
    return false;
  }
}

export async function deleteCache(key: string) {
  const redis = await getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`[redis] Cache delete error for ${key}:`, error);
    return false;
  }
}

export async function clearCache(pattern: string = '*') {
  const redis = await getRedisClient();
  if (!redis) return false;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[redis] Cleared ${keys.length} cache keys matching ${pattern}`);
    }
    return true;
  } catch (error) {
    console.warn(`[redis] Cache clear error:`, error);
    return false;
  }
}
