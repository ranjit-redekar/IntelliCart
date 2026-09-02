import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, lte, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { orders, orderItems, products, categories, customers, feedback } from "../db/schema.js";
import { cached } from "../redis/cache.js";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";
import { toUnits } from "../lib/money.js";
import { requirePermission } from "../plugins/auth.js";

const RANGES = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 } as const;
const rangeQuery = z.object({ range: z.enum(["7d", "30d", "90d", "365d"]).default("30d") });

const since = (days: number) => new Date(Date.now() - days * 86_400_000);

/**
 * Dashboard numbers.
 *
 * Today these are six hardcoded const arrays in DashboardPage.tsx, and "today"
 * is pinned to new Date("2026-05-19") so the date picker lines up with the
 * fixtures. Here they are queries, cached per range — which is what makes the
 * date picker mean something.
 *
 * Metrics return NUMBERS. The fixtures carry pre-formatted strings ("$48,290",
 * "+12.4%"); formatting is the UI's job and a formatted string cannot be
 * compared, summed, or charted.
 */
export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requirePermission("orders"));

  app.get("/admin/analytics/metrics", async (req) => {
    const { range } = rangeQuery.parse(req.query);
    const days = RANGES[range];

    return cached(k.metrics(range), TTL.analytics, async () => {
      const from = since(days);
      const prevFrom = since(days * 2);

      const agg = async (start: Date, end: Date) => {
        const [row] = await db.select({
            revenue: raw<number>`coalesce(sum(${orders.totalCents}),0)::int`,
            orderCount: raw<number>`count(*)::int`,
            customerCount: raw<number>`count(distinct ${orders.customerId})::int`,
          }).from(orders).where(and(gte(orders.placedAt, start), lte(orders.placedAt, end)));
        return row ?? { revenue: 0, orderCount: 0, customerCount: 0 };
      };

      const now = new Date();
      const [current, previous] = await Promise.all([agg(from, now), agg(prevFrom, from)]);
      const delta = (a: number, b: number) => (b === 0 ? null : ((a - b) / b) * 100);

      return {
        range,
        metrics: [
          { id: "revenue", label: "Revenue", value: toUnits(current.revenue), unit: "currency",
            trendPct: delta(current.revenue, previous.revenue) },
          { id: "orders", label: "Orders", value: current.orderCount, unit: "count",
            trendPct: delta(current.orderCount, previous.orderCount) },
          { id: "customers", label: "Customers", value: current.customerCount, unit: "count",
            trendPct: delta(current.customerCount, previous.customerCount) },
          { id: "aov", label: "Avg. Order Value",
            value: current.orderCount ? toUnits(Math.round(current.revenue / current.orderCount)) : 0,
            unit: "currency",
            trendPct: delta(
              current.orderCount ? current.revenue / current.orderCount : 0,
              previous.orderCount ? previous.revenue / previous.orderCount : 0,
            ) },
        ],
      };
    });
  });

  app.get("/admin/analytics/revenue-series", async (req) => {
    const { range } = rangeQuery.parse(req.query);
    return cached(k.revenueSeries(range), TTL.analytics, async () => {
      const rows = await db.select({
          day: raw<string>`to_char(date_trunc('day', ${orders.placedAt}), 'YYYY-MM-DD')`,
          revenue: raw<number>`coalesce(sum(${orders.totalCents}),0)::int`,
          orderCount: raw<number>`count(*)::int`,
        }).from(orders)
        .where(gte(orders.placedAt, since(RANGES[range])))
        .groupBy(raw`date_trunc('day', ${orders.placedAt})`)
        .orderBy(raw`date_trunc('day', ${orders.placedAt})`);
      return { range, points: rows.map((r) => ({ d: r.day, revenue: toUnits(r.revenue), orders: r.orderCount })) };
    });
  });

  app.get("/admin/analytics/top-products", async (req) => {
    const { range } = rangeQuery.parse(req.query);
    return cached(k.topProducts(range), TTL.analytics, async () => {
      const rows = await db.select({
          productId: orderItems.productId,
          name: raw<string>`max(${orderItems.name})`,
          sold: raw<number>`sum(${orderItems.qty})::int`,
          revenue: raw<number>`sum(${orderItems.qty} * ${orderItems.unitPriceCents})::int`,
        }).from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(gte(orders.placedAt, since(RANGES[range])))
        .groupBy(orderItems.productId)
        .orderBy(raw`sum(${orderItems.qty} * ${orderItems.unitPriceCents}) desc`)
        .limit(8);
      const total = rows.reduce((s, r) => s + r.revenue, 0);
      return {
        range,
        items: rows.map((r) => ({
          productId: r.productId, name: r.name, sold: r.sold,
          revenue: toUnits(r.revenue),
          sharePct: total ? (r.revenue / total) * 100 : 0,
        })),
      };
    });
  });

  app.get("/admin/analytics/category-share", async (req) => {
    const { range } = rangeQuery.parse(req.query);
    return cached(k.categoryShare(range), TTL.analytics, async () => {
      const rows = await db.select({
          categoryId: products.categoryId,
          name: raw<string>`max(${categories.name})`,
          revenue: raw<number>`sum(${orderItems.qty} * ${orderItems.unitPriceCents})::int`,
        }).from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .innerJoin(products, eq(products.id, orderItems.productId))
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(gte(orders.placedAt, since(RANGES[range])))
        .groupBy(products.categoryId);
      const total = rows.reduce((s, r) => s + r.revenue, 0);
      return {
        range,
        items: rows.map((r) => ({
          categoryId: r.categoryId, name: r.name,
          revenue: toUnits(r.revenue),
          sharePct: total ? (r.revenue / total) * 100 : 0,
        })),
      };
    });
  });

  /** Badge counts for the command bar and insights panel. */
  app.get("/admin/analytics/counts", async () => {
    const cachedCounts = await redis
      .mget(k.countLowStock(), k.countPendingOrders(), k.countNewFeedback())
      .catch(() => [null, null, null]);

    if (cachedCounts.every((v) => v !== null)) {
      return {
        lowStock: Number(cachedCounts[0]),
        pendingOrders: Number(cachedCounts[1]),
        newFeedback: Number(cachedCounts[2]),
      };
    }

    const [low, pending, fb] = await Promise.all([
      db.select({ n: raw<number>`count(*)::int` }).from(products)
        .where(raw`${products.trackInventory} and ${products.stock} < ${products.lowStock}`),
      db.select({ n: raw<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")),
      db.select({ n: raw<number>`count(*)::int` }).from(feedback).where(eq(feedback.status, "new")),
    ]);

    const counts = {
      lowStock: low[0]?.n ?? 0,
      pendingOrders: pending[0]?.n ?? 0,
      newFeedback: fb[0]?.n ?? 0,
    };
    await redis.mset({
      [k.countLowStock()]: counts.lowStock,
      [k.countPendingOrders()]: counts.pendingOrders,
      [k.countNewFeedback()]: counts.newFeedback,
    }).catch(() => {});
    return counts;
  });

  /** Live-derived insights, replacing the client-side scan over bundled arrays. */
  app.get("/admin/analytics/insights", async () => {
    const [lowStock, flagged] = await Promise.all([
      db.select({ id: products.id, name: products.name, stock: products.stock, lowStock: products.lowStock })
        .from(products).where(raw`${products.stock} < ${products.lowStock}`).limit(5),
      db.select({ n: raw<number>`count(*)::int` }).from(feedback).where(eq(feedback.status, "flagged")),
    ]);

    const insights = [
      ...lowStock.map((p) => ({
        id: `stock-${p.id}`, tone: "danger" as const,
        title: `${p.name} is below its reorder point`,
        body: `${p.stock} left, threshold is ${p.lowStock}.`,
        href: `/products/${p.id}`,
      })),
    ];
    if ((flagged[0]?.n ?? 0) > 0) {
      insights.push({
        id: "feedback-flagged", tone: "danger" as const,
        title: `${flagged[0]!.n} reviews are flagged`,
        body: "Flagged reviews are hidden from the storefront until resolved.",
        href: "/feedback",
      });
    }
    return { items: insights };
  });
}
