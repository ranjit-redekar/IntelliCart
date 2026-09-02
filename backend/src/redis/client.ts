import { Redis } from "ioredis";
import { env } from "../env.js";

// Three connections, because ioredis puts a subscriber into a mode where it
// can't run normal commands, and BullMQ requires maxRetriesPerRequest: null.
export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });
export const subscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const queueConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export async function redisReady(): Promise<boolean> {
  try {
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), subscriber.quit(), queueConnection.quit()]);
}
