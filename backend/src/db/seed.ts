/**
 * Seeds Postgres from mockdata/index.ts so a fresh database renders exactly
 * what the UI shows today. That equivalence is the safety net for every
 * migration phase: if a screen changes after pointing it at the API, the API
 * is wrong, not the data.
 *
 * Run with tsx (`npm run seed`) — it reaches outside the package into
 * ../../mockdata, so it is excluded from the compiled bundle.
 */
import argon2 from "argon2";
import { sql as raw } from "drizzle-orm";
import { db, sql } from "./index.js";
import * as t from "./schema.js";
import { toCents } from "../lib/money.js";
import { priceCart } from "../lib/pricing.js";

import * as fixtures from "../../../mockdata/index.js";

const DEMO_PASSWORD = "demo1234";

/** Same hash the admin UI uses to derive line items, so seeded orders match. */
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ADDRESS_POOL = [
  { line1: "1420 Alder Street", city: "Portland", postal: "97205", country: "US" },
  { line1: "88 Wexford Lane", city: "Austin", postal: "78704", country: "US" },
  { line1: "17 Calle Mayor", city: "Madrid", postal: "28013", country: "ES" },
  { line1: "3 Rue des Lilas", city: "Lyon", postal: "69003", country: "FR" },
  { line1: "225 Harbour Way", city: "Vancouver", postal: "V6B 1A1", country: "CA" },
  { line1: "9 Kingsley Road", city: "Manchester", postal: "M14 5TP", country: "GB" },
];

