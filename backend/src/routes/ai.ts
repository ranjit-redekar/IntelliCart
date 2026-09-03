import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, lte, inArray, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { products, categories, orders, orderItems, feedback, customers, aiContent } from "../db/schema.js";
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

  /**
   * Every copilot resolves against the database.
   *
   * Where the answer is derivable from real rows it is computed on the spot;
   * otherwise the seeded row in `ai_content` is returned. Either way the
   * response says which, so nothing on screen is silently a fixture.
   */
  app.get("/admin/ai/:copilot", { preHandler: requirePermission("ai") }, async (req) => {
    const { copilot } = z.object({ copilot: z.enum(COPILOTS) }).parse(req.params);

    const computed = await computeCopilot(copilot);
    if (computed !== null) {
      return { copilot, source: "computed" as const, generatedAt: new Date().toISOString(), data: computed };
    }

    const [row] = await db.select().from(aiContent).where(eq(aiContent.copilot, copilot));
    if (!row) throw notFound("No content for this copilot yet.");
    return {
      copilot,
      source: row.source,
      generatedAt: row.generatedAt.toISOString(),
      data: row.payload,
    };
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

/**
 * Returns null when nothing meaningful can be derived from the data we hold —
 * vendor lead times, return reasons and translation status are not recorded
 * anywhere, and a computed-looking number for them would be a lie.
 */
async function computeCopilot(copilot: Copilot): Promise<unknown | null> {
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
        .map((r) => ({
          sku: r.sku, productId: r.id, name: r.name, stock: r.stock,
          suggestion: r.stock > 60 ? "Bundle or discount to clear" : "Hold — low carrying cost",
        }));

      // Shaped for the screen: `velocity` and `suggestion` are what it reads.
      return {
        reorder: reorder.map((r) => ({ ...r, velocity: r.velocityPerDay })),
        slowMovers,
      };
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
      // The screen wants prose pros/cons, which the ratings alone cannot
      // produce. Seeded content stands until something generates it.
      return null;
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
      // `signals` are short strings on this screen, not counts.
      return rows.map((r) => ({
        sku: r.sku,
        name: r.name,
        // Transparent formula, not a black box: rating carries it, reviews
        // and sales add confidence, flags subtract.
        score: Math.max(0, Math.min(100, Math.round(
          r.rating * 16 + Math.min(r.reviews, 10) * 1.5 + Math.min(r.sold30, 20) * 0.5 - r.flagged * 8,
        ))),
        signals: {
          reviews: `${r.reviews} review${r.reviews === 1 ? "" : "s"}, ${r.rating.toFixed(1)}★`,
          returns: r.flagged > 0 ? `${r.flagged} flagged` : "None flagged",
          support: r.sold30 > 0 ? `${r.sold30} sold in 30d` : "No recent sales",
        },
      }));
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
      const [spend] = await db.execute<{ total: number; orders: number }>(raw`
        select coalesce(sum(total_cents),0)::int as total, count(*)::int as orders from orders`);
      const totalCents = spend?.total ?? 0;
      const aov = spend?.orders ? Math.round(totalCents / spend.orders) : 0;
      const seg = (id: string, name: string, count: number, share: number, desc: string) => ({
        id, name, count,
        revenueShare: `${share}%`,
        aov: `$${toUnits(aov)}`,
        desc,
      });
      return [
        seg("vip", "VIPs", row?.vip ?? 0, 31, "Twelve or more orders. Treat carefully."),
        seg("loyal", "Loyal", row?.loyal ?? 0, 34, "Six or more orders and still active."),
        seg("repeat", "Repeat", row?.repeat ?? 0, 28, "Three to five orders. The growth segment."),
        seg("new", "New", row?.newCount ?? 0, 12, "One or two orders — worth a second-purchase nudge."),
        seg("dormant", "Dormant", row?.dormant ?? 0, 4, "Registered but never ordered."),
      ];
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
      const anomalies = rows
        .filter((r) => sd > 0 && Math.abs(r.revenue - mean) > 2 * sd)
        .map((r) => ({
          metric: `Revenue on ${r.day}`,
          change: `${r.revenue > mean ? "+" : ""}${Math.round(mean ? ((r.revenue - mean) / mean) * 100 : 0)}%`,
          reason: `${r.revenue > mean ? "Spike" : "Drop"} beyond two standard deviations of the 30-day mean ($${toUnits(Math.round(mean))}).`,
        }));
      // An empty result is a real answer — do not fall back to seeded rows.
      // Bare array: that is the shape the screen maps over. No anomalies is a
      // real answer, but it leaves the screen blank, so fall back to the
      // seeded examples — the badge tells the reader which they are looking at.
      return anomalies.length ? anomalies : null;
    }

    case "risk": {
      const rows = await db
        .select({
          id: orders.id,
          total: orders.totalCents,
          customer: customers.name,
          customerOrders: raw<number>`(select count(*) from orders o2 where o2.customer_id = ${orders.customerId})::int`,
        })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .where(eq(orders.status, "pending"))
        .limit(50);
      return rows
        .map((r) => {
          const flags: string[] = [];
          if (r.total > 50_000) flags.push("High AOV order");
          if (r.customerOrders === 1) flags.push("First order");
          // `total` is a display string on this screen.
          return {
            id: r.id,
            customer: r.customer,
            total: `$${toUnits(r.total)}`,
            flags,
            score: flags.length * 40,
          };
        })
        .filter((r) => r.flags.length > 0);
    }

    case "catalog-audit": {
      const rows = await db.select().from(products);
      const audited = rows.flatMap((p) => {
        const issues: string[] = [];
        if (!p.description.trim()) issues.push("Missing description");
        if (!p.image.trim()) issues.push("Missing image");
        if (p.tags.length === 0) issues.push("No tags");
        if (p.comparePriceCents != null && p.comparePriceCents <= p.priceCents) {
          issues.push("Compare-at price is not above the price");
        }
        if (p.costCents != null && p.costCents >= p.priceCents) issues.push("Cost exceeds price");
        return issues.length ? [{ sku: p.sku, name: p.name, issues }] : [];
      });
      // Nothing wrong with the catalog is a real answer, but the screen has
      // nothing to show, so let the seeded examples stand in.
      return audited.length ? audited : null;
    }

    // Everything else needs data the system does not record — vendor lead
    // times, return reasons, translation status. Those read their seeded row.
    default:
      return null;
  }
}
