import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { categories, products } from "../db/schema.js";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";
import { priceCart } from "../lib/pricing.js";
import { toUnits } from "../lib/money.js";
import { badRequest } from "../lib/errors.js";
import { isProd } from "../env.js";

export const CART_COOKIE = "ic_cart";

/**
 * Carts live in Redis, not Postgres.
 *
 * A guest cart is a hash with a TTL — writing a row for every visitor who adds
 * one item is how you end up with a million abandoned rows. A signed-in cart
 * is the same structure keyed by user id, so sign-in is a merge, not a
 * migration.
 *
 * The TTL is also load-bearing: its expiry event is what triggers the
 * abandoned-cart job (requires `--notify-keyspace-events Ex`).
 */
export function cartKeyFor(req: FastifyRequest, reply?: FastifyReply): string {
  if (req.session?.kind === "customer") return k.userCart(req.session.userId);
  const cookies = req.cookies as Record<string, string | undefined>;
  let id = cookies[CART_COOKIE];
  if (!id) {
    id = randomUUID();
    reply?.setCookie(CART_COOKIE, id, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
      maxAge: TTL.guestCart,
    });
  }
  return k.guestCart(id);
}

export async function readCartLines(cartKey: string): Promise<{ productId: string; qty: number }[]> {
  const hash = await redis.hgetall(cartKey).catch(() => ({} as Record<string, string>));
  return Object.entries(hash)
    .map(([productId, qty]) => ({ productId, qty: Number(qty) }))
    .filter((l) => Number.isFinite(l.qty) && l.qty > 0);
}

/** Expands lines against the catalog and prices them server-side. */
export async function expandCart(cartKey: string) {
  const lines = await readCartLines(cartKey);
  if (!lines.length) {
    return { items: [], count: 0, ...priceCart([]) , subtotal: 0, shipping: 0, tax: 0, total: 0 };
  }

  const rows = await db
    .select({ p: products, categoryName: categories.name })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(inArray(products.id, lines.map((l) => l.productId)));

  const byId = new Map(rows.map((r) => [r.p.id, r]));
  const priceable = lines.flatMap((l) => {
    const row = byId.get(l.productId);
    // A product that no longer exists drops out silently, same as the current
    // client-side expansion does.
    return row ? [{ productId: l.productId, qty: l.qty, unitPriceCents: row.p.priceCents }] : [];
  });

  const totals = priceCart(priceable);
  const items = priceable.map((l) => {
    const row = byId.get(l.productId)!;
    return {
      productId: l.productId,
      name: row.p.name,
      price: toUnits(row.p.priceCents),
      category: row.categoryName,
      categoryId: row.p.categoryId,
      image: row.p.image,
      qty: l.qty,
      stock: row.p.stock,
      lineTotal: toUnits(l.unitPriceCents * l.qty),
    };
  });

  return {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: toUnits(totals.subtotalCents),
    shipping: toUnits(totals.shippingCents),
    tax: toUnits(totals.taxCents),
    total: toUnits(totals.totalCents),
    ...totals,
  };
}

const touch = (key: string) => redis.expire(key, TTL.guestCart).catch(() => {});

export async function cartRoutes(app: FastifyInstance) {
  app.get("/cart", async (req, reply) => expandCart(cartKeyFor(req, reply)));

  app.post("/cart/items", async (req, reply) => {
    const body = z
      .object({ productId: z.string(), qty: z.coerce.number().int().min(1).max(99).default(1) })
      .parse(req.body);

    const [product] = await db.select().from(products).where(eq(products.id, body.productId));
    if (!product) throw badRequest("That product is no longer available.");

    const key = cartKeyFor(req, reply);
    const next = await redis.hincrby(key, body.productId, body.qty);
    // Stock is checked properly at checkout under a lock; this is the early,
    // friendly guard so nobody fills a cart they cannot buy.
    if (product.trackInventory && next > product.stock) {
      await redis.hset(key, body.productId, product.stock);
    }
    await touch(key);
    return expandCart(key);
  });

  app.patch("/cart/items/:productId", async (req, reply) => {
    const { productId } = z.object({ productId: z.string() }).parse(req.params);
    const { qty } = z.object({ qty: z.coerce.number().int().min(0).max(99) }).parse(req.body);
    const key = cartKeyFor(req, reply);
    if (qty === 0) await redis.hdel(key, productId);
    else await redis.hset(key, productId, qty);
    await touch(key);
    return expandCart(key);
  });

  app.delete("/cart/items/:productId", async (req, reply) => {
    const { productId } = z.object({ productId: z.string() }).parse(req.params);
    const key = cartKeyFor(req, reply);
    await redis.hdel(key, productId);
    await touch(key);
    return expandCart(key);
  });

  /** Replaces the whole cart in one atomic write (mobile syncs its local cart at checkout). */
  app.put("/cart", async (req, reply) => {
    const { items } = z
      .object({
        items: z.array(z.object({ productId: z.string(), qty: z.coerce.number().int().min(1).max(99) })).max(100),
      })
      .parse(req.body);

    const wanted = new Map<string, number>();
    for (const i of items) wanted.set(i.productId, (wanted.get(i.productId) ?? 0) + i.qty);

    const rows = wanted.size
      ? await db.select().from(products).where(inArray(products.id, [...wanted.keys()]))
      : [];
    // Unknown or non-active products are dropped; the caller sees them missing.
    const fields: Record<string, number> = {};
    for (const p of rows) {
      if (p.status !== "active") continue;
      const qty = wanted.get(p.id)!;
      const capped = p.trackInventory ? Math.min(qty, p.stock) : qty;
      if (capped > 0) fields[p.id] = capped;
    }

    const key = cartKeyFor(req, reply);
    const tx = redis.multi().del(key);
    if (Object.keys(fields).length) tx.hset(key, fields).expire(key, TTL.guestCart);
    await tx.exec();
    return expandCart(key);
  });

  app.delete("/cart", async (req, reply) => {
    await redis.del(cartKeyFor(req, reply));
    return expandCart(cartKeyFor(req, reply));
  });

  /** Called right after sign-in: fold the guest cart into the user's. */
  app.post("/cart/merge", async (req, reply) => {
    if (req.session?.kind !== "customer") throw badRequest("Sign in first.");
    const cookies = req.cookies as Record<string, string | undefined>;
    const guestId = cookies[CART_COOKIE];
    if (!guestId) return expandCart(k.userCart(req.session.userId));

    const guestKey = k.guestCart(guestId);
    const userKey = k.userCart(req.session.userId);
    const guestLines = await readCartLines(guestKey);
    for (const line of guestLines) await redis.hincrby(userKey, line.productId, line.qty);
    await redis.del(guestKey);
    await touch(userKey);
    reply.clearCookie(CART_COOKIE, { path: "/" });
    return expandCart(userKey);
  });
}
