import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, lte, inArray, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { products, categories, orders, orderItems, feedback } from "../db/schema.js";
import { toUnits } from "../lib/money.js";
import { requirePermission } from "../plugins/auth.js";
import { notFound } from "../lib/errors.js";
import { assistantAnswer, type CatalogItem } from "../ai/assistant.js";
import { interpretSearch } from "../ai/search.js";
import { aiEnabled } from "../env.js";

/** The 24 AI Hub copilots. */
const COPILOTS = [
  "sales-copilot", "content-studio", "smart-search", "support-assistant",
  "promotion-optimizer", "anomaly-alerts", "review-summarizer", "forecasting",
  "trend-spotter", "daily-briefing", "inventory-agent", "segments",
  "win-back", "bundles", "pricing", "returns-analyzer", "cart-recovery",
  "product-health", "risk", "catalog-audit", "vendors", "localization-agent",
  "campaigns", "logistics",
] as const;
type Copilot = (typeof COPILOTS)[number];

export async function aiRoutes(app: FastifyInstance) {
  /* --------------------------------------------------- storefront assistant */

  app.post("/ai/assistant", async (req) => {
    const { prompt } = z.object({ prompt: z.string().trim().min(1).max(500) }).parse(req.body);

    // Ground the model in real catalog rows. It is told it may not refer to
    // anything outside this list, which is what stops invented products.
    const interpreted = interpretSearch(prompt);
    const filters = [eq(products.status, "active")];
    if (interpreted.filters.categoryId) filters.push(eq(products.categoryId, interpreted.filters.categoryId));
    if (interpreted.filters.maxPrice != null) {
      filters.push(lte(products.priceCents, interpreted.filters.maxPrice * 100));
    }
    if (interpreted.filters.minRating != null) filters.push(gte(products.rating, interpreted.filters.minRating));

    const rows = await db
      .select({ p: products, categoryName: categories.name })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...filters))
      .orderBy(desc(products.rating))
      .limit(8);

    const matches: CatalogItem[] = rows.map((r) => ({
      id: r.p.id, name: r.p.name, category: r.categoryName,
      price: toUnits(r.p.priceCents), rating: r.p.rating, stock: r.p.stock,
    }));

    const answer = await assistantAnswer(prompt, matches);
    return { ...answer, interpretation: interpreted.summary };
  });

  app.get("/ai/search", async (req) => {
    const { q } = z.object({ q: z.string().default("") }).parse(req.query);
    return interpretSearch(q);
  });

  /* --------------------------------------------------------- admin copilots */
  /**
   * All 24 share one route shape and one contract. Most are computed from real
   * data below; the rest return an empty result set with `available: false`
   * rather than fabricated numbers, because a plausible invented figure on an
   * analytics screen is worse than a blank one.
   */
  app.get("/admin/ai/copilots", { preHandler: requirePermission("ai") }, async () => ({
    items: COPILOTS.map((id) => ({ id, modelBacked: id === "smart-search" ? aiEnabled : false })),
  }));

  app.get("/admin/ai/:copilot", { preHandler: requirePermission("ai") }, async (req) => {
    const { copilot } = z.object({ copilot: z.enum(COPILOTS) }).parse(req.params);
    const data = await copilotData(copilot);
    if (!data) throw notFound("No such copilot.");
    return data;
  });
}

/**
 * Units sold per product in the last 30 days.
 *
 * One grouped aggregate rather than a correlated subquery per row: the
 * subquery form also produced an ambiguous `id` reference once `orders` and
 * `order_items` were both in scope.
 */
