import { randomBytes } from "node:crypto";

/**
 * Collision-resistant, roughly time-sortable public id.
 *
 * Two lessons are baked into this, both found by tests rather than review:
 *
 *  1. A bare `Date.now().toString(36)` collides outright — two checkouts in the
 *     same millisecond produced the same id and the second died on orders_pkey
 *     during a six-way concurrent checkout.
 *  2. Three random bytes was still not enough: 16.7M values means a birthday
 *     collision shows up within a few thousand ids generated in one
 *     millisecond, which the uniqueness check duly found.
 *
 * Eight random bytes (1.8e19 values) puts a collision far below the odds of
 * any other failure in the system.
 */
const RANDOM_LEN = 13; // base36 width of 8 bytes

export const newId = (prefix: string) => {
  const time = Date.now().toString(36).toUpperCase();
  const rand = BigInt("0x" + randomBytes(8).toString("hex"))
    .toString(36)
    .toUpperCase()
    .padStart(RANDOM_LEN, "0");
  return `${prefix}-${time}${rand}`;
};