async function main() {
  console.log("seeding…");

  // Order matters: children before parents.
  await db.execute(raw`truncate table
    order_events, order_items, payments, orders,
    cart_items, carts, wishlist_items, addresses,
    product_highlights, product_specs, product_images, feedback,
    products, categories, customers, admin_users, api_keys, audit_log,
    promotions, hero_slides, settings
    restart identity cascade`);

  /* ---------------------------------------------------------- categories */
  // "all" is a UI filter sentinel, not a category. It does not belong in a table.
  const realCategories = fixtures.categories.filter((c) => c.id !== "all");
  await db.insert(t.categories).values(
    realCategories.map((c, i) => ({ id: c.id, name: c.name, position: i })),
  );

  /* ------------------------------------------------------------ products */
  await db.insert(t.products).values(
    fixtures.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.name} — part of the ${p.category.toLowerCase()} range.`,
      sku: p.id,
      categoryId: p.categoryId,
      priceCents: toCents(p.price),
      stock: p.stock,
      lowStock: 10,
      trackInventory: true,
      rating: p.rating,
      image: p.image,
      status: "active" as const,
      tags: [p.categoryId],
    })),
  );

  /* --------------------------------------------------- product extras */
  // Seeded extras where they exist; the rest get the same synthesis
  // shared/productExtras.ts does at render time, run once here instead.
  const seeded = new Map(fixtures.productExtras.map((e) => [e.productId, e]));
  const images: (typeof t.productImages.$inferInsert)[] = [];
  const specs: (typeof t.productSpecs.$inferInsert)[] = [];
  const highlights: (typeof t.productHighlights.$inferInsert)[] = [];

  const CROPS = ["", "&crop=entropy", "&crop=top", "&crop=right"];

  for (const p of fixtures.products) {
    const extra = seeded.get(p.id);
    if (extra) {
      extra.images.forEach((im, i) =>
        images.push({
          id: `${p.id}-IMG-${i}`, productId: p.id, url: im.url ?? p.image,
          initials: im.initials, theme: im.theme, caption: im.caption ?? null, position: i,
        }),
      );
      extra.specs.forEach((s, i) => specs.push({ productId: p.id, key: s.key, value: s.value, position: i }));
      extra.highlights.forEach((h, i) =>
        highlights.push({ productId: p.id, text: h, kind: "highlight" as const, position: i }),
      );
      (extra.inBox ?? []).forEach((h, i) =>
        highlights.push({ productId: p.id, text: h, kind: "inbox" as const, position: i }),
      );
    } else {
      CROPS.forEach((crop, i) =>
        images.push({
          id: `${p.id}-IMG-${i}`, productId: p.id, url: `${p.image}${crop}`,
          initials: p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
          theme: "brand" as const, position: i,
        }),
      );
      specs.push(
        { productId: p.id, key: "Category", value: p.category, position: 0 },
        { productId: p.id, key: "SKU", value: p.id, position: 1 },
        { productId: p.id, key: "Rating", value: String(p.rating), position: 2 },
      );
      highlights.push(
        { productId: p.id, text: "Designed to last, not to impress a spec sheet", kind: "highlight" as const, position: 0 },
        { productId: p.id, text: "Free returns within 30 days", kind: "highlight" as const, position: 1 },
      );
    }
  }
  await db.insert(t.productImages).values(images);
  await db.insert(t.productSpecs).values(specs);
  await db.insert(t.productHighlights).values(highlights);

  /* ----------------------------------------------------------- customers */
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  await db.insert(t.customers).values(
    fixtures.customers.map((c) => ({
      id: c.id, name: c.name, email: c.email.toLowerCase(), passwordHash,
    })),
  );
  const customerByName = new Map(fixtures.customers.map((c) => [c.name, c]));

  /* -------------------------------------------------------------- orders */
  // The fixtures link orders to customers by display-name string. That join is
  // resolved here, once, and never again.
  const productList = fixtures.products;
  const orderRows: (typeof t.orders.$inferInsert)[] = [];
  const itemRows: (typeof t.orderItems.$inferInsert)[] = [];
  const eventRows: (typeof t.orderEvents.$inferInsert)[] = [];
  const paymentRows: (typeof t.payments.$inferInsert)[] = [];
  const FLOW = ["pending", "processing", "shipped", "delivered"] as const;
  let orphaned = 0;

  for (const o of fixtures.orders) {
    const customer = customerByName.get(o.customerName);
    if (!customer) { orphaned++; continue; }

    const seed = hashString(o.id);
    const count = (seed % 3) + 1;
    const lines = Array.from({ length: count }, (_, i) => {
      const p = productList[(seed + i * 17) % productList.length]!;
      return { product: p, qty: ((seed >> (i + 1)) % 2) + 1 };
    });

    // Totals are recomputed from the line items with the real pricing function,
    // so there is no `adjustment` plug figure making the arithmetic work.
    const totals = priceCart(
      lines.map((l) => ({ productId: l.product.id, qty: l.qty, unitPriceCents: toCents(l.product.price) })),
    );
    const addr = ADDRESS_POOL[seed % ADDRESS_POOL.length]!;
    const placedAt = new Date(`${o.placedAt}T12:00:00Z`);

    orderRows.push({
      id: o.id, customerId: customer.id, status: o.status, placedAt,
      subtotalCents: totals.subtotalCents, shippingCents: totals.shippingCents,
      taxCents: totals.taxCents, totalCents: totals.totalCents,
      shipName: customer.name, shipLine1: addr.line1, shipCity: addr.city,
      shipPostal: addr.postal, shipCountry: addr.country,
      idempotencyKey: `seed-${o.id}`,
    });

    for (const l of lines) {
      itemRows.push({
        orderId: o.id, productId: l.product.id, name: l.product.name,
        sku: l.product.id, qty: l.qty, unitPriceCents: toCents(l.product.price),
      });
    }

    paymentRows.push({
      id: `PAY-${o.id.slice(-4)}`, orderId: o.id, method: "card",
      brand: ["Visa", "Mastercard", "Amex"][seed % 3]!,
      last4: String(1000 + (seed % 9000)),
      amountCents: totals.totalCents, status: "captured" as const,
    });

    // A delivered order has been through every prior state; the timeline is
    // real history rather than four labels rendered from the current status.
    const upto = FLOW.indexOf(o.status);
    for (let i = 0; i <= upto; i++) {
      eventRows.push({
        orderId: o.id, status: FLOW[i]!,
        at: new Date(placedAt.getTime() + i * 86_400_000),
        note: i === 0 ? "Order placed" : null,
      });
    }
  }

  await db.insert(t.orders).values(orderRows);
  await db.insert(t.orderItems).values(itemRows);
  await db.insert(t.payments).values(paymentRows);
  await db.insert(t.orderEvents).values(eventRows);

  /* ------------------------------------------------------------ feedback */
  const customerIds = new Set(fixtures.customers.map((c) => c.id));
  const productIds = new Set(fixtures.products.map((p) => p.id));
  const feedbackRows = fixtures.feedback
    .filter((f) => customerIds.has(f.customerId) && productIds.has(f.productId))
    .map((f) => ({
      id: f.id, productId: f.productId, customerId: f.customerId,
      rating: f.rating, title: f.title, body: f.body,
      createdAt: new Date(`${f.createdAt}T12:00:00Z`),
      status: f.status, sentiment: f.sentiment,
      reply: f.reply ?? null,
      repliedAt: f.repliedAt ? new Date(`${f.repliedAt}T12:00:00Z`) : null,
      helpfulVotes: f.helpfulVotes,
    }));
  await db.insert(t.feedback).values(feedbackRows);

  /* ------------------------------------------------------- merchandising */
  await db.insert(t.promotions).values(
    fixtures.promotions.map((p) => ({
      id: p.id, title: p.title, message: p.message,
      ctaText: p.ctaText ?? null, ctaUrl: p.ctaUrl ?? null,
      audience: p.audience, status: p.status, theme: p.theme,
      startsAt: p.startsAt ?? null, endsAt: p.endsAt ?? null,
      createdAt: new Date(`${p.createdAt}T12:00:00Z`),
    })),
  );

  await db.insert(t.heroSlides).values(
    fixtures.heroSlides.map((s) => ({
      id: s.id, title: s.title, subtitle: s.subtitle,
      eyebrow: s.eyebrow ?? null, ctaText: s.ctaText ?? null, ctaUrl: s.ctaUrl ?? null,
      audience: s.audience, status: s.status, theme: s.theme,
      imageInitials: s.imageInitials ?? null, image: s.image ?? null,
      order: s.order, createdAt: new Date(`${s.createdAt}T12:00:00Z`),
    })),
  );

  /* -------------------------------------------------------- admin users */
  // Mapped from the frontend's three-role directory onto the five-role model.
  await db.insert(t.adminUsers).values([
    { id: "A-1", email: "admin@intellicart.shop", name: "Admin", passwordHash, role: "owner" as const },
    { id: "A-2", email: "manager@intellicart.shop", name: "Manager", passwordHash, role: "manager" as const },
    { id: "A-3", email: "staff@intellicart.shop", name: "Staff", passwordHash, role: "viewer" as const },
  ]);

  await db.insert(t.settings).values([
    { scope: "store", value: { name: "IntelliCart", currency: "USD", supportEmail: "help@intellicart.shop" } },
    { scope: "shipping", value: { freeOver: 50, flatRate: 8, taxRate: 0.08 } },
  ]);

  console.log(
    `seeded: ${realCategories.length} categories, ${fixtures.products.length} products, ` +
    `${fixtures.customers.length} customers, ${orderRows.length} orders, ` +
    `${itemRows.length} line items, ${feedbackRows.length} reviews, ` +
    `${fixtures.promotions.length} promotions, ${fixtures.heroSlides.length} slides`,
  );
  if (orphaned) console.warn(`  ${orphaned} fixture orders had no matching customer and were skipped`);
  console.log(`\n  demo password for every seeded account: ${DEMO_PASSWORD}`);

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end().catch(() => {});
  process.exit(1);
});
