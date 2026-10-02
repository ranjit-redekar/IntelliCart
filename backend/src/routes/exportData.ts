import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import {
  categories, products, productImages, productSpecs, productHighlights,
  customers, addresses, orders, orderItems, orderEvents, payments,
  feedback, promotions, heroSlides, settings,
} from "../db/schema.js";
import { requirePermission } from "../plugins/auth.js";
import { audit } from "../lib/audit.js";
import { toUnits } from "../lib/money.js";
import { ymd } from "../lib/serialize.js";
import { redact } from "../lib/redact.js";

/** Group child rows by a parent id. */
const byKey = <T, K extends keyof T>(rows: T[], key: K) => {
  const m = new Map<T[K], Omit<T, K>[]>();
  for (const { [key]: k, ...rest } of rows) {
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(rest as Omit<T, K>);
  }
  return m;
};



/**
 * Full JSON archive of the store. Money is in whole units (same as every other
 * endpoint, via toUnits); timestamps are ISO strings. Deliberately absent:
 * password hashes, sessions, admin users, API keys, carts, audit log.
 */
export async function exportRoutes(app: FastifyInstance) {
  // "settings" is the strictest existing permission that fits (owner + admin);
  // the owner-only ones (billing, roles) are about something else.
  app.get("/admin/export", { preHandler: requirePermission("settings") }, async (req, reply) => {
    // ponytail: whole store in memory, one document. Fine at thousands of rows;
    // stream NDJSON / paginate per table when the store gets large (tens of MB+).
    const [
      cats, prods, imgs, specs, highs, custs, addrs,
      ords, items, events, pays, reviews, promos, slides, sets,
    ] = await Promise.all([
      db.select().from(categories).orderBy(categories.position),
      db.select().from(products).orderBy(products.id),
      db.select().from(productImages).orderBy(productImages.position),
      db.select().from(productSpecs).orderBy(productSpecs.position),
      db.select().from(productHighlights).orderBy(productHighlights.position),
      // Explicit columns: passwordHash must never be selected.
      db.select({ id: customers.id, name: customers.name, email: customers.email, createdAt: customers.createdAt })
        .from(customers).orderBy(customers.id),
      db.select().from(addresses).orderBy(addresses.id),
      db.select().from(orders).orderBy(orders.placedAt),
      db.select().from(orderItems).orderBy(orderItems.id),
      db.select().from(orderEvents).orderBy(orderEvents.at),
      db.select().from(payments).orderBy(payments.createdAt),
      db.select().from(feedback).orderBy(feedback.createdAt),
      db.select().from(promotions).orderBy(promotions.createdAt),
      db.select().from(heroSlides).orderBy(heroSlides.order),
      db.select().from(settings).orderBy(settings.scope),
    ]);

    const imgsBy = byKey(imgs, "productId");
    const specsBy = byKey(specs.map(({ id: _, ...s }) => s), "productId");
    const highsBy = byKey(highs.map(({ id: _, ...h }) => h), "productId");
    const itemsBy = byKey(items.map(({ id: _, unitPriceCents, ...i }) => ({ ...i, unitPrice: toUnits(unitPriceCents) })), "orderId");
    const eventsBy = byKey(events.map(({ id: _, ...e }) => e), "orderId");
    const paysBy = byKey(pays.map(({ amountCents, ...p }) => ({ ...p, amount: toUnits(amountCents) })), "orderId");

    const body = {
      exportedAt: new Date().toISOString(),
      version: 1,
      currency: "USD",
      categories: cats,
      products: prods.map(({ priceCents, comparePriceCents, costCents, ...p }) => ({
        ...p,
        price: toUnits(priceCents),
        comparePrice: comparePriceCents == null ? null : toUnits(comparePriceCents),
        cost: costCents == null ? null : toUnits(costCents),
        images: imgsBy.get(p.id) ?? [],
        specs: specsBy.get(p.id) ?? [],
        highlights: highsBy.get(p.id) ?? [],
      })),
      customers: custs,
      addresses: addrs,
      // idempotencyKey is internal plumbing, not store data.
      orders: ords.map(({ subtotalCents, shippingCents, taxCents, totalCents, idempotencyKey: _, ...o }) => ({
        ...o,
        subtotal: toUnits(subtotalCents),
        shipping: toUnits(shippingCents),
        tax: toUnits(taxCents),
        total: toUnits(totalCents),
        items: itemsBy.get(o.id) ?? [],
        events: eventsBy.get(o.id) ?? [],
        payments: paysBy.get(o.id) ?? [],
      })),
      reviews,
      promotions: promos,
      slides,
      settings: Object.fromEntries(sets.map((s) => [s.scope, redact(s.value)])),
    };

    await audit(req, "workspace.export", "workspace", undefined, {
      products: prods.length, customers: custs.length, orders: ords.length,
    });
    return reply
      .header("content-disposition", `attachment; filename="intellicart-export-${ymd(new Date())}.json"`)
      .send(body);
  });
}
