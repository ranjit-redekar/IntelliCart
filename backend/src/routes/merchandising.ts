import type { FastifyInstance } from "fastify";
import { and, asc, eq, inArray, or, sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { promotions, heroSlides } from "../db/schema.js";
import { redis, subscriber } from "../redis/client.js";
import { k } from "../redis/keys.js";
import { notFound, badRequest } from "../lib/errors.js";
import { requirePermission } from "../plugins/auth.js";
import { promotionOut, slideOut } from "../lib/serialize.js";
import { newId } from "../lib/ids.js";

const audience = z.enum(["all", "web", "mobile"]);
const status = z.enum(["active", "draft", "scheduled"]);
const theme = z.enum(["brand", "violet", "mint", "amber", "rose"]);

/**
 * Promotions and hero slides.
 *
 * Today the admin writes these to localStorage and the storefront imports them
 * straight from the fixtures, so admin edits are invisible to shoppers. One
 * source, plus an SSE channel so an open storefront updates without a reload.
 */
export async function merchandisingRoutes(app: FastifyInstance) {
  /* ---------------------------------------------------------- public read */

  app.get("/promotions", async (req) => {
    const { surface } = z.object({ surface: z.enum(["web", "mobile"]).default("web") }).parse(req.query);
    const rows = await db.select().from(promotions)
      .where(and(eq(promotions.status, "active"), inArray(promotions.audience, ["all", surface])));
    return { items: rows.map(promotionOut) };
  });

  app.get("/slides", async (req) => {
    const { surface } = z.object({ surface: z.enum(["web", "mobile"]).default("web") }).parse(req.query);
    const rows = await db.select().from(heroSlides)
      .where(and(eq(heroSlides.status, "active"), inArray(heroSlides.audience, ["all", surface])))
      .orderBy(asc(heroSlides.order));
    return { items: rows.map(slideOut) };
  });

  /**
   * Live merchandising. An admin publishing a promotion reaches every open
   * storefront through Redis pub/sub — including ones served by other API
   * replicas, which is why this goes through Redis rather than an in-process
   * emitter.
   */
  app.get("/merch/stream", async (req, reply) => {
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    });
    reply.raw.write(`event: ready\ndata: {}\n\n`);

    const sub = subscriber.duplicate();
    await sub.subscribe(k.chanMerch());
    const onMessage = (_channel: string, message: string) => {
      reply.raw.write(`event: merch\ndata: ${message}\n\n`);
    };
    sub.on("message", onMessage);

    const heartbeat = setInterval(() => reply.raw.write(`: ping\n\n`), 25_000);
    req.raw.on("close", () => {
      clearInterval(heartbeat);
      sub.off("message", onMessage);
      void sub.quit();
    });
    return reply;
  });

  const announce = (kind: "promotions" | "slides") =>
    redis.publish(k.chanMerch(), JSON.stringify({ kind, at: Date.now() })).catch(() => {});

  /* --------------------------------------------------------- admin: promos */

  const promoBody = z.object({
    title: z.string().trim().min(1),
    message: z.string().trim().min(1),
    ctaText: z.string().optional(), ctaUrl: z.string().optional(),
    audience: audience.default("all"), status: status.default("draft"), theme: theme.default("brand"),
    startsAt: z.string().optional(), endsAt: z.string().optional(),
  });

  app.get("/admin/promotions", { preHandler: requirePermission("products") }, async () => {
    const rows = await db.select().from(promotions).orderBy(asc(promotions.id));
    return { items: rows.map(promotionOut) };
  });

  app.post("/admin/promotions", { preHandler: requirePermission("products") }, async (req, reply) => {
    const body = promoBody.parse(req.body);
    const id = newId("PR");
    await db.insert(promotions).values({ ...body, id });
    await announce("promotions");
    return reply.code(201).send({ id });
  });

  app.put("/admin/promotions/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = promoBody.partial().parse(req.body);
    const updated = await db.update(promotions).set(body).where(eq(promotions.id, id)).returning({ id: promotions.id });
    if (!updated.length) throw notFound("No such promotion.");
    await announce("promotions");
    return { ok: true };
  });

  app.delete("/admin/promotions/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await db.delete(promotions).where(eq(promotions.id, id));
    await announce("promotions");
    return { ok: true };
  });

  /* --------------------------------------------------------- admin: slides */

  const slideBody = z.object({
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    eyebrow: z.string().optional(), ctaText: z.string().optional(), ctaUrl: z.string().optional(),
    audience: audience.default("all"), status: status.default("draft"), theme: theme.default("brand"),
    imageInitials: z.string().optional(), image: z.string().optional(),
  });

  app.get("/admin/slides", { preHandler: requirePermission("products") }, async () => {
    const rows = await db.select().from(heroSlides).orderBy(asc(heroSlides.order));
    return { items: rows.map(slideOut) };
  });

  app.post("/admin/slides", { preHandler: requirePermission("products") }, async (req, reply) => {
    const body = slideBody.parse(req.body);
    const id = newId("HS");
    const [{ max } = { max: 0 }] = await db
      .select({ max: raw<number>`coalesce(max(${heroSlides.order}),0)::int` }).from(heroSlides);
    await db.insert(heroSlides).values({ ...body, id, order: max + 1 });
    await announce("slides");
    return reply.code(201).send({ id });
  });

  app.put("/admin/slides/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = slideBody.partial().parse(req.body);
    const updated = await db.update(heroSlides).set(body).where(eq(heroSlides.id, id)).returning({ id: heroSlides.id });
    if (!updated.length) throw notFound("No such slide.");
    await announce("slides");
    return { ok: true };
  });

  app.delete("/admin/slides/:id", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
    await announce("slides");
    return { ok: true };
  });

  /** Reorder: the admin drags slides up and down. Swap, then renumber 1..n. */
  app.post("/admin/slides/:id/move", { preHandler: requirePermission("products") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { direction } = z.object({ direction: z.enum(["up", "down"]) }).parse(req.body);

    const all = await db.select().from(heroSlides).orderBy(asc(heroSlides.order));
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) throw notFound("No such slide.");
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= all.length) throw badRequest("Already at the end of the list.");

    const reordered = [...all];
    const a = reordered[index]!;
    reordered[index] = reordered[swapWith]!;
    reordered[swapWith] = a;

    await db.transaction(async (tx) => {
      for (const [i, slide] of reordered.entries()) {
        await tx.update(heroSlides).set({ order: i + 1 }).where(eq(heroSlides.id, slide.id));
      }
    });
    await announce("slides");
    return { ok: true };
  });
}
