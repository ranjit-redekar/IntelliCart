/**
 * Record every GET the UI makes into a snapshot the app can serve offline.
 *
 * The point is to demo without a backend WITHOUT going back to bundled mock
 * data. The app keeps its real API client and its real code paths; only the
 * transport changes. That means the offline build cannot drift from the online
 * one the way a parallel set of fixtures would.
 *
 *   npm run snapshot          # against http://localhost:3000
 *   API=... npm run snapshot
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const API = process.env.API ?? "http://localhost:3000";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../src/offline/snapshot.json");

const ADMIN = { email: "admin@intellicart.shop", password: "demo1234" };
const CUSTOMER = { email: "alex@example.com", password: "demo1234" };

const RANGES = ["7d", "30d", "90d", "365d"];
const COPILOTS = [
  "sales-copilot", "content-studio", "smart-search", "support-assistant",
  "promotion-optimizer", "anomaly-alerts", "review-summarizer", "forecasting",
  "trend-spotter", "daily-briefing", "inventory-agent", "segments", "win-back",
  "bundles", "pricing", "returns-analyzer", "cart-recovery", "product-health",
  "risk", "catalog-audit", "vendors", "localization-agent", "campaigns", "logistics",
];
const SCOPES = ["store", "localization", "shipping", "payments", "authentication", "webhooks"];

/** Cookie jar, because sign-in state decides what these endpoints return. */
function jar() {
  let cookie = "";
  return {
    get: () => cookie,
    absorb(res: Response) {
      const set = res.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0]!;
    },
  };
}

async function signIn(path: string, body: unknown) {
  const j = jar();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  j.absorb(res);
  return j;
}

const snapshot: Record<string, unknown> = {};
let recorded = 0;
const failed: string[] = [];

async function record(path: string, j?: ReturnType<typeof jar>) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: j?.get() ? { cookie: j.get() } : {},
    });
    if (!res.ok) {
      failed.push(`${path} -> ${res.status}`);
      return;
    }
    snapshot[path] = await res.json();
    recorded++;
  } catch (err) {
    failed.push(`${path} -> ${(err as Error).message}`);
  }
}

async function main() {
  console.log(`recording from ${API}`);
  const admin = await signIn("/auth/admin/sign-in", ADMIN);
  const customer = await signIn("/auth/sign-in", CUSTOMER);

  /* ------------------------------------------------------------- public */
  await record("/categories");
  await record("/promotions?surface=web");
  await record("/slides?surface=web");
  await record("/search/suggestions");
  await record("/bestsellers");
  await record("/settings/public");
  await record("/auth/setup-status");

  // The shop grid, its sorts, and each category.
  for (const q of [
    "", "&sort=rating", "&sort=price-asc", "&sort=price-desc", "&sort=newest",
    "&cat=fashion", "&cat=electronics", "&cat=home",
  ]) {
    await record(`/products?page=1&pageSize=24${q}`);
  }
  await record("/products?pageSize=4");
  await record("/products?pageSize=8&sort=rating");

  const all = snapshot["/products?page=1&pageSize=24"] as { items: { id: string }[] };
  for (const p of all.items) {
    await record(`/products/${p.id}`);
    await record(`/products/${p.id}/reviews?pageSize=20`);
    await record(`/products?cat=${(snapshot[`/products/${p.id}`] as { categoryId: string }).categoryId}&pageSize=5`);
  }

  // A few natural-language searches so the AI banner has something to show.
  for (const q of ["best rated electronics under $200", "cheap home decor", "jacket", "gift under $100"]) {
    await record(`/products?page=1&pageSize=24&q=${encodeURIComponent(q)}`);
  }

  /* ----------------------------------------------------------- customer */
  await record("/auth/me", customer);
  await record("/cart", customer);
  await record("/account/overview", customer);
  await record("/account/addresses", customer);
  await record("/account/wishlist", customer);
  await record("/account/reviews?pageSize=50", customer);
  for (const status of ["all", "pending", "processing", "shipped", "delivered"]) {
    await record(`/account/orders?status=${status}&pageSize=50`, customer);
  }
  const orders = snapshot["/account/orders?status=all&pageSize=50"] as { items: { id: string }[] };
  for (const o of orders.items.slice(0, 12)) await record(`/account/orders/${o.id}`, customer);

  /* -------------------------------------------------------------- admin */
  await record("/auth/me", admin); // overwrites the customer one — see note below
  snapshot["/auth/me::admin"] = snapshot["/auth/me"];
  snapshot["/auth/me"] = null; // signed out by default in the demo

  await record("/auth/sessions", admin);
  await record("/admin/promotions", admin);
  await record("/admin/slides", admin);
  await record("/admin/members", admin);
  await record("/admin/api-keys", admin);
  await record("/admin/audit?pageSize=50", admin);
  await record("/admin/analytics/counts", admin);
  await record("/admin/analytics/insights", admin);
  await record("/admin/demo/status", admin);
  await record("/admin/ai/copilots", admin);

  for (const r of RANGES) {
    await record(`/admin/analytics/metrics?range=${r}`, admin);
    await record(`/admin/analytics/revenue-series?range=${r}`, admin);
    await record(`/admin/analytics/top-products?range=${r}`, admin);
    await record(`/admin/analytics/category-share?range=${r}`, admin);
  }
  for (const c of COPILOTS) await record(`/admin/ai/${c}`, admin);
  for (const s of SCOPES) await record(`/admin/settings/${s}`, admin);

  for (const page of [1, 2, 3]) {
    await record(`/admin/products?cat=all&page=${page}&pageSize=10`, admin);
    await record(`/admin/orders?status=all&page=${page}&pageSize=10`, admin);
    await record(`/admin/customers?page=${page}&pageSize=10`, admin);
    await record(`/admin/feedback?status=all&sentiment=all&page=${page}&pageSize=10`, admin);
  }
  for (const p of all.items) await record(`/admin/products/${p.id}`, admin);

  const adminOrders = snapshot["/admin/orders?status=all&page=1&pageSize=10"] as { items: { id: string }[] };
  for (const o of adminOrders.items) await record(`/admin/orders/${o.id}`, admin);
  const customers = snapshot["/admin/customers?page=1&pageSize=10"] as { items: { id: string }[] };
  for (const c of customers.items) await record(`/admin/customers/${c.id}`, admin);

  writeFileSync(OUT, JSON.stringify(snapshot));
  const bytes = JSON.stringify(snapshot).length;
  console.log(`\nrecorded ${recorded} responses -> ${OUT}`);
  console.log(`  ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  if (failed.length) {
    console.warn(`  ${failed.length} failed:`);
    for (const f of failed.slice(0, 10)) console.warn(`    ${f}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