async function soldLast30Days(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      productId: orderItems.productId,
      qty: raw<number>`sum(${orderItems.qty})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(gte(orders.placedAt, new Date(Date.now() - 30 * 86_400_000)))
    .groupBy(orderItems.productId);
  return new Map(rows.flatMap((r) => (r.productId ? [[r.productId, r.qty] as const] : [])));
}

async function copilotData(copilot: Copilot): Promise<unknown> {
  switch (copilot) {
    /** Reorder suggestions from actual stock and actual sales velocity. */
    case "inventory-agent": {
      const [catalog, sold] = await Promise.all([
        db.select({
          id: products.id, name: products.name, sku: products.sku,
          stock: products.stock, lowStock: products.lowStock,
        }).from(products).where(eq(products.trackInventory, true)),
        soldLast30Days(),
      ]);
      const rows = catalog.map((c) => ({ ...c, sold30: sold.get(c.id) ?? 0 }));

      const reorder = rows
        .map((r) => {
          const velocity = r.sold30 / 30;
          const daysCover = velocity > 0 ? r.stock / velocity : Infinity;
          return {
            sku: r.sku, productId: r.id, name: r.name, stock: r.stock,
            velocityPerDay: Number(velocity.toFixed(2)),
            daysCover: Number.isFinite(daysCover) ? Math.round(daysCover) : null,
            suggestQty: velocity > 0 ? Math.max(0, Math.ceil(velocity * 45 - r.stock)) : 0,
            severity: !Number.isFinite(daysCover) ? "none" : daysCover < 7 ? "high" : daysCover < 21 ? "medium" : "low",
          };
        })
        .filter((r) => r.severity === "high" || r.severity === "medium")
        .sort((a, b) => (a.daysCover ?? 999) - (b.daysCover ?? 999));

      const slowMovers = rows
        .filter((r) => r.sold30 === 0 && r.stock > 0)
        .map((r) => ({ sku: r.sku, productId: r.id, name: r.name, stock: r.stock }));

      return { available: true, reorder, slowMovers };
    }

    case "review-summarizer": {
      const rows = await db.select({
          productId: feedback.productId,
          name: raw<string>`max(${products.name})`,
          reviews: raw<number>`count(*)::int`,
          avg: raw<number>`round(avg(${feedback.rating})::numeric, 2)::float8`,
          positive: raw<number>`count(*) filter (where ${feedback.sentiment} = 'positive')::int`,
          negative: raw<number>`count(*) filter (where ${feedback.sentiment} = 'negative')::int`,
        }).from(feedback)
        .innerJoin(products, eq(products.id, feedback.productId))
        .groupBy(feedback.productId)
        .orderBy(raw`count(*) desc`)
        .limit(12);
      return { available: true, items: rows };
    }

    case "product-health": {
      const [catalog, sold, reviewStats] = await Promise.all([
        db.select({
          id: products.id, name: products.name, sku: products.sku,
          stock: products.stock, rating: products.rating,
        }).from(products).limit(50),
        soldLast30Days(),
        db.select({
          productId: feedback.productId,
          reviews: raw<number>`count(*)::int`,
          flagged: raw<number>`count(*) filter (where ${feedback.status} = 'flagged')::int`,
        }).from(feedback).groupBy(feedback.productId),
      ]);
      const byProduct = new Map(reviewStats.map((r) => [r.productId, r]));
      const rows = catalog.map((c) => ({
        ...c,
        sold30: sold.get(c.id) ?? 0,
        reviews: byProduct.get(c.id)?.reviews ?? 0,
        flagged: byProduct.get(c.id)?.flagged ?? 0,
      }));
      return {
        available: true,
        items: rows.map((r) => ({
          ...r,
          // Transparent formula, not a black box: rating carries it, reviews
          // and sales add confidence, flags subtract.
          score: Math.max(0, Math.min(100, Math.round(
            r.rating * 16 + Math.min(r.reviews, 10) * 1.5 + Math.min(r.sold30, 20) * 0.5 - r.flagged * 8,
          ))),
        })),
      };
    }

    case "segments": {
      const [row] = await db.execute<{
        newCount: number; repeat: number; loyal: number; vip: number; dormant: number;
      }>(raw`
        select
          count(*) filter (where c.orders_count between 1 and 2)::int  as "newCount",
          count(*) filter (where c.orders_count between 3 and 5)::int  as "repeat",
          count(*) filter (where c.orders_count between 6 and 11)::int as "loyal",
          count(*) filter (where c.orders_count >= 12)::int            as "vip",
          count(*) filter (where c.orders_count = 0)::int              as "dormant"
        from (
          select cu.id, count(o.id) as orders_count
          from customers cu left join orders o on o.customer_id = cu.id
          group by cu.id
        ) c`);
      return {
        available: true,
        items: [
          { id: "new", name: "New", count: row?.newCount ?? 0 },
          { id: "repeat", name: "Repeat", count: row?.repeat ?? 0 },
          { id: "loyal", name: "Loyal", count: row?.loyal ?? 0 },
          { id: "vip", name: "VIP", count: row?.vip ?? 0 },
          { id: "dormant", name: "Dormant", count: row?.dormant ?? 0 },
        ],
      };
    }

    case "anomaly-alerts": {
      const rows = await db.select({
          day: raw<string>`to_char(date_trunc('day', ${orders.placedAt}), 'YYYY-MM-DD')`,
          revenue: raw<number>`sum(${orders.totalCents})::int`,
        }).from(orders)
        .where(gte(orders.placedAt, new Date(Date.now() - 30 * 86_400_000)))
        .groupBy(raw`date_trunc('day', ${orders.placedAt})`)
        .orderBy(raw`date_trunc('day', ${orders.placedAt})`);

      const values = rows.map((r) => r.revenue);
      const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const sd = values.length
        ? Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length)
        : 0;
      return {
        available: true,
        // Plain 2-sigma. Named, so a reader can judge whether to trust it.
        method: "2-sigma against a 30-day mean",
        anomalies: rows
          .filter((r) => sd > 0 && Math.abs(r.revenue - mean) > 2 * sd)
          .map((r) => ({
            day: r.day, revenue: toUnits(r.revenue),
            deviationPct: mean ? ((r.revenue - mean) / mean) * 100 : 0,
            direction: r.revenue > mean ? "spike" : "drop",
          })),
      };
    }

    case "risk": {
      const rows = await db.select({
          id: orders.id, total: orders.totalCents, status: orders.status,
          customerOrders: raw<number>`(select count(*) from orders o2 where o2.customer_id = ${orders.customerId})::int`,
        }).from(orders).where(eq(orders.status, "pending")).limit(50);
      return {
        available: true,
        items: rows.map((r) => {
          const flags: string[] = [];
          if (r.total > 50_000) flags.push("high value");
          if (r.customerOrders === 1) flags.push("first order");
          return { id: r.id, total: toUnits(r.total), flags, score: flags.length * 40 };
        }).filter((r) => r.flags.length > 0),
      };
    }

    case "catalog-audit": {
      const rows = await db.select().from(products);
      return {
        available: true,
        items: rows.flatMap((p) => {
          const issues: string[] = [];
          if (!p.description.trim()) issues.push("missing description");
          if (!p.image.trim()) issues.push("missing image");
          if (p.tags.length === 0) issues.push("no tags");
          if (p.comparePriceCents != null && p.comparePriceCents <= p.priceCents) {
            issues.push("compare-at price is not above the price");
          }
          if (p.costCents != null && p.costCents >= p.priceCents) issues.push("cost exceeds price");
          return issues.length ? [{ productId: p.id, sku: p.sku, name: p.name, issues }] : [];
        }),
      };
    }

    /**
     * The rest need data the system does not collect yet — vendor lead times,
     * return reasons, per-channel campaign results, translation status.
     * They return the contract with available:false instead of inventing
     * numbers that would look authoritative on a dashboard.
     */
    default:
      return { available: false, items: [], reason: "Not enough data collected yet for this copilot." };
  }
}
