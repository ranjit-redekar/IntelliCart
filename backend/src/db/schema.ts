import {
  pgTable, text, integer, boolean, real, timestamp, jsonb,
  serial, primaryKey, index, uniqueIndex,
} from "drizzle-orm/pg-core";

// Unions mirror shared/types.ts. They are re-declared rather than imported so
// the build has no dependency on a path outside this package; selfcheck.ts
// asserts they still match the shared contract.
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";
export type FeedbackStatus = "new" | "replied" | "flagged" | "archived";
export type FeedbackSentiment = "positive" | "neutral" | "negative";
export type Audience = "all" | "web" | "mobile";
export type PublishStatus = "active" | "draft" | "scheduled";
export type Theme = "brand" | "violet" | "mint" | "amber" | "rose";
export type ProductStatus = "draft" | "active" | "archived";
export type Role = "owner" | "admin" | "manager" | "support" | "viewer";

/* ---------------------------------------------------------------- catalog */

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    sku: text("sku").notNull(),
    categoryId: text("category_id").notNull().references(() => categories.id),
    // Money is stored in minor units. Never a float.
    priceCents: integer("price_cents").notNull(),
    comparePriceCents: integer("compare_price_cents"),
    costCents: integer("cost_cents"),
    stock: integer("stock").notNull().default(0),
    lowStock: integer("low_stock").notNull().default(10),
    trackInventory: boolean("track_inventory").notNull().default(true),
    rating: real("rating").notNull().default(0),
    image: text("image").notNull().default(""),
    status: text("status").$type<ProductStatus>().notNull().default("active"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
    uniqueIndex("products_sku_idx").on(t.sku),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    url: text("url"),
    initials: text("initials").notNull().default(""),
    theme: text("theme").$type<Theme>().notNull().default("brand"),
    caption: text("caption"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productSpecs = pgTable(
  "product_specs",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_specs_product_idx").on(t.productId)],
);

export const productHighlights = pgTable(
  "product_highlights",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    kind: text("kind").$type<"highlight" | "inbox">().notNull().default("highlight"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_highlights_product_idx").on(t.productId)],
);

/* -------------------------------------------------------------- customers */

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Sign-up currently allows duplicate emails. This constraint is the fix.
  (t) => [uniqueIndex("customers_email_idx").on(t.email)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Home"),
    name: text("name").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    postal: text("postal").notNull(),
    country: text("country").notNull().default("US"),
    phone: text("phone"),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.productId] })],
);

/* ------------------------------------------------------------------ carts */
/**
 * Not currently read: the cart lives in Redis (see redis/keys.ts — `cart:` for
 * guests, `cart:user:` for signed-in shoppers), which is what gives a guest
 * cart a TTL and makes its expiry drive abandoned-cart recovery. These tables
 * are the durable half of the write-through design and stay empty until carts
 * need to outlive Redis.
 */

export const carts = pgTable(
  "carts",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("carts_customer_idx").on(t.customerId)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: text("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull(),
  },
  (t) => [primaryKey({ columns: [t.cartId, t.productId] })],
);

/* ----------------------------------------------------------------- orders */

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    // Real FK. Today's fixtures join orders to customers by display name.
    customerId: text("customer_id").notNull().references(() => customers.id),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    shipName: text("ship_name").notNull(),
    shipLine1: text("ship_line1").notNull(),
    shipCity: text("ship_city").notNull(),
    shipPostal: text("ship_postal").notNull(),
    shipCountry: text("ship_country").notNull(),
    idempotencyKey: text("idempotency_key"),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
    index("orders_placed_idx").on(t.placedAt),
    uniqueIndex("orders_idem_idx").on(t.idempotencyKey),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id),
    // Name and price are denormalised on purpose: an order must not change
    // when the catalog does.
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    qty: integer("qty").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    method: text("method").notNull(),
    brand: text("brand"),
    last4: text("last4"),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").$type<"authorized" | "captured" | "refunded" | "failed">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").$type<OrderStatus>().notNull(),
    note: text("note"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

/* --------------------------------------------------------------- feedback */

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").$type<FeedbackStatus>().notNull().default("new"),
    sentiment: text("sentiment").$type<FeedbackSentiment>().notNull().default("neutral"),
    reply: text("reply"),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    helpfulVotes: integer("helpful_votes").notNull().default(0),
  },
  (t) => [
    index("feedback_product_idx").on(t.productId),
    index("feedback_customer_idx").on(t.customerId),
    index("feedback_status_idx").on(t.status),
  ],
);

/* ---------------------------------------------------------- merchandising */

export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  ctaText: text("cta_text"),
  ctaUrl: text("cta_url"),
  audience: text("audience").$type<Audience>().notNull().default("all"),
  status: text("status").$type<PublishStatus>().notNull().default("draft"),
  theme: text("theme").$type<Theme>().notNull().default("brand"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const heroSlides = pgTable("hero_slides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  eyebrow: text("eyebrow"),
  ctaText: text("cta_text"),
  ctaUrl: text("cta_url"),
  audience: text("audience").$type<Audience>().notNull().default("all"),
  status: text("status").$type<PublishStatus>().notNull().default("draft"),
  theme: text("theme").$type<Theme>().notNull().default("brand"),
  imageInitials: text("image_initials"),
  image: text("image"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ admin */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<Role>().notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    hash: text("hash").notNull(),
    createdBy: text("created_by").references(() => adminUsers.id),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("api_keys_hash_idx").on(t.hash)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_at_idx").on(t.at), index("audit_log_entity_idx").on(t.entity)],
);

/**
 * Generated content for the AI Hub screens.
 *
 * Seeded so every screen has something to show on a fresh database, then
 * overwritten by whatever actually generates it. Stored as a document because
 * each copilot has its own shape and there is nothing to query across them.
 */
export const aiContent = pgTable("ai_content", {
  copilot: text("copilot").primaryKey(),
  payload: jsonb("payload").$type<unknown>().notNull(),
  source: text("source").$type<"seed" | "computed" | "model">().notNull().default("seed"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  scope: text("scope").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
