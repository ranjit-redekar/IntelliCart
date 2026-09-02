import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, ilike, inArray, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  products, categories, productImages, productSpecs, productHighlights,
  orders, orderItems, orderEvents, payments, customers, feedback, auditLog,
} from "../db/schema.js";
import { requirePermission } from "../plugins/auth.js";
import { notFound, badRequest } from "../lib/errors.js";
import { offsetOf, pageQuery, paged } from "../lib/pagination.js";
import { productAdminOut, orderOut, orderDetailOut, feedbackOut } from "../lib/serialize.js";
import { toCents, toUnits } from "../lib/money.js";
import { invalidateProducts } from "../redis/cache.js";
import { redis } from "../redis/client.js";
import { k } from "../redis/keys.js";
import { newId } from "../lib/ids.js";

/** Audit writes go through Redis and are flushed in batches by the worker. */
async function audit(req: any, action: string, entity: string, entityId?: string, meta?: unknown) {
  const entry = {
    actorId: req.session?.userId ?? null,
    actorEmail: req.session?.email ?? null,
    action, entity, entityId: entityId ?? null,
    meta: meta ? JSON.stringify(meta) : null,
    at: new Date().toISOString(),
  };
  const ok = await redis.xadd(k.streamAudit(), "*", "entry", JSON.stringify(entry)).catch(() => null);
  // If Redis is unavailable the audit entry still has to land.
  if (!ok) {
    await db.insert(auditLog).values({
      actorId: entry.actorId, actorEmail: entry.actorEmail, action, entity,
      entityId: entry.entityId, meta: (meta as Record<string, unknown>) ?? null,
    }).catch(() => {});
  }
}

const productBody = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().default(""),
  sku: z.string().trim().min(1, "SKU is required"),
  categoryId: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  comparePrice: z.coerce.number().nonnegative().nullish(),
  cost: z.coerce.number().nonnegative().nullish(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStock: z.coerce.number().int().min(0).default(10),
  trackInventory: z.boolean().default(true),
  image: z.string().default(""),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  tags: z.array(z.string()).default([]),
  images: z.array(z.object({
    id: z.string(), initials: z.string().default(""),
    theme: z.enum(["brand", "violet", "mint", "amber", "rose"]).default("brand"),
    caption: z.string().optional(), url: z.string().optional(),
  })).default([]),
  specs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  highlights: z.array(z.string()).default([]),
  inBox: z.array(z.string()).default([]),
});

async function writeProductChildren(tx: any, productId: string, body: z.infer<typeof productBody>) {
  await tx.delete(productImages).where(eq(productImages.productId, productId));
  await tx.delete(productSpecs).where(eq(productSpecs.productId, productId));
  await tx.delete(productHighlights).where(eq(productHighlights.productId, productId));

  if (body.images.length) {
    await tx.insert(productImages).values(body.images.map((im, i) => ({
      id: `${productId}-IMG-${i}`, productId, url: im.url ?? null, initials: im.initials,
      theme: im.theme, caption: im.caption ?? null, position: i,
    })));
  }
  if (body.specs.length) {
    await tx.insert(productSpecs).values(body.specs.map((s, i) => ({ productId, key: s.key, value: s.value, position: i })));
  }
  const highlights = [
    ...body.highlights.map((text, i) => ({ productId, text, kind: "highlight" as const, position: i })),
    ...body.inBox.map((text, i) => ({ productId, text, kind: "inbox" as const, position: i })),
  ];
  if (highlights.length) await tx.insert(productHighlights).values(highlights);
}

