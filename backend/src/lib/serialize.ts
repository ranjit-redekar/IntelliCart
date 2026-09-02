import { toUnits } from "./money.js";
import type * as s from "../db/schema.js";
import { categories as categoriesTable } from "../db/schema.js";

type ProductRow = typeof import("../db/schema.js").products.$inferSelect;
type CategoryRow = typeof categoriesTable.$inferSelect;
type OrderRow = typeof import("../db/schema.js").orders.$inferSelect;
type FeedbackRow = typeof import("../db/schema.js").feedback.$inferSelect;
type PromotionRow = typeof import("../db/schema.js").promotions.$inferSelect;
type SlideRow = typeof import("../db/schema.js").heroSlides.$inferSelect;

/**
 * DB row -> the shape shared/types.ts already promises the frontends.
 *
 * Money crosses this boundary from integer cents to whole units, and dates
 * from timestamptz to the "YYYY-MM-DD" string the UI formats today. Keeping
 * the contract identical is what lets the frontend migrate one screen at a
 * time instead of all at once.
 */
export const ymd = (d: Date) => d.toISOString().slice(0, 10);

export const productOut = (p: ProductRow, categoryName: string) => ({
  id: p.id,
  name: p.name,
  category: categoryName,
  categoryId: p.categoryId,
  price: toUnits(p.priceCents),
  stock: p.stock,
  rating: p.rating,
  image: p.image,
});

/** The admin needs the columns the storefront contract does not carry. */
export const productAdminOut = (p: ProductRow, categoryName: string) => ({
  ...productOut(p, categoryName),
  description: p.description,
  sku: p.sku,
  comparePrice: p.comparePriceCents == null ? null : toUnits(p.comparePriceCents),
  cost: p.costCents == null ? null : toUnits(p.costCents),
  lowStock: p.lowStock,
  trackInventory: p.trackInventory,
  status: p.status,
  tags: p.tags,
  createdAt: p.createdAt.toISOString(),
});

export const categoryOut = (c: CategoryRow) => ({ id: c.id, name: c.name });

export const orderOut = (o: OrderRow, customerName: string) => ({
  id: o.id,
  customerName,
  total: toUnits(o.totalCents),
  status: o.status,
  placedAt: ymd(o.placedAt),
});

export const orderDetailOut = (
  o: OrderRow,
  customerName: string,
  items: { productId: string | null; name: string; sku: string; qty: number; unitPriceCents: number }[],
  events: { status: string; at: Date; note: string | null }[],
) => ({
  ...orderOut(o, customerName),
  subtotal: toUnits(o.subtotalCents),
  shipping: toUnits(o.shippingCents),
  tax: toUnits(o.taxCents),
  // No `adjustment` plug figure: these numbers reconcile because they are the
  // numbers that were charged, not a hash of the order id.
  items: items.map((i) => ({
    productId: i.productId,
    sku: i.sku,
    name: i.name,
    qty: i.qty,
    unitPrice: toUnits(i.unitPriceCents),
  })),
  address: {
    name: o.shipName,
    line1: o.shipLine1,
    city: o.shipCity,
    postal: o.shipPostal,
    country: o.shipCountry,
  },
  timeline: events.map((e) => ({ status: e.status, at: e.at.toISOString(), note: e.note })),
});

export const feedbackOut = (
  f: FeedbackRow,
  productName: string,
  customerName: string,
) => ({
  id: f.id,
  productId: f.productId,
  productName,
  customerId: f.customerId,
  customerName,
  rating: f.rating,
  title: f.title,
  body: f.body,
  createdAt: ymd(f.createdAt),
  status: f.status,
  sentiment: f.sentiment,
  reply: f.reply ?? undefined,
  repliedAt: f.repliedAt ? ymd(f.repliedAt) : undefined,
  helpfulVotes: f.helpfulVotes,
});

export const promotionOut = (p: PromotionRow) => ({
  id: p.id,
  title: p.title,
  message: p.message,
  ctaText: p.ctaText ?? undefined,
  ctaUrl: p.ctaUrl ?? undefined,
  audience: p.audience,
  status: p.status,
  theme: p.theme,
  startsAt: p.startsAt ?? undefined,
  endsAt: p.endsAt ?? undefined,
  createdAt: ymd(p.createdAt),
});

export const slideOut = (s: SlideRow) => ({
  id: s.id,
  title: s.title,
  subtitle: s.subtitle,
  eyebrow: s.eyebrow ?? undefined,
  ctaText: s.ctaText ?? undefined,
  ctaUrl: s.ctaUrl ?? undefined,
  audience: s.audience,
  status: s.status,
  theme: s.theme,
  imageInitials: s.imageInitials ?? undefined,
  image: s.image ?? undefined,
  order: s.order,
  createdAt: ymd(s.createdAt),
});

export type { s };
