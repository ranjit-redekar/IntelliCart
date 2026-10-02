import type { FastifyInstance } from "fastify";
import { and, desc, eq, ilike, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { orders, orderItems, orderEvents, customers, feedback, products, wishlistItems, addresses, categories } from "../db/schema.js";
import { requireCustomer } from "../plugins/auth.js";
import { notFound } from "../lib/errors.js";
import { offsetOf, pageQuery, paged } from "../lib/pagination.js";
import { orderOut, orderDetailOut, feedbackOut, productOut } from "../lib/serialize.js";
import { toUnits } from "../lib/money.js";
import { newId } from "../lib/ids.js";

const statusFilter = z.enum(["all", "pending", "processing", "shipped", "delivered"]).default("all");

/** Everything under /account. Scoped to the signed-in customer, always. */
export async function accountRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireCustomer);

  app.get("/account/overview", async (req) => {
    const id = req.session!.userId;
    const [[counts], reviews, wishes] = await Promise.all([
      db.select({
          orders: raw<number>`count(*)::int`,
          spent: raw<number>`coalesce(sum(${orders.totalCents}),0)::int`,
        }).from(orders).where(eq(orders.customerId, id)),
      db.select({ n: raw<number>`count(*)::int` }).from(feedback).where(eq(feedback.customerId, id)),
      db.select({ n: raw<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.customerId, id)),
    ]);
    const orderCount = counts?.orders ?? 0;
    return {
      orders: orderCount,
      totalSpent: toUnits(counts?.spent ?? 0),
      reviews: reviews[0]?.n ?? 0,
      wishlist: wishes[0]?.n ?? 0,
      // Same thresholds the account page applies today.
      tier: orderCount >= 12 ? "VIP" : orderCount >= 6 ? "Loyal" : "New",
    };
  });

  app.get("/account/orders", async (req) => {
    const q = pageQuery.extend({ status: statusFilter }).parse(req.query);
    const filters = [eq(orders.customerId, req.session!.userId)];
    if (q.status !== "all") filters.push(eq(orders.status, q.status));
    if (q.q) filters.push(ilike(orders.id, `%${q.q}%`));
    const where = and(...filters);

    const rows = await db.select({ o: orders, name: customers.name })
      .from(orders).innerJoin(customers, eq(customers.id, orders.customerId))
      .where(where).orderBy(desc(orders.placedAt)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` }).from(orders).where(where);
    return paged(rows.map((r) => orderOut(r.o, r.name)), count, q);
  });

  app.get("/account/orders/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db.select({ o: orders, name: customers.name })
      .from(orders).innerJoin(customers, eq(customers.id, orders.customerId))
      .where(and(eq(orders.id, id), eq(orders.customerId, req.session!.userId)));
    if (!row) throw notFound("No such order.");
    const [items, events] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(orderEvents.at),
    ]);
    return orderDetailOut(row.o, row.name, items, events);
  });

  /* ------------------------------------------------------------ addresses */
  // These are useState-only today and vanish on reload.

  app.get("/account/addresses", async (req) => {
    const items = await db.select().from(addresses).where(eq(addresses.customerId, req.session!.userId));
    return { items };
  });

  app.post("/account/addresses", async (req, reply) => {
    const body = z.object({
      label: z.string().default("Home"), name: z.string().trim().min(1), line1: z.string().trim().min(1),
      line2: z.string().optional(), city: z.string().trim().min(1), postal: z.string().trim().min(1),
      country: z.string().default("US"), phone: z.string().optional(), isDefault: z.boolean().default(false),
    }).parse(req.body);
    const id = newId("ADR");
    if (body.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, req.session!.userId));
    }
    await db.insert(addresses).values({ ...body, id, customerId: req.session!.userId });
    return reply.code(201).send({ id });
  });

  app.patch("/account/addresses/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      label: z.string().optional(), name: z.string().trim().min(1).optional(), line1: z.string().trim().min(1).optional(),
      line2: z.string().optional(), city: z.string().trim().min(1).optional(), postal: z.string().trim().min(1).optional(),
      country: z.string().optional(), phone: z.string().optional(), isDefault: z.boolean().optional(),
    }).parse(req.body);
    if (body.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, req.session!.userId));
    }
    await db.update(addresses).set(body)
      .where(and(eq(addresses.id, id), eq(addresses.customerId, req.session!.userId)));
    return { ok: true };
  });

  app.delete("/account/addresses/:id", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.customerId, req.session!.userId)));
    return { ok: true };
  });

  /* ------------------------------------------------------------- wishlist */
  // Browser-global today: it survives sign-out and leaks between accounts on
  // a shared machine. Scoping it to the customer is the whole fix.

  app.get("/account/wishlist", async (req) => {
    const rows = await db.select({ p: products, categoryName: categories.name })
      .from(wishlistItems)
      .innerJoin(products, eq(products.id, wishlistItems.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(wishlistItems.customerId, req.session!.userId));
    return { items: rows.map((r) => productOut(r.p, r.categoryName)) };
  });

  app.put("/account/wishlist/:productId", async (req) => {
    const { productId } = z.object({ productId: z.string() }).parse(req.params);
    // Unknown ids would otherwise surface as a foreign-key 500.
    const [exists] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
    if (!exists) throw notFound("No such product.");
    await db.insert(wishlistItems)
      .values({ customerId: req.session!.userId, productId })
      .onConflictDoNothing();
    return { ok: true };
  });

  app.delete("/account/wishlist/:productId", async (req) => {
    const { productId } = z.object({ productId: z.string() }).parse(req.params);
    await db.delete(wishlistItems)
      .where(and(eq(wishlistItems.customerId, req.session!.userId), eq(wishlistItems.productId, productId)));
    return { ok: true };
  });

  /* -------------------------------------------------------------- reviews */

  app.get("/account/reviews", async (req) => {
    const q = pageQuery.parse(req.query);
    const rows = await db.select({ f: feedback, productName: products.name, customerName: customers.name })
      .from(feedback)
      .innerJoin(products, eq(products.id, feedback.productId))
      .innerJoin(customers, eq(customers.id, feedback.customerId))
      .where(eq(feedback.customerId, req.session!.userId))
      .orderBy(desc(feedback.createdAt)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` })
      .from(feedback).where(eq(feedback.customerId, req.session!.userId));
    return paged(rows.map((r) => feedbackOut(r.f, r.productName, r.customerName)), count, q);
  });

  /**
   * Review submission. There is no UI for this today and no endpoint either —
   * the storefront can only read reviews. Gated on having actually bought the
   * product, which is the only thing that makes a review worth anything.
   */
  app.post("/account/reviews", async (req, reply) => {
    const body = z.object({
      productId: z.string(),
      rating: z.coerce.number().int().min(1).max(5),
      title: z.string().trim().min(1).max(120),
      body: z.string().trim().min(1).max(4000),
    }).parse(req.body);

    const purchased = await db.select({ n: raw<number>`count(*)::int` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orders.customerId, req.session!.userId), eq(orderItems.productId, body.productId)));
    if ((purchased[0]?.n ?? 0) === 0) {
      return reply.code(403).send({
        error: { code: "forbidden", message: "You can review a product after you have ordered it." },
      });
    }

    const id = newId("FB");
    const sentiment = body.rating >= 4 ? "positive" : body.rating <= 2 ? "negative" : "neutral";
    await db.insert(feedback).values({
      id, productId: body.productId, customerId: req.session!.userId,
      rating: body.rating, title: body.title, body: body.body, sentiment, status: "new",
    });
    return reply.code(201).send({ id });
  });
}
