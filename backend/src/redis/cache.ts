import { createHash } from "node:crypto";
import { redis } from "./client.js";
import { k, jitter } from "./keys.js";

export const hashOf = (v: unknown) =>
  createHash("sha1").update(JSON.stringify(v)).digest("hex").slice(0, 16);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cache-aside with a stampede lock.
 *
 * On a miss the first caller takes a short lock and fills the cache; the
 * others wait and re-read rather than all hammering Postgres. If the lock
 * holder dies, the lock TTL expires and the next caller just does the work.
 *
 * Redis being down must never fail a read — every path here falls through to
 * `load()`.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
  opts: { tags?: string[] } = {},
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    return load();
  }

  const lockKey = k.cacheLock(key);
  let gotLock = false;
  try {
    gotLock = (await redis.set(lockKey, "1", "EX", 5, "NX")) === "OK";
  } catch {
    return load();
  }

  if (!gotLock) {
    // Someone else is filling it. Wait briefly, then read; if it is still not
    // there, do the work ourselves rather than stalling the request.
    for (let i = 0; i < 10; i++) {
      await sleep(50);
      try {
        const hit = await redis.get(key);
        if (hit) return JSON.parse(hit) as T;
      } catch {
        break;
      }
    }
    return load();
  }

  try {
    const value = await load();
    const pipe = redis.pipeline();
    pipe.set(key, JSON.stringify(value), "EX", jitter(ttlSeconds));
    for (const tag of opts.tags ?? []) {
      pipe.sadd(tag, key);
      pipe.expire(tag, jitter(ttlSeconds) * 2);
    }
    pipe.del(lockKey);
    await pipe.exec();
    return value;
  } catch (err) {
    await redis.del(lockKey).catch(() => {});
    throw err;
  }
}

/**
 * Drop every cache entry that depends on these products, then tell the other
 * API replicas to do the same. Without the publish, a second instance keeps
 * serving a product that this one just changed.
 */
export async function invalidateProducts(productIds: string[]) {
  if (productIds.length === 0) return;
  try {
    const tagKeys = productIds.map(k.tagProduct);
    const dependents = await redis.sunion(...tagKeys);
    const toDrop = [
      ...dependents,
      ...productIds.map(k.product),
      ...productIds.map(k.productExtras),
      k.categories(),
    ];
    if (toDrop.length) await redis.del(...toDrop);
    if (tagKeys.length) await redis.del(...tagKeys);
    await redis.publish(k.chanInvalidate(), JSON.stringify({ productIds }));
  } catch {
    // A failed invalidation means stale-until-TTL, not incorrect data.
  }
}

export async function invalidateKeys(keys: string[]) {
  if (!keys.length) return;
  try {
    await redis.del(...keys);
    await redis.publish(k.chanInvalidate(), JSON.stringify({ keys }));
  } catch {
    /* stale until TTL */
  }
}
