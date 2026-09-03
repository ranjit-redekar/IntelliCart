/**
 * The seeder, callable from the CLI (`npm run seed`) and from the admin UI.
 *
 * Reads src/db/fixtures.json, a build-time snapshot of mockdata/*.ts — see
 * scripts/export-fixtures.ts. Editing mockdata/ is still how you change the
 * demo data.
 */
import argon2 from "argon2";
import { sql as raw, eq } from "drizzle-orm";
import { db } from "./index.js";
import * as t from "./schema.js";
import { toCents } from "../lib/money.js";
import { priceCart } from "../lib/pricing.js";
import fixturesJson from "./fixtures.json" with { type: "json" };

/**
 * The shape of the snapshot. JSON inference collapses optional fields into
 * awkward unions (some product images carry `url`, some do not), so the
 * boundary is typed once here rather than fought with at every use.
 */
interface Fixtures {
  categories: { id: string; name: string }[];
  products: { id: string; name: string; category: string; categoryId: string; price: number; stock: number; rating: number; image: string }[];
  orders: { id: string; customerName: string; total: number; status: string; placedAt: string }[];
  customers: { id: string; name: string; email: string; orders: number }[];
  feedback: {
    id: string; productId: string; customerId: string; rating: number; title: string; body: string;
    createdAt: string; status: string; sentiment: string; reply?: string; repliedAt?: string; helpfulVotes: number;
  }[];
  promotions: { id: string; title: string; message: string; ctaText?: string; ctaUrl?: string; audience: string; status: string; theme: string; startsAt?: string; endsAt?: string; createdAt: string }[];
  heroSlides: { id: string; title: string; subtitle: string; eyebrow?: string; ctaText?: string; ctaUrl?: string; audience: string; status: string; theme: string; imageInitials?: string; image?: string; order: number; createdAt: string }[];
  productExtras: {
    productId: string;
    images: { id: string; initials: string; theme: string; caption?: string; url?: string }[];
    specs: { key: string; value: string }[];
    highlights: string[];
    inBox?: string[];
  }[];
  aiContent: Record<string, unknown>;
}

const fixtures = fixturesJson as unknown as Fixtures;

export const DEMO_PASSWORD = "demo1234";

