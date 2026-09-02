import type { FastifyInstance } from "fastify";
import { eq, inArray, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { orders, orderItems, orderEvents, payments, products } from "../db/schema.js";
import { redis } from "../redis/client.js";
import { k, TTL, QUEUE } from "../redis/keys.js";
import { priceCart } from "../lib/pricing.js";
import { toUnits } from "../lib/money.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { requireCustomer } from "../plugins/auth.js";
import { cartKeyFor, readCartLines } from "./cart.js";
import { enqueue } from "../queues.js";
import { invalidateProducts } from "../redis/cache.js";
import { newId } from "../lib/ids.js";

const checkoutBody = z.object({
  name: z.string().trim().min(1, "Enter a name for the delivery"),
  line1: z.string().trim().min(1, "Enter a street address"),
  city: z.string().trim().min(1, "Enter a city"),
  postal: z.string().trim().min(1, "Enter a postal code"),
  country: z.string().trim().min(2).default("US"),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]).default("card"),
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
  cardBrand: z.string().optional(),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Acquire the per-product checkout lock, retrying for up to ~2s.
 *
 * Returns true if Redis is unreachable: the guarded UPDATE inside the
 * transaction is what actually prevents overselling, so a Redis outage should
 * slow checkout down, not stop it.
 */
async function acquireStockLock(productId: string, orderId: string): Promise<boolean> {
  const deadline = Date.now() + 2000;
  for (let attempt = 0; Date.now() < deadline; attempt++) {
    let result: string | null;
    try {
      result = await redis.set(k.stockLock(productId), orderId, "EX", 10, "NX");
    } catch {
      return true;
    }
    if (result === "OK") return true;
    await sleep(Math.min(25 * 2 ** attempt, 200) + Math.random() * 25);
  }
  return false;
}

export async function checkoutRoutes(app: FastifyInstance) {
  /**
   * The whole reason this file is careful.
   *
   * Today checkout invents `ORD-${9000+rand}` in the browser, passes it through
   * router state, and persists nothing — a refresh loses the order. Here:
   *   1. an idempotency key makes a retry return the original order
   *   2. a Redis lock + hold stops the same unit being sold twice
   *   3. the transaction is what actually decrements stock
   *   4. the order id comes from the database
   */
  app.post("/checkout", { preHandler: requireCustomer }, async (req, reply) => {
    const body = checkoutBody.parse(req.body);
    const customerId = req.session!.userId;

    const idemKey = String(req.headers["idempotency-key"] ?? "").trim();
    if (!idemKey) throw badRequest("An Idempotency-Key header is required for checkout.");

    // A retried request returns the first response rather than a second order.
    const prior = await redis.get(k.idempotency(idemKey)).catch(() => null);
    if (prior) return reply.code(200).send(JSON.parse(prior));

    const cartKey = cartKeyFor(req);
    const lines = await readCartLines(cartKey);
    if (!lines.length) throw badRequest("Your cart is empty.");

    const rows = await db
      .select()
      .from(products)
      .where(inArray(products.id, lines.map((l) => l.productId)));
    const byId = new Map(rows.map((r) => [r.id, r]));

    for (const line of lines) {
      const p = byId.get(line.productId);
      if (!p) throw conflict(`"${line.productId}" is no longer available.`);
      if (p.trackInventory && p.stock < line.qty) {
        throw conflict(`Only ${p.stock} left of ${p.name}.`, { productId: p.id, available: p.stock });
      }
    }

    const priceable = lines.map((l) => ({
      productId: l.productId,
      qty: l.qty,
      unitPriceCents: byId.get(l.productId)!.priceCents,
    }));
    const totals = priceCart(priceable);
    const orderId = newId("ORD");

    // Reserve before touching Postgres. The hold TTL means a crashed process
    // releases stock on its own instead of wedging it forever.
    const held: string[] = [];
    try {
      for (const line of priceable) {
        // The lock is held only for the length of the transaction — a few
        // milliseconds. Failing on the first attempt would reject buyers while
        // stock still exists, so wait briefly instead. Correctness comes from
        // the guarded UPDATE below; this lock only reduces contention on it.
        const acquired = await acquireStockLock(line.productId, orderId);
        if (!acquired) {
          throw conflict("That item is in high demand right now. Try again in a moment.");
        }
        await redis.set(k.stockHold(line.productId, orderId), String(line.qty), "EX", TTL.hold).catch(() => {});
        held.push(line.productId);
      }

      const created = await db.transaction(async (tx) => {
        for (const line of priceable) {
          const p = byId.get(line.productId)!;
          if (!p.trackInventory) continue;
          // The guard is in the WHERE clause, so a concurrent decrement that
          // slipped past the lock still cannot drive stock negative.
          const updated = await tx
            .update(products)
            .set({ stock: raw`${products.stock} - ${line.qty}` })
            .where(raw`${products.id} = ${line.productId} and ${products.stock} >= ${line.qty}`)
            .returning({ id: products.id });
          if (!updated.length) {
            throw conflict(`${p.name} just sold out.`, { productId: p.id });
          }
        }

        await tx.insert(orders).values({
          id: orderId,
          customerId,
          status: "pending",
          subtotalCents: totals.subtotalCents,
          shippingCents: totals.shippingCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          shipName: body.name,
          shipLine1: body.line1,
          shipCity: body.city,
          shipPostal: body.postal,
          shipCountry: body.country,
          idempotencyKey: idemKey,
        });

        await tx.insert(orderItems).values(
          priceable.map((l) => {
            const p = byId.get(l.productId)!;
            return {
              orderId,
              productId: l.productId,
              name: p.name,
              sku: p.sku,
              qty: l.qty,
              unitPriceCents: l.unitPriceCents,
            };
          }),
        );

        await tx.insert(payments).values({
          id: newId("PAY"),
          orderId,
          method: body.paymentMethod,
          brand: body.cardBrand ?? null,
          last4: body.cardLast4 ?? null,
          amountCents: totals.totalCents,
          status: "authorized",
        });

        await tx.insert(orderEvents).values({ orderId, status: "pending", note: "Order placed" });

        return { orderId };
      });

      const response = {
        id: created.orderId,
        status: "pending" as const,
        subtotal: toUnits(totals.subtotalCents),
        shipping: toUnits(totals.shippingCents),
        tax: toUnits(totals.taxCents),
        total: toUnits(totals.totalCents),
        address: { name: body.name, line1: body.line1, city: body.city, postal: body.postal, country: body.country },
        items: priceable.map((l) => ({
          productId: l.productId,
          name: byId.get(l.productId)!.name,
          qty: l.qty,
          unitPrice: toUnits(l.unitPriceCents),
        })),
      };

      await Promise.allSettled([
        redis.set(k.idempotency(idemKey), JSON.stringify(response), "EX", TTL.idempotency),
        redis.del(cartKey),
        ...held.map((id) => redis.del(k.stockHold(id, orderId))),
        ...held.map((id) => redis.del(k.stockLock(id))),
        redis.xadd(k.streamOrder(orderId), "*", "status", "pending"),
        ...priceable.map((l) => redis.zincrby(k.bestsellers("30d"), l.qty, l.productId)),
        redis.incr(k.countPendingOrders()),
      ]);

      await invalidateProducts(priceable.map((l) => l.productId));
      await enqueue(QUEUE.email, "order-confirmation", { orderId: created.orderId, customerId });

      return reply.code(201).send(response);
    } catch (err) {
      // Release eagerly; the TTL is the backstop, not the plan.
      await Promise.allSettled([
        ...held.map((id) => redis.del(k.stockHold(id, orderId))),
        ...held.map((id) => redis.del(k.stockLock(id))),
      ]);
      throw err;
    }
  });

  /** Server-side quote so the cart page never computes money itself. */
  app.get("/checkout/quote", async (req) => {
    if (!req.session) throw unauthorized();
    const lines = await readCartLines(cartKeyFor(req));
    if (!lines.length) return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
    const rows = await db.select().from(products).where(inArray(products.id, lines.map((l) => l.productId)));
    const byId = new Map(rows.map((r) => [r.id, r]));
    const totals = priceCart(
      lines.flatMap((l) => {
        const p = byId.get(l.productId);
        return p ? [{ productId: l.productId, qty: l.qty, unitPriceCents: p.priceCents }] : [];
      }),
    );
    return {
      subtotal: toUnits(totals.subtotalCents),
      shipping: toUnits(totals.shippingCents),
      tax: toUnits(totals.taxCents),
      total: toUnits(totals.totalCents),
    };
  });
}