export async function adminRoutes(app: FastifyInstance) {
  /* ------------------------------------------------------------- products */
  // The admin form is 676 lines and currently saves nothing: handleSubmit
  // validates, then navigates away.

  app.get("/admin/products", { preHandler: requirePermission("products") }, async (req) => {
    const q = pageQuery.extend({
      cat: z.string().optional(),
      status: z.enum(["all", "draft", "active", "archived"]).default("all"),
    }).parse(req.query);

    const filters = [];
    if (q.cat && q.cat !== "all") filters.push(eq(products.categoryId, q.cat));
    if (q.status !== "all") filters.push(eq(products.status, q.status));
    if (q.q) filters.push(or(ilike(products.name, `%${q.q}%`), ilike(products.sku, `%${q.q}%`))!);
    const where = filters.length ? and(...filters) : undefined;

    const rows = await db.select({ p: products, categoryName: categories.name })
      .from(products).innerJoin(categories, eq(categories.id, products.categoryId))
      .where(where).orderBy(asc(products.id)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` }).from(products).where(where);
    return paged(rows.map((r) => productAdminOut(r.p, r.categoryName)), count, q);
  });

  app.post("/admin/products", { preHandler: requirePermission("products") }, async (req, reply) => {
    const body = productBody.parse(req.body);
    const id = newId("P");
    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id, name: body.name, description: body.description, sku: body.sku,
        categoryId: body.categoryId, priceCents: toCents(body.price),
        comparePriceCents: body.comparePrice == null ? null : toCents(body.comparePrice),
        costCents: body.cost == null ? null : toCents(body.cost),
        stock: body.stock, lowStock: body.lowStock, trackInventory: body.trackInventory,
        image: body.image, status: body.status, tags: body.tags,
      });
      await writeProductChildren(tx, id, body);
    });
    await invalidateProducts([id]);
    await audit(req, "product.create", "product", id);
    return reply.code(201).send({ id });
  });

  app.get("/admin/products/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db.select({ p: products, categoryName: categories.name })
      .from(products).innerJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(products.id, id));
    if (!row) throw notFound("No such product.");
    const [images, specs, highlights] = await Promise.all([
      db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.position)),
      db.select().from(productSpecs).where(eq(productSpecs.productId, id)).orderBy(asc(productSpecs.position)),
      db.select().from(productHighlights).where(eq(productHighlights.productId, id)).orderBy(asc(productHighlights.position)),
    ]);
    // Real sales history. The admin page used to reconstruct it by running the
    // hash-derivation over every order and checking whether this SKU fell out.
    const salesRows = await db
      .select({
        orderId: orders.id,
        placedAt: orders.placedAt,
        status: orders.status,
        customerName: customers.name,
        qty: orderItems.qty,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(orderItems.productId, id))
      .orderBy(desc(orders.placedAt))
      .limit(50);

    const [reviewStats] = await db
      .select({
        count: raw<number>`count(*)::int`,
        avg: raw<number>`coalesce(round(avg(${feedback.rating})::numeric, 1), 0)::float8`,
        positive: raw<number>`count(*) filter (where ${feedback.rating} >= 4)::int`,
      })
      .from(feedback)
      .where(eq(feedback.productId, id));

    return {
      ...productAdminOut(row.p, row.categoryName),
      images: images.map((i) => ({ id: i.id, initials: i.initials, theme: i.theme, caption: i.caption ?? undefined, url: i.url ?? undefined })),
      specs: specs.map((s) => ({ key: s.key, value: s.value })),
      highlights: highlights.filter((h) => h.kind === "highlight").map((h) => h.text),
      inBox: highlights.filter((h) => h.kind === "inbox").map((h) => h.text),
      sales: {
        unitsSold: salesRows.reduce((n, r) => n + r.qty, 0),
        revenue: toUnits(salesRows.reduce((n, r) => n + r.qty * r.unitPriceCents, 0)),
        buyers: new Set(salesRows.map((r) => r.customerName)).size,
        orders: salesRows.map((r) => ({
          orderId: r.orderId,
          placedAt: r.placedAt.toISOString().slice(0, 10),
          status: r.status,
          customerName: r.customerName,
          qty: r.qty,
        })),
      },
      reviews: {
        count: reviewStats?.count ?? 0,
        average: reviewStats?.avg ?? 0,
        positiveShare: reviewStats?.count
          ? Math.round(((reviewStats.positive ?? 0) / reviewStats.count) * 100)
          : 0,
      },
    };
  });

  app.put("/admin/products/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = productBody.parse(req.body);
    await db.transaction(async (tx) => {
      const updated = await tx.update(products).set({
        name: body.name, description: body.description, sku: body.sku,
        categoryId: body.categoryId, priceCents: toCents(body.price),
        comparePriceCents: body.comparePrice == null ? null : toCents(body.comparePrice),
        costCents: body.cost == null ? null : toCents(body.cost),
        stock: body.stock, lowStock: body.lowStock, trackInventory: body.trackInventory,
        image: body.image, status: body.status, tags: body.tags, updatedAt: new Date(),
      }).where(eq(products.id, id)).returning({ id: products.id });
      if (!updated.length) throw notFound("No such product.");
      await writeProductChildren(tx, id, body);
    });
    await invalidateProducts([id]);
    await audit(req, "product.update", "product", id);
    return { ok: true };
  });

  app.delete("/admin/products/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    // Archive rather than delete: order_items reference products.
    await db.update(products).set({ status: "archived" }).where(eq(products.id, id));
    await invalidateProducts([id]);
    await audit(req, "product.archive", "product", id);
    return { ok: true };
  });

  /* --------------------------------------------------------------- orders */

  app.get("/admin/orders", { preHandler: requirePermission("orders") }, async (req) => {
    const q = pageQuery.extend({
      status: z.enum(["all", "pending", "processing", "shipped", "delivered"]).default("all"),
    }).parse(req.query);
    const filters = [];
    if (q.status !== "all") filters.push(eq(orders.status, q.status));
    if (q.q) filters.push(or(ilike(orders.id, `%${q.q}%`), ilike(customers.name, `%${q.q}%`))!);
    const where = filters.length ? and(...filters) : undefined;

    const rows = await db.select({ o: orders, name: customers.name })
      .from(orders).innerJoin(customers, eq(customers.id, orders.customerId))
      .where(where).orderBy(desc(orders.placedAt)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` })
      .from(orders).innerJoin(customers, eq(customers.id, orders.customerId)).where(where);
    return paged(rows.map((r) => orderOut(r.o, r.name)), count, q);
  });

  app.get("/admin/orders/:id", { preHandler: requirePermission("orders") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db.select({ o: orders, name: customers.name })
      .from(orders).innerJoin(customers, eq(customers.id, orders.customerId)).where(eq(orders.id, id));
    if (!row) throw notFound("No such order.");
    const [items, events, paymentRows] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(orderEvents.at),
      db.select().from(payments).where(eq(payments.orderId, id)),
    ]);
    const payment = paymentRows[0];
    return {
      ...orderDetailOut(row.o, row.name, items, events),
      customerId: row.o.customerId,
      // The real charge. The admin page used to pick a brand and last-4 out of
      // a four-entry pool keyed by a hash of the customer's display name.
      payment: payment
        ? {
            method: payment.method,
            brand: payment.brand,
            last4: payment.last4,
            amount: toUnits(payment.amountCents),
            status: payment.status,
          }
        : null,
    };
  });

  /** Status transitions. The current UI renders a timeline it cannot advance. */
  const FLOW = ["pending", "processing", "shipped", "delivered"] as const;
  app.patch("/admin/orders/:id/status", { preHandler: requirePermission("orders") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { status, note } = z.object({
      status: z.enum(FLOW), note: z.string().optional(),
    }).parse(req.body);

    const [current] = await db.select().from(orders).where(eq(orders.id, id));
    if (!current) throw notFound("No such order.");
    const from = FLOW.indexOf(current.status);
    const to = FLOW.indexOf(status);
    if (to < from) throw badRequest(`An order cannot go back from ${current.status} to ${status}.`);
    if (to === from) return { ok: true, status };

    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status }).where(eq(orders.id, id));
      await tx.insert(orderEvents).values({ orderId: id, status, note: note ?? null });
    });
    await redis.xadd(k.streamOrder(id), "*", "status", status).catch(() => {});
    if (current.status === "pending") await redis.decr(k.countPendingOrders()).catch(() => {});
    await audit(req, "order.status", "order", id, { from: current.status, to: status });
    return { ok: true, status };
  });

  /* ------------------------------------------------------------ customers */

  app.get("/admin/customers", { preHandler: requirePermission("customers") }, async (req) => {
    const q = pageQuery.parse(req.query);
    const where = q.q
      ? or(ilike(customers.name, `%${q.q}%`), ilike(customers.email, `%${q.q}%`))
      : undefined;
    const rows = await db.select({
        c: customers,
        orderCount: raw<number>`(select count(*) from orders o where o.customer_id = ${customers.id})::int`,
        spent: raw<number>`(select coalesce(sum(o.total_cents),0) from orders o where o.customer_id = ${customers.id})::int`,
      }).from(customers).where(where).orderBy(asc(customers.id)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` }).from(customers).where(where);
    return paged(
      rows.map((r) => ({
        id: r.c.id, name: r.c.name, email: r.c.email,
        orders: r.orderCount, totalSpent: toUnits(r.spent),
        createdAt: r.c.createdAt.toISOString(),
      })),
      count, q,
    );
  });

  app.get("/admin/customers/:id", { preHandler: requirePermission("customers") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) throw notFound("No such customer.");
    const [customerOrders, reviews] = await Promise.all([
      db.select({ o: orders, name: customers.name }).from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .where(eq(orders.customerId, id)).orderBy(desc(orders.placedAt)),
      db.select({ f: feedback, productName: products.name, customerName: customers.name })
        .from(feedback)
        .innerJoin(products, eq(products.id, feedback.productId))
        .innerJoin(customers, eq(customers.id, feedback.customerId))
        .where(eq(feedback.customerId, id)),
    ]);
    return {
      // No fabricated phone, address or join date derived from a hash of the id.
      id: customer.id, name: customer.name, email: customer.email,
      createdAt: customer.createdAt.toISOString(),
      orders: customerOrders.map((r) => orderOut(r.o, r.name)),
      reviews: reviews.map((r) => feedbackOut(r.f, r.productName, r.customerName)),
      totalSpent: toUnits(customerOrders.reduce((s, r) => s + r.o.totalCents, 0)),
    };
  });

  /* ------------------------------------------------------------- feedback */

  app.get("/admin/feedback", { preHandler: requirePermission("customers") }, async (req) => {
    const q = pageQuery.extend({
      status: z.enum(["all", "new", "replied", "flagged", "archived"]).default("all"),
      sentiment: z.enum(["all", "positive", "neutral", "negative"]).default("all"),
    }).parse(req.query);
    const filters = [];
    if (q.status !== "all") filters.push(eq(feedback.status, q.status));
    if (q.sentiment !== "all") filters.push(eq(feedback.sentiment, q.sentiment));
    if (q.q) filters.push(or(ilike(feedback.title, `%${q.q}%`), ilike(feedback.body, `%${q.q}%`))!);
    const where = filters.length ? and(...filters) : undefined;

    const rows = await db.select({ f: feedback, productName: products.name, customerName: customers.name })
      .from(feedback)
      .innerJoin(products, eq(products.id, feedback.productId))
      .innerJoin(customers, eq(customers.id, feedback.customerId))
      .where(where).orderBy(desc(feedback.createdAt)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` }).from(feedback).where(where);

    // Catalog-wide summary rides along in the same response. The header cards
    // describe the whole corpus, not the page — computing them from `rows`
    // would make them change as you paginate.
    const [summary] = await db.select({
      total: raw<number>`count(*)::int`,
      avgRating: raw<number>`coalesce(round(avg(${feedback.rating})::numeric, 1), 0)::float8`,
      awaiting: raw<number>`count(*) filter (where ${feedback.status} in ('new','flagged'))::int`,
      replied: raw<number>`count(*) filter (where ${feedback.status} = 'replied')::int`,
      flagged: raw<number>`count(*) filter (where ${feedback.status} = 'flagged')::int`,
    }).from(feedback);

    return {
      ...paged(rows.map((r) => feedbackOut(r.f, r.productName, r.customerName)), count, q),
      summary: summary ?? { total: 0, avgRating: 0, awaiting: 0, replied: 0, flagged: 0 },
    };
  });

  /** The reply editor currently holds a draft in state and discards it. */
  app.patch("/admin/feedback/:id", { preHandler: requirePermission("customers") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      reply: z.string().trim().max(4000).optional(),
      status: z.enum(["new", "replied", "flagged", "archived"]).optional(),
    }).parse(req.body);

    const patch: Record<string, unknown> = {};
    if (body.reply !== undefined) {
      patch.reply = body.reply;
      patch.repliedAt = new Date();
      patch.status = body.status ?? "replied";
    }
    if (body.status !== undefined) patch.status = body.status;
    if (!Object.keys(patch).length) throw badRequest("Nothing to update.");

    const updated = await db.update(feedback).set(patch).where(eq(feedback.id, id)).returning({ id: feedback.id });
    if (!updated.length) throw notFound("No such review.");
    await audit(req, "feedback.update", "feedback", id, patch);
    return { ok: true };
  });

  /* ------------------------------------------------------------ audit log */

  app.get("/admin/audit", { preHandler: requirePermission("audit") }, async (req) => {
    const q = pageQuery.extend({ entity: z.string().optional() }).parse(req.query);
    const where = q.entity ? eq(auditLog.entity, q.entity) : undefined;
    const rows = await db.select().from(auditLog).where(where)
      .orderBy(desc(auditLog.at)).limit(q.pageSize).offset(offsetOf(q));
    const [{ count } = { count: 0 }] = await db.select({ count: raw<number>`count(*)::int` }).from(auditLog).where(where);
    return paged(rows, count, q);
  });
}