/** Default configuration for every settings screen. */
const SETTINGS_SEED = [
    {
      scope: "store",
      value: {
        storeName: "IntelliCart Commerce",
        legalName: "IntelliCart Retail Pvt. Ltd.",
        tagline: "Quietly modern essentials.",
        domain: "intellicart.shop",
        supportEmail: "help@intellicart.shop",
        supportPhone: "+1 (503) 555-0142",
        currency: "USD",
        timezone: "UTC-05:00 (New York)",
        weekStart: "Monday",
        description:
          "IntelliCart crafts everyday essentials with restraint, comfort, and a quiet sense of luxury.",
        contactEmail: "hello@intellicart.shop",
        contactPhone: "+1 (503) 555-0142",
        websiteUrl: "https://intellicart.shop",
        addressLine: "1420 Alder Street, Portland, OR 97205, US",
        orderPrefix: "ORD-",
        customerPrefix: "C-",
        address: { line1: "1420 Alder Street", city: "Portland", postal: "97205", country: "US" },
      },
    },
    {
      scope: "localization",
      value: {
        primaryCurrency: "USD",
        enabledCurrencies: ["USD", "EUR", "GBP"],
        enabledLanguages: ["en", "es"],
        currencies: [
          { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
          { code: "EUR", name: "Euro", symbol: "€", rate: 0.92 },
          { code: "GBP", name: "British Pound", symbol: "£", rate: 0.79 },
          { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 83.2 },
          { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 157.1 },
        ],
        languages: [
          { code: "en", name: "English", flag: "🇬🇧", primary: true },
          { code: "es", name: "Spanish", flag: "🇪🇸", primary: false },
          { code: "fr", name: "French", flag: "🇫🇷", primary: false },
          { code: "ja", name: "Japanese", flag: "🇯🇵", primary: false },
        ],
        regions: [
          { code: "US", name: "United States", customers: 624 },
          { code: "EU", name: "European Union", customers: 184 },
          { code: "GB", name: "United Kingdom", customers: 64 },
          { code: "JP", name: "Japan", customers: 20 },
        ],
      },
    },
    {
      scope: "shipping",
      value: {
        freeOver: 50,
        flatRate: 8,
        taxRate: 0.08,
        zones: [
          { id: "z1", name: "US · Metro", countries: "Portland, Seattle, SF, +5", carriers: ["UPS", "FedEx"], free: 50, sla: "1-2 days" },
          { id: "z2", name: "US · Rest", countries: "All other ZIP codes", carriers: ["UPS", "USPS"], free: 75, sla: "3-5 days" },
          { id: "z3", name: "International · Europe", countries: "27 EU countries, UK", carriers: ["DHL Express"], free: 120, sla: "5-9 days" },
          { id: "z4", name: "International · Rest", countries: "96 countries", carriers: ["DHL Express"], free: 180, sla: "8-15 days" },
        ],
        taxClasses: [
          { id: "t1", name: "Standard goods", rate: 8, applied: "All categories by default" },
          { id: "t2", name: "Apparel", rate: 6, applied: "Fashion category" },
          { id: "t3", name: "Electronics", rate: 8, applied: "Electronics category" },
          { id: "t4", name: "Reduced", rate: 0, applied: "Digital and gift cards" },
        ],
      },
    },
    {
      scope: "payments",
      value: {
        payoutSchedule: "daily",
        statementDescriptor: "INTELLICART",
        gateways: [
          { id: "stripe", name: "Stripe", brand: "S", status: "connected", capture: "Automatic", fee: "2.9% + 30¢" },
          { id: "paypal", name: "PayPal", brand: "PP", status: "connected", capture: "Automatic", fee: "3.49% + 49¢" },
          { id: "applepay", name: "Apple Pay", brand: "AP", status: "connected", capture: "Automatic", fee: "2.9% + 30¢" },
          { id: "adyen", name: "Adyen", brand: "AD", status: "available", capture: "Manual", fee: "Negotiated" },
        ],
        reconRows: [
          { id: "TXN-9201", date: "2026-05-17", amount: 1284, fee: 24, method: "Stripe · Card", status: "settled" },
          { id: "TXN-9202", date: "2026-05-17", amount: 512, fee: 15, method: "PayPal", status: "settled" },
          { id: "TXN-9203", date: "2026-05-18", amount: 328, fee: 8, method: "Stripe · Card", status: "pending" },
          { id: "TXN-9204", date: "2026-05-18", amount: 89, fee: 0, method: "Apple Pay", status: "pending" },
        ],
      },
    },
    {
      scope: "authentication",
      value: {
        twoFactor: true,
        enforceTwoFactor: false,
        magicLink: true,
        autoLogoutMinutes: 60,
        passwordMinLength: 8,
        providers: [
          { id: "google", name: "Google Workspace", connected: true },
          { id: "github", name: "GitHub", connected: false },
          { id: "saml", name: "SAML SSO", connected: false },
        ],
      },
    },
    {
      scope: "webhooks",
      value: {
        endpoints: [
          { id: "w1", url: "https://api.intellicart.shop/v1/webhooks/orders", events: ["order.created", "order.fulfilled"], status: "active", lastDelivery: "1 min ago" },
          { id: "w2", url: "https://hooks.zapier.com/intellicart/customers", events: ["customer.created"], status: "active", lastDelivery: "27 min ago" },
          { id: "w3", url: "https://logs.internal.intellicart/ingest", events: ["product.updated", "stock.low"], status: "failing", lastDelivery: "4 hours ago" },
        ],
      },
    },
  ];

export interface SeedResult {
  /** Datasets actually written, after dependency resolution. */
  datasets: DatasetKey[];
  categories: number;
  products: number;
  customers: number;
  orders: number;
  /** Of `orders`, how many are the generated trading history. */
  generatedOrders: number;
  orderItems: number;
  reviews: number;
  addresses: number;
  wishlistItems: number;
  promotions: number;
  slides: number;
  aiCopilots: number;
  settings: number;
  adminUsers: number;
  apiKeys: number;
  auditEntries: number;
  skippedOrders: number;
}

/** Same hash the fixtures were built against, so seeded orders reproduce. */
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

const CROPS = ["", "&crop=entropy", "&crop=top", "&crop=right"];
const FLOW = ["pending", "processing", "shipped", "delivered"] as const;

/**
 * What can be seeded, and what each piece needs to make sense.
 *
 * Order history without a catalog is line items pointing at nothing, so the
 * dependencies are resolved rather than left to the caller to remember.
 */
export type DatasetKey =
  | "catalog" | "customers" | "orders" | "reviews"
  | "merchandising" | "aiContent" | "settings" | "team";

interface DatasetDef {
  label: string;
  description: string;
  requires: DatasetKey[];
}

export const DATASETS: Record<DatasetKey, DatasetDef> = {
  catalog: {
    label: "Product catalog",
    description: "24 products with images, specs and highlights.",
    requires: [],
  },
  customers: {
    label: "Customers",
    description: "92 shoppers with saved addresses and wishlists.",
    requires: ["catalog"],
  },
  orders: {
    label: "Order history",
    description: "~600 orders across the last 180 days, with payments and timelines.",
    requires: ["catalog", "customers"],
  },
  reviews: {
    label: "Customer reviews",
    description: "Ratings and replies, written by people who bought the item.",
    requires: ["catalog", "customers"],
  },
  merchandising: {
    label: "Promotions & hero slides",
    description: "Storefront banners and the homepage carousel.",
    requires: [],
  },
  aiContent: {
    label: "AI Hub content",
    description: "Content for all 24 AI screens.",
    requires: [],
  },
  settings: {
    label: "Store settings",
    description: "Shipping zones, tax classes, payments, localization.",
    requires: [],
  },
  team: {
    label: "Demo team & keys",
    description: "Three extra admin logins, API keys and audit history.",
    requires: [],
  },
};

export const ALL_DATASETS = Object.keys(DATASETS) as DatasetKey[];

/** Tables each dataset owns, so only what is being replaced gets cleared. */
const DATASET_TABLES: Record<DatasetKey, string[]> = {
  catalog: ["products", "product_images", "product_specs", "product_highlights", "categories"],
  customers: ["customers", "addresses", "wishlist_items"],
  orders: ["orders", "order_items", "payments", "order_events"],
  reviews: ["feedback"],
  merchandising: ["promotions", "hero_slides"],
  aiContent: ["ai_content"],
  settings: ["settings"],
  team: ["api_keys", "audit_log"],
};

/** Pull in whatever the selection depends on. */
export function resolveDatasets(selected: readonly DatasetKey[]): DatasetKey[] {
  const out = new Set<DatasetKey>();
  const visit = (key: DatasetKey) => {
    if (out.has(key)) return;
    out.add(key);
    for (const dep of DATASETS[key].requires) visit(dep);
  };
  for (const key of selected) if (key in DATASETS) visit(key);
  // Keep declaration order so the result reads predictably.
  return ALL_DATASETS.filter((k) => out.has(k));
}

export interface SeedOptions {
  /** Defaults to everything. */
  datasets?: readonly DatasetKey[];
  /**
   * Keep the admin_users table. The person triggering a reseed from the admin
   * UI is signed in as one of those rows — wiping them would log them out and
   * delete the account they would need to sign back in with.
   */
  preserveAdmins?: boolean;
}

const DAY = 86_400_000;
/** How far back the generated trading history runs. */
const HISTORY_DAYS = 180;

/**
 * Deterministic PRNG (mulberry32).
 *
 * Reseeding twice must produce the same store, otherwise every demo and every
 * screenshot tells a different story.
 */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A plausible order history for the last HISTORY_DAYS.
 *
 * Not uniform noise: weekends dip, volume trends upward, and older orders have
 * finished shipping while recent ones are still moving. A flat random series
 * makes every chart on the dashboard look broken.
 */
function generateOrderHistory(f: Fixtures, customers: Fixtures["customers"]) {
  const random = rng(20260519);
  const products = f.products;

  const orders: (typeof t.orders.$inferInsert)[] = [];
  const items: (typeof t.orderItems.$inferInsert)[] = [];
  const payments: (typeof t.payments.$inferInsert)[] = [];
  const events: (typeof t.orderEvents.$inferInsert)[] = [];

  let counter = 10_000;
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
    const date = new Date(today.getTime() - daysAgo * DAY);
    const dow = date.getUTCDay();

    // Volume: a gentle upward trend, a weekend dip, and a little noise.
    const trend = 1 + ((HISTORY_DAYS - daysAgo) / HISTORY_DAYS) * 1.4;
    const weekend = dow === 0 || dow === 6 ? 0.55 : 1;
    const count = Math.max(0, Math.round((1.6 * trend * weekend + random() * 2.2) - 0.4));

    for (let n = 0; n < count; n++) {
      const id = `ORD-${counter++}`;
      const customer = customers[Math.floor(random() * customers.length)]!;
      const addr = ADDRESS_POOL[Math.floor(random() * ADDRESS_POOL.length)]!;

      const lineCount = 1 + Math.floor(random() * 3);
      const chosen = new Map<string, number>();
      for (let i = 0; i < lineCount; i++) {
        const p = products[Math.floor(random() * products.length)]!;
        chosen.set(p.id, (chosen.get(p.id) ?? 0) + 1 + Math.floor(random() * 2));
      }

      const lines = [...chosen.entries()].map(([productId, qty]) => {
        const p = products.find((x) => x.id === productId)!;
        return { product: p, qty };
      });
      const totals = priceCart(
        lines.map((l) => ({ productId: l.product.id, qty: l.qty, unitPriceCents: toCents(l.product.price) })),
      );

      // Spread the hour so a day is not one spike at noon.
      const placedAt = new Date(date.getTime() + Math.floor(random() * 14 - 7) * 3_600_000);

      // Older orders have arrived; the last few days are still in flight.
      const status: (typeof FLOW)[number] =
        daysAgo > 10 ? "delivered"
        : daysAgo > 5 ? (random() < 0.8 ? "delivered" : "shipped")
        : daysAgo > 2 ? (random() < 0.6 ? "shipped" : "processing")
        : random() < 0.5 ? "processing" : "pending";

      orders.push({
        id, customerId: customer.id, status, placedAt,
        subtotalCents: totals.subtotalCents, shippingCents: totals.shippingCents,
        taxCents: totals.taxCents, totalCents: totals.totalCents,
        shipName: customer.name, shipLine1: addr.line1, shipCity: addr.city,
        shipPostal: addr.postal, shipCountry: addr.country,
        idempotencyKey: `seed-${id}`,
      });

      for (const l of lines) {
        items.push({
          orderId: id, productId: l.product.id, name: l.product.name,
          sku: l.product.id, qty: l.qty, unitPriceCents: toCents(l.product.price),
        });
      }

      payments.push({
        id: `PAY-${id.slice(-5)}`, orderId: id, method: "card",
        brand: ["Visa", "Mastercard", "Amex"][Math.floor(random() * 3)]!,
        last4: String(1000 + Math.floor(random() * 9000)),
        amountCents: totals.totalCents, status: "captured" as const,
      });

      const upto = FLOW.indexOf(status);
      for (let i = 0; i <= upto; i++) {
        events.push({
          orderId: id, status: FLOW[i]!,
          at: new Date(placedAt.getTime() + i * DAY),
          note: i === 0 ? "Order placed" : null,
        });
      }
    }
  }

  return { orders, items, payments, events };
}

