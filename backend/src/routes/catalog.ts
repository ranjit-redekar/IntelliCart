import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  categories, products, productImages, productSpecs, productHighlights, feedback, customers,
} from "../db/schema.js";
import { cached, hashOf } from "../redis/cache.js";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";
import { toCents } from "../lib/money.js";
import { notFound } from "../lib/errors.js";
import { offsetOf, pageQuery, paged } from "../lib/pagination.js";
import { categoryOut, productOut, feedbackOut, ymd } from "../lib/serialize.js";
import { interpretSearch } from "../ai/search.js";

const listQuery = pageQuery.extend({
  cat: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  sort: z.enum(["price-asc", "price-desc", "rating", "newest"]).optional(),
});

export async function catalogRoutes(app: FastifyInstance) {
  app.get("/categories", async (_req, reply) => {
    const items = await cached(k.categories(), TTL.product, async () => {
      // Count and a sample image come along: the home page renders a tile per
      // category with both, and fetching them separately would be one request
      // per category for data that is cached here anyway.
      const rows = await db
        .select({
          c: categories,
          productCount: raw<number>`count(${products.id}) filter (where ${products.status} = 'active')::int`,
          image: raw<string | null>`min(${products.image}) filter (where ${products.status} = 'active')`,
        })
        .from(categories)
        .leftJoin(products, eq(products.categoryId, categories.id))
        .groupBy(categories.id, categories.name, categories.position)
        .orderBy(asc(categories.position));
      return rows.map((r) => ({
        ...categoryOut(r.c),
        productCount: r.productCount,
        image: r.image ?? null,
      }));
    });
    reply.header("cache-control", "public, max-age=60");
    // "all" is a filter sentinel in the UI, not a real category. The API
    // returns real categories; the client adds its own sentinel.
    return { items };
  });

  app.get("/products", async (req) => {
    const q = listQuery.parse(req.query);

    // The search box accepts natural language ("top rated under $100"). The
    // interpretation runs server-side so mobile gets it too.
    const interpreted = q.q ? interpretSearch(q.q) : { summary: null, residual: "", filters: {} };
    const cat = q.cat && q.cat !== "all" ? q.cat : interpreted.filters.categoryId;
    const maxPrice = q.maxPrice ?? interpreted.filters.maxPrice;
    const minRating = q.minRating ?? interpreted.filters.minRating;
    const sort = q.sort ?? interpreted.filters.sort;

    const key = k.productList(hashOf({ ...q, cat, maxPrice, minRating, sort, text: interpreted.residual }));

    const result = await cached(key, TTL.productList, async () => {
      const filters = [eq(products.status, "active")];
      if (cat) filters.push(eq(products.categoryId, cat));
      if (maxPrice != null) filters.push(lte(products.priceCents, toCents(maxPrice)));
      if (minRating != null) filters.push(gte(products.rating, minRating));
      // Match on what the interpreter did NOT understand. Matching the whole
      // raw phrase would mean a well-phrased query returns nothing.
      const text = interpreted.residual;
      if (text) {
        filters.push(
          or(ilike(products.name, `%${text}%`), ilike(products.description, `%${text}%`))!,
        );
      }
      const where = and(...filters);

      const order =
        sort === "price-asc" ? asc(products.priceCents)
        : sort === "price-desc" ? desc(products.priceCents)
        : sort === "rating" ? desc(products.rating)
        : sort === "newest" ? desc(products.createdAt)
        : asc(products.id);

      const rows = await db
        .select({ p: products, categoryName: categories.name })
        .from(products)
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(where)
        .orderBy(order)
        .limit(q.pageSize)
        .offset(offsetOf(q));

      const [{ count } = { count: 0 }] = await db
        .select({ count: raw<number>`count(*)::int` })
        .from(products)
        .where(where);

      return {
        items: rows.map((r) => productOut(r.p, r.categoryName)),
        total: count,
        ids: rows.map((r) => r.p.id),
      };
    });

    // Register this list under each product's tag set so a single product
    // update drops exactly the lists that contain it.
    if (result.ids.length) {
      const pipe = redis.pipeline();
      for (const id of result.ids) {
        pipe.sadd(k.tagProduct(id), key);
        pipe.expire(k.tagProduct(id), TTL.product * 2);
      }
      await pipe.exec().catch(() => {});
    }

    if (q.q) void redis.zincrby(k.searchPopular(), 1, q.q.toLowerCase()).catch(() => {});

    return { ...paged(result.items, result.total, q), interpretation: interpreted.summary };
  });

  app.get("/products/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);

    const data = await cached(
      k.product(id),
      TTL.product,
      async () => {
        const [row] = await db
          .select({ p: products, categoryName: categories.name })
          .from(products)
          .innerJoin(categories, eq(categories.id, products.categoryId))
          .where(eq(products.id, id));
        if (!row) return null;

        const [images, specs, highlights] = await Promise.all([
          db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.position)),
          db.select().from(productSpecs).where(eq(productSpecs.productId, id)).orderBy(asc(productSpecs.position)),
          db.select().from(productHighlights).where(eq(productHighlights.productId, id)).orderBy(asc(productHighlights.position)),
        ]);

        return {
          ...productOut(row.p, row.categoryName),
          description: row.p.description,
          // Real rows. getProductExtra's client-side synthesis ran on every
          // render and invented gallery URLs by appending crop params.
          images: images.map((i) => ({
            id: i.id, initials: i.initials, theme: i.theme,
            caption: i.caption ?? undefined, url: i.url ?? undefined,
          })),
          specs: specs.map((s) => ({ key: s.key, value: s.value })),
          highlights: highlights.filter((h) => h.kind === "highlight").map((h) => h.text),
          inBox: highlights.filter((h) => h.kind === "inbox").map((h) => h.text),
        };
      },
      { tags: [k.tagProduct(id)] },
    );

    if (!data) throw notFound("No such product.");

    void redis.incr(k.productViews(id)).catch(() => {});
    if (req.session?.kind === "customer") {
      const key = k.recentViewed(req.session.userId);
      void redis
        .multi().lrem(key, 0, id).lpush(key, id).ltrim(key, 0, 19).expire(key, TTL.recentViewed)
        .exec().catch(() => {});
    }

    reply.header("etag", `"${hashOf(data)}"`);
    if (req.headers["if-none-match"] === `"${hashOf(data)}"`) return reply.code(304).send();
    return data;
  });

  app.get("/products/:id/reviews", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const q = pageQuery.parse(req.query);
    const rows = await db
      .select({ f: feedback, productName: products.name, customerName: customers.name })
      .from(feedback)
      .innerJoin(products, eq(products.id, feedback.productId))
      .innerJoin(customers, eq(customers.id, feedback.customerId))
      .where(and(eq(feedback.productId, id), inArray(feedback.status, ["new", "replied"])))
      .orderBy(desc(feedback.createdAt))
      .limit(q.pageSize)
      .offset(offsetOf(q));

    const [{ count } = { count: 0 }] = await db
      .select({ count: raw<number>`count(*)::int` })
      .from(feedback)
      .where(eq(feedback.productId, id));

    return paged(rows.map((r) => feedbackOut(r.f, r.productName, r.customerName)), count, q);
  });

  /** Search suggestions for the overlay — from what people actually searched. */
  app.get("/search/suggestions", async () => {
    const popular = await redis.zrevrange(k.searchPopular(), 0, 7).catch(() => [] as string[]);
    return { items: popular };
  });

  app.get("/bestsellers", async () => {
    const ids = await redis.zrevrange(k.bestsellers("30d"), 0, 7).catch(() => [] as string[]);
    if (!ids.length) return { items: [] };
    const rows = await db
      .select({ p: products, categoryName: categories.name })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(inArray(products.id, ids));
    const order = new Map(ids.map((id, i) => [id, i]));
    return {
      items: rows
        .map((r) => productOut(r.p, r.categoryName))
        .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)),
    };
  });
}

export { ymd };
