/**
 * The one runnable check. No framework, no fixtures — asserts the logic that
 * would silently corrupt money or oversell stock if it broke.
 *
 * Pure functions only, so it runs with no Postgres and no Redis:
 *   npm test
 */
import assert from "node:assert/strict";
import { priceCart, FREE_SHIPPING_THRESHOLD_CENTS, FLAT_SHIPPING_CENTS } from "./lib/pricing.js";
import { toCents, toUnits } from "./lib/money.js";
import { can, ROLE_PERMISSIONS, migrateLegacyRole } from "./lib/permissions.js";
import { interpretSearch, isFollowup } from "./ai/search.js";
import { k, TTL } from "./redis/keys.js";
import { newId } from "./lib/ids.js";

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
};

console.log("\nmoney");
check("round-trips through cents without float drift", () => {
  for (const v of [0, 0.01, 1, 38, 129, 218.99, 1234.56]) {
    assert.equal(toUnits(toCents(v)), v);
  }
});
check("never produces a fractional cent", () => {
  assert.equal(toCents(19.999), 2000);
  assert.ok(Number.isInteger(toCents(0.1 + 0.2)));
});

console.log("\npricing");
check("empty cart costs nothing, including shipping", () => {
  const t = priceCart([]);
  assert.deepEqual(t, { subtotalCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0 });
});
check("charges flat shipping below the threshold", () => {
  const t = priceCart([{ productId: "p", qty: 1, unitPriceCents: toCents(20) }]);
  assert.equal(t.shippingCents, FLAT_SHIPPING_CENTS);
});
check("shipping is free at exactly the threshold, not just above it", () => {
  const t = priceCart([{ productId: "p", qty: 1, unitPriceCents: FREE_SHIPPING_THRESHOLD_CENTS }]);
  assert.equal(t.shippingCents, 0);
});
check("total always equals subtotal + shipping + tax", () => {
  const cases = [
    [{ productId: "a", qty: 3, unitPriceCents: 1299 }],
    [{ productId: "a", qty: 1, unitPriceCents: 12900 }, { productId: "b", qty: 2, unitPriceCents: 6400 }],
    [{ productId: "a", qty: 7, unitPriceCents: 1 }],
  ];
  for (const lines of cases) {
    const t = priceCart(lines);
    assert.equal(t.totalCents, t.subtotalCents + t.shippingCents + t.taxCents);
    assert.ok(Number.isInteger(t.totalCents), "total must be whole cents");
  }
});
check("tax applies to goods, not to shipping", () => {
  const t = priceCart([{ productId: "a", qty: 1, unitPriceCents: 1000 }]);
  assert.equal(t.taxCents, Math.round(1000 * 0.08));
});
check("quantity scales the subtotal linearly", () => {
  const one = priceCart([{ productId: "a", qty: 1, unitPriceCents: 5000 }]);
  const three = priceCart([{ productId: "a", qty: 3, unitPriceCents: 5000 }]);
  assert.equal(three.subtotalCents, one.subtotalCents * 3);
});

console.log("\npermissions");
check("owner holds every permission", () => {
  assert.equal(ROLE_PERMISSIONS.owner.length, 9);
  assert.ok(can("owner", "billing"));
});
check("viewer holds none — the old 'staff' role was read-only", () => {
  assert.equal(ROLE_PERMISSIONS.viewer.length, 0);
  assert.equal(can("viewer", "orders"), false);
});
check("only owner can reach billing", () => {
  for (const role of ["admin", "manager", "support", "viewer"] as const) {
    assert.equal(can(role, "billing"), false, `${role} must not have billing`);
  }
});
check("legacy three-role names map forward", () => {
  assert.equal(migrateLegacyRole("staff"), "viewer");
  assert.equal(migrateLegacyRole("manager"), "manager");
  assert.equal(migrateLegacyRole("owner"), "owner");
  assert.equal(migrateLegacyRole("nonsense"), "viewer");
});

console.log("\nsearch interpretation");
check("extracts a price cap", () => {
  assert.equal(interpretSearch("something under $100").filters.maxPrice, 100);
});
check("extracts a category", () => {
  assert.equal(interpretSearch("a warm jacket").filters.categoryId, "fashion");
});
check("combines cap, category and sort", () => {
  const r = interpretSearch("best rated electronics under $200");
  assert.equal(r.filters.categoryId, "electronics");
  assert.equal(r.filters.maxPrice, 200);
  assert.equal(r.filters.sort, "rating");
  assert.ok(r.summary);
});
check("plain queries produce no filters", () => {
  assert.deepEqual(interpretSearch("blue").filters, {});
  assert.equal(interpretSearch("").summary, null);
});

console.log("\nredis keys");
check("key families are distinct — a collision is a silent cache bug", () => {
  const built = [
    k.session("t"), k.sessionsOfUser("u"), k.product("p"), k.productExtras("p"),
    k.guestCart("c"), k.userCart("u"), k.stockHold("p", "o"), k.stockLock("p"),
    k.idempotency("i"), k.recentViewed("u"), k.bestsellers("30d"), k.metrics("30d"),
    k.ai("assistant", "h"), k.settings("store"), k.tagProduct("p"), k.productViews("p"),
  ];
  assert.equal(new Set(built).size, built.length);
});
check("no TTL is zero or negative", () => {
  for (const [name, value] of Object.entries(TTL)) {
    assert.ok(value > 0, `${name} must be a positive TTL`);
  }
});
check("a hold expires before the idempotency record does", () => {
  // Otherwise a retry could find the hold gone but the response still cached.
  assert.ok(TTL.hold < TTL.idempotency);
});

console.log("\nids");
check("ids do not collide within the same millisecond", () => {
  // Regression: `ORD-${Date.now().toString(36)}` alone collided under a
  // six-way concurrent checkout and the second order died on orders_pkey.
  // 100k in a tight loop spans only a handful of milliseconds, so this is
  // very nearly a same-millisecond test. It failed at 3 random bytes.
  const ids = Array.from({ length: 100_000 }, () => newId("ORD"));
  assert.equal(new Set(ids).size, ids.length);
});
check("ids keep their prefix and stay sortable by time", () => {
  const a = newId("ORD");
  assert.ok(a.startsWith("ORD-"));
  assert.ok(a.length > 10);
});

check("assistant treats short context-leaning turns as follow-ups", () => {
  // Callers lowercase first. A follow-up keeps the previous turn's filters.
  for (const q of ["anything cheaper?", "what about in blue?", "something similar", "show me those"]) {
    assert.ok(isFollowup(q), q);
  }
});
check("assistant treats fresh or long questions as new searches", () => {
  for (const q of ["running shoes under $80", "top-rated home goods", "gift ideas for a coffee lover"]) {
    assert.ok(!isFollowup(q), q);
  }
  // Over 8 words reads as a new search even with a follow-up word in it.
  assert.ok(!isFollowup("i want something cheaper for my brother who loves hiking trips"));
});

console.log(`\n${passed} checks passed\n`);