const FIRST_NAMES = [
  "Alex","Maya","Jordan","Priya","Ethan","Sofia","Liam","Nora","Daniel","Isabella",
  "Marcus","Aisha","Ryo","Elena","Omar","Grace","Hugo","Leila","Noah","Zara",
  "Felix","Amara","Theo","Ines","Kai","Rosa","Milo","Yuki","Ada","Ravi",
  "Clara","Tomas","Nina","Owen","Freya","Diego","Iris","Samir","Lena","Jonas",
];
const LAST_NAMES = [
  "Turner","Singh","Miles","Sharma","Wright","Marino","Park","Khan","Cho","Rossi",
  "Hale","Bello","Tanaka","Petrova","Haddad","Okafor","Lindqvist","Fournier","Bauer","Novak",
  "Moreau","Silva","Kowalski","Nguyen","Costa","Ferrari","Andersen","Ivanov","Reyes","Dubois",
];

/** Review copy keyed by rating, so a 2-star does not read like a 5-star. */
const REVIEW_COPY: Record<number, { title: string; body: string }[]> = {
  5: [
    { title: "Exactly what I wanted", body: "Arrived quickly and looks even better in person. Would buy again without hesitating." },
    { title: "Worth every penny", body: "Built properly. The details you only notice after a week of use are all right." },
    { title: "My new favourite", body: "Using it daily. Nothing to fault so far and it has held up well." },
  ],
  4: [
    { title: "Very good, small niggle", body: "Really pleased overall. Took a few days to get used to, but no regrets." },
    { title: "Solid buy", body: "Does the job well. Packaging could be less wasteful, but the product itself is great." },
    { title: "Close to perfect", body: "Only thing keeping this from five stars is the colour reads slightly darker than the photos." },
  ],
  3: [
    { title: "Fine, not remarkable", body: "It works. Nothing wrong with it, but nothing that made me want to tell anyone either." },
    { title: "Mixed feelings", body: "Good quality for the price, though the sizing guide could be clearer." },
  ],
  2: [
    { title: "Not quite right", body: "Quality is okay but it did not match what I expected from the description." },
    { title: "Disappointed", body: "Started showing wear sooner than I would like. Support were helpful about it." },
  ],
  1: [
    { title: "Would not buy again", body: "Arrived damaged and the replacement had the same issue. Refund was straightforward at least." },
  ],
};

export async function seedDatabase(opts: SeedOptions = {}): Promise<SeedResult> {
  const preserveAdmins = opts.preserveAdmins ?? false;
  const chosen = resolveDatasets(opts.datasets ?? ALL_DATASETS);
  const want = (key: DatasetKey) => chosen.includes(key);
  const f = fixtures;

  // Clear only what is being rewritten. CASCADE handles referencing rows, so
  // replacing the catalog also clears the orders that point at it — which is
  // correct, and is why `orders` depends on `catalog`.
  const tables = [
    ...new Set([
      "cart_items", "carts",
      ...chosen.flatMap((key) => DATASET_TABLES[key]),
      ...(preserveAdmins || !want("team") ? [] : ["admin_users"]),
    ]),
  ];
  if (tables.length) {
    await db.execute(raw`truncate table ${raw.raw(tables.join(", "))} restart identity cascade`);
  }

  /* ---------------------------------------------------------- categories */
  // "all" is a UI filter sentinel, not a category.
  const realCategories = f.categories.filter((c) => c.id !== "all");
  if (want("catalog")) {
    await db.insert(t.categories).values(
      realCategories.map((c, i) => ({ id: c.id, name: c.name, position: i })),
    );
  }

  /* ------------------------------------------------------------ products */
  // A demo store where nothing needs reordering leaves the insights panel and
  // the inventory copilot with nothing to say. Put a few SKUs under their
  // reorder point — chosen to be ones no test buys from.
  const LOW_STOCK: Record<string, number> = { "P-1012": 4, "P-1020": 7, "P-1021": 2 };

  if (want("catalog")) await db.insert(t.products).values(
    f.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.name} — part of the ${p.category.toLowerCase()} range.`,
      sku: p.id,
      categoryId: p.categoryId,
      priceCents: toCents(p.price),
      stock: LOW_STOCK[p.id] ?? p.stock,
      lowStock: 10,
      trackInventory: true,
      rating: p.rating,
      image: p.image,
      status: "active" as const,
      tags: [p.categoryId],
    })),
  );

  /* -------------------------------------------------- product extras */
  const seeded = new Map(f.productExtras.map((e) => [e.productId, e]));
  const images: (typeof t.productImages.$inferInsert)[] = [];
  const specs: (typeof t.productSpecs.$inferInsert)[] = [];
  const highlights: (typeof t.productHighlights.$inferInsert)[] = [];

  for (const p of f.products) {
    const extra = seeded.get(p.id);
    if (extra) {
      extra.images.forEach((im, i) =>
        images.push({
          id: `${p.id}-IMG-${i}`, productId: p.id, url: im.url ?? p.image,
          initials: im.initials, theme: im.theme as never,
          caption: im.caption ?? null, position: i,
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
  if (want("catalog")) {
    await db.insert(t.productImages).values(images);
    await db.insert(t.productSpecs).values(specs);
    await db.insert(t.productHighlights).values(highlights);
  }

  /* ----------------------------------------------------------- customers */
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  // 22 fixture customers against 598 orders makes every CRM screen look like
  // the same handful of people buying everything. Generate a realistic roster.
  const nameRandom = rng(910231);
  const extraCustomers: { id: string; name: string; email: string; orders: number }[] = [];
  const takenEmails = new Set(f.customers.map((c) => c.email.toLowerCase()));
  for (let i = 0; i < 70; i++) {
    const first = FIRST_NAMES[Math.floor(nameRandom() * FIRST_NAMES.length)]!;
    const last = LAST_NAMES[Math.floor(nameRandom() * LAST_NAMES.length)]!;
    const name = `${first} ${last}`;
    let email = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com";
    if (takenEmails.has(email)) email = email.replace("@", `${i}@`);
    takenEmails.add(email);
    extraCustomers.push({ id: `C-${(100 + i).toString()}`, name, email, orders: 0 });
  }

  const allCustomers = [...f.customers, ...extraCustomers];
  if (want("customers")) await db.insert(t.customers).values(
    allCustomers.map((c) => ({ id: c.id, name: c.name, email: c.email.toLowerCase(), passwordHash })),
  );
  // Fixture orders join by display name, so only the fixture names go in here.
  const customerByName = new Map(f.customers.map((c) => [c.name, c]));

  /* -------------------------------------------------------------- orders */
  // The fixtures link orders to customers by display name. That join is
  // resolved here, once, and never again.
  const orderRows: (typeof t.orders.$inferInsert)[] = [];
  const itemRows: (typeof t.orderItems.$inferInsert)[] = [];
  const eventRows: (typeof t.orderEvents.$inferInsert)[] = [];
  const paymentRows: (typeof t.payments.$inferInsert)[] = [];
  let skippedOrders = 0;

  // The fixture dates are fixed (2026-04-29 … 2026-05-19). Left alone they
  // drift further into the past every day, and the dashboard — which defaults
  // to the last 7 days — shows an empty chart. Shift the whole set so the
  // newest order lands 2 days ago, preserving the relative spacing.
  const fixtureDates = f.orders.map((o) => new Date(`${o.placedAt}T12:00:00Z`).getTime());
  const newestFixture = Math.max(...fixtureDates);
  const shiftMs = Date.now() - 2 * DAY - newestFixture;

  for (const o of f.orders) {
    const customer = customerByName.get(o.customerName);
    if (!customer) { skippedOrders++; continue; }

    const seed = hashString(o.id);
    const count = (seed % 3) + 1;
    const lines = Array.from({ length: count }, (_, i) => {
      const p = f.products[(seed + i * 17) % f.products.length]!;
      return { product: p, qty: ((seed >> (i + 1)) % 2) + 1 };
    });

    // Totals recomputed with the real pricing function — no `adjustment`
    // plug figure making the arithmetic agree.
    const totals = priceCart(
      lines.map((l) => ({ productId: l.product.id, qty: l.qty, unitPriceCents: toCents(l.product.price) })),
    );
    const addr = ADDRESS_POOL[seed % ADDRESS_POOL.length]!;
    const placedAt = new Date(new Date(`${o.placedAt}T12:00:00Z`).getTime() + shiftMs);

    orderRows.push({
      id: o.id, customerId: customer.id, status: o.status as never, placedAt,
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
    // A delivered order went through every prior state; the timeline is real
    // history, not four labels rendered from the current status.
    const upto = FLOW.indexOf(o.status as (typeof FLOW)[number]);
    for (let i = 0; i <= upto; i++) {
      eventRows.push({
        orderId: o.id, status: FLOW[i]!,
        at: new Date(placedAt.getTime() + i * 86_400_000),
        note: i === 0 ? "Order placed" : null,
      });
    }
  }

  // 27 fixture orders across three weeks is not enough to draw a revenue
  // curve, a top-products table or a category split. Generate a longer
  // trading history so every range on the dashboard has something in it.
  const generated = want("orders")
    ? generateOrderHistory(f, allCustomers)
    : { orders: [], items: [], payments: [], events: [] };
  orderRows.push(...generated.orders);
  itemRows.push(...generated.items);
  paymentRows.push(...generated.payments);
  eventRows.push(...generated.events);

  if (want("orders") && orderRows.length) {
    await db.insert(t.orders).values(orderRows);
    await db.insert(t.orderItems).values(itemRows);
    await db.insert(t.payments).values(paymentRows);
    await db.insert(t.orderEvents).values(eventRows);
  }

  /* ----------------------------------------------------------- addresses */
  // Every customer who has ordered has an address on file; a few have two.
  const addrRandom = rng(553311);
  const addressRows: (typeof t.addresses.$inferInsert)[] = [];
  for (const c of allCustomers) {
    if (addrRandom() > 0.82) continue; // a few never saved one
    const count = addrRandom() > 0.75 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const a = ADDRESS_POOL[Math.floor(addrRandom() * ADDRESS_POOL.length)]!;
      addressRows.push({
        id: `ADR-${c.id}-${i}`,
        customerId: c.id,
        label: i === 0 ? "Home" : "Work",
        name: c.name,
        line1: a.line1,
        city: a.city,
        postal: a.postal,
        country: a.country,
        isDefault: i === 0,
      });
    }
  }
  if (want("customers") && addressRows.length) await db.insert(t.addresses).values(addressRows);

  /* ------------------------------------------------------------ wishlists */
  const wishRandom = rng(778812);
  const wishRows: (typeof t.wishlistItems.$inferInsert)[] = [];
  for (const c of allCustomers) {
    if (wishRandom() > 0.45) continue;
    const picks = new Set<string>();
    const howMany = 1 + Math.floor(wishRandom() * 4);
    for (let i = 0; i < howMany; i++) {
      picks.add(f.products[Math.floor(wishRandom() * f.products.length)]!.id);
    }
    for (const productId of picks) {
      wishRows.push({
        customerId: c.id,
        productId,
        addedAt: new Date(Date.now() - Math.floor(wishRandom() * 60) * DAY),
      });
    }
  }
  if (want("customers") && wishRows.length) await db.insert(t.wishlistItems).values(wishRows);

  /* ------------------------------------------------------------ feedback */
  const customerIds = new Set(allCustomers.map((c) => c.id));
  const productIds = new Set(f.products.map((p) => p.id));
  const feedbackRows: (typeof t.feedback.$inferInsert)[] = f.feedback
    .filter((x) => customerIds.has(x.customerId) && productIds.has(x.productId))
    .map((x) => ({
      id: x.id, productId: x.productId, customerId: x.customerId,
      rating: x.rating, title: x.title, body: x.body,
      createdAt: new Date(new Date(`${x.createdAt}T12:00:00Z`).getTime() + shiftMs),
      status: x.status as never, sentiment: x.sentiment as never,
      reply: x.reply ?? null,
      repliedAt: x.repliedAt ? new Date(new Date(`${x.repliedAt}T12:00:00Z`).getTime() + shiftMs) : null,
      helpfulVotes: x.helpfulVotes,
    }));

  // Reviews come from people who actually received the thing. Deriving them
  // from delivered orders means every review has a matching purchase, which
  // is what the "you can review what you ordered" rule requires.
  const reviewRandom = rng(112233);
  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  const reviewed = new Set(feedbackRows.map((r) => `${r.customerId}:${r.productId}`));
  let reviewNo = 10_000;

  for (const order of orderRows) {
    if (order.status !== "delivered") continue;
    if (reviewRandom() > 0.22) continue;
    const lines = itemsByOrder.get(order.id) ?? [];
    const line = lines[Math.floor(reviewRandom() * lines.length)];
    if (!line?.productId) continue;

    const key = `${order.customerId}:${line.productId}`;
    if (reviewed.has(key)) continue; // one review per customer per product
    reviewed.add(key);

    // Weighted toward the top, the way real ratings distribute.
    const roll = reviewRandom();
    const rating = roll < 0.52 ? 5 : roll < 0.78 ? 4 : roll < 0.9 ? 3 : roll < 0.97 ? 2 : 1;
    const copy = REVIEW_COPY[rating]![Math.floor(reviewRandom() * REVIEW_COPY[rating]!.length)]!;
    const sentiment = rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral";

    // Written a few days after delivery, never in the future.
    const placed = order.placedAt as Date;
    const createdAt = new Date(
      Math.min(Date.now(), placed.getTime() + (3 + Math.floor(reviewRandom() * 12)) * DAY),
    );

    const replied = rating <= 3 ? reviewRandom() < 0.7 : reviewRandom() < 0.25;
    const flagged = rating <= 2 && reviewRandom() < 0.35;

    feedbackRows.push({
      id: `FB-${reviewNo++}`,
      productId: line.productId,
      customerId: order.customerId,
      rating,
      title: copy.title,
      body: copy.body,
      createdAt,
      status: (flagged ? "flagged" : replied ? "replied" : "new") as never,
      sentiment: sentiment as never,
      reply: replied ? "Thanks for taking the time to write this — we've passed it to the product team." : null,
      repliedAt: replied ? new Date(createdAt.getTime() + DAY) : null,
      helpfulVotes: Math.floor(reviewRandom() * 24),
    });
  }
  if (want("reviews") && feedbackRows.length) await db.insert(t.feedback).values(feedbackRows);

  /* ------------------------------------------------------- merchandising */
  if (want("merchandising")) await db.insert(t.promotions).values(
    f.promotions.map((p) => ({
      id: p.id, title: p.title, message: p.message,
      ctaText: p.ctaText ?? null, ctaUrl: p.ctaUrl ?? null,
      audience: p.audience as never, status: p.status as never, theme: p.theme as never,
      startsAt: p.startsAt ?? null, endsAt: p.endsAt ?? null,
      createdAt: new Date(`${p.createdAt}T12:00:00Z`),
    })),
  );
  if (want("merchandising")) await db.insert(t.heroSlides).values(
    f.heroSlides.map((s) => ({
      id: s.id, title: s.title, subtitle: s.subtitle,
      eyebrow: s.eyebrow ?? null, ctaText: s.ctaText ?? null, ctaUrl: s.ctaUrl ?? null,
      audience: s.audience as never, status: s.status as never, theme: s.theme as never,
      imageInitials: s.imageInitials ?? null, image: s.image ?? null,
      order: s.order, createdAt: new Date(`${s.createdAt}T12:00:00Z`),
    })),
  );

  /* ---------------------------------------------------------- ai content */
  if (want("aiContent")) await db.insert(t.aiContent).values(
    Object.entries(f.aiContent).map(([copilot, payload]) => ({
      copilot, payload: payload as unknown, source: "seed" as const,
    })),
  );

  /* -------------------------------------------------------- admin users */
  const demoAdmins = [
    { id: "A-1", email: "admin@intellicart.shop", name: "Admin", passwordHash, role: "owner" as const },
    { id: "A-2", email: "manager@intellicart.shop", name: "Manager", passwordHash, role: "manager" as const },
    { id: "A-3", email: "staff@intellicart.shop", name: "Staff", passwordHash, role: "viewer" as const },
  ];
  if (want("team")) {
    if (preserveAdmins) {
      // Restore any demo admin that is missing, leave real accounts untouched.
      for (const admin of demoAdmins) {
        const existing = await db.select({ id: t.adminUsers.id }).from(t.adminUsers).where(eq(t.adminUsers.email, admin.email));
        if (!existing.length) await db.insert(t.adminUsers).values(admin);
      }
    } else {
      await db.insert(t.adminUsers).values(demoAdmins);
    }
  }
  const adminCount = (await db.select({ id: t.adminUsers.id }).from(t.adminUsers)).length;

  /* ------------------------------------------------------------ api keys */
  // Hashes only — deliberately not usable. A real key is returned once, at
  // creation, and never stored in a recoverable form.
  const ownerId = (await db.select({ id: t.adminUsers.id }).from(t.adminUsers).where(eq(t.adminUsers.role, "owner")))[0]?.id ?? null;
  if (want("team")) await db.insert(t.apiKeys).values([
    { id: "KEY-SEED-1", name: "Storefront (read-only)", prefix: "ic_live_9f", hash: "seed-not-a-real-key-1", createdBy: ownerId },
    { id: "KEY-SEED-2", name: "Warehouse sync", prefix: "ic_live_2b", hash: "seed-not-a-real-key-2", createdBy: ownerId },
  ]);

  /* ------------------------------------------------------------- settings */
  if (want("settings")) await db.insert(t.settings).values(SETTINGS_SEED);

  /* ----------------------------------------------------------- audit log */
  const auditSeed = [
    { action: "product.update", entity: "product", entityId: "P-1002" },
    { action: "order.status", entity: "order", entityId: "ORD-8903" },
    { action: "member.invite", entity: "admin_user", entityId: "A-2" },
    { action: "settings.update", entity: "settings", entityId: "shipping" },
    { action: "feedback.update", entity: "feedback", entityId: "FB-2004" },
    { action: "promotion.create", entity: "promotion", entityId: "PR-103" },
  ];
  if (want("team")) await db.insert(t.auditLog).values(
    auditSeed.map((entry, i) => ({
      ...entry,
      actorId: ownerId,
      actorEmail: "admin@intellicart.shop",
      meta: { seeded: true },
      at: new Date(Date.now() - (i + 1) * 3_600_000),
    })),
  );

  return {
    datasets: chosen,
    categories: want("catalog") ? realCategories.length : 0,
    products: want("catalog") ? f.products.length : 0,
    generatedOrders: generated.orders.length,
    customers: want("customers") ? allCustomers.length : 0,
    orders: orderRows.length,
    orderItems: itemRows.length,
    reviews: want("reviews") ? feedbackRows.length : 0,
    addresses: want("customers") ? addressRows.length : 0,
    wishlistItems: want("customers") ? wishRows.length : 0,
    promotions: want("merchandising") ? f.promotions.length : 0,
    slides: want("merchandising") ? f.heroSlides.length : 0,
    aiCopilots: want("aiContent") ? Object.keys(f.aiContent).length : 0,
    settings: want("settings") ? SETTINGS_SEED.length : 0,
    adminUsers: adminCount,
    apiKeys: want("team") ? 2 : 0,
    auditEntries: want("team") ? auditSeed.length : 0,
    skippedOrders,
  };
}
