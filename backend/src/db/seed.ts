/**
 * CLI entry point: `npm run seed`.
 *
 * The logic lives in seedData.ts so the same code can be triggered from the
 * admin UI. This file only handles argv, output and the process exit.
 */
import { seedDatabase, DEMO_PASSWORD } from "./seedData.js";
import { sql } from "./index.js";
import { flushDerivedState } from "../redis/cache.js";
import { redis, subscriber, queueConnection } from "../redis/client.js";

const preserveAdmins = process.argv.includes("--preserve-admins");

async function main() {
  console.log("seeding…");
  const r = await seedDatabase({ preserveAdmins });
  console.log(
    `seeded: ${r.categories} categories, ${r.products} products, ${r.customers} customers, ` +
    `${r.orders} orders, ${r.orderItems} line items, ${r.reviews} reviews, ` +
    `${r.addresses} addresses, ${r.wishlistItems} wishlist items, ` +
    `${r.promotions} promotions, ${r.slides} slides, ${r.aiCopilots} AI copilots, ` +
    `${r.adminUsers} admins, ${r.apiKeys} api keys, ${r.auditEntries} audit entries, ` +
    `${r.settings} settings scopes`,
  );
  if (r.skippedOrders) {
    console.warn(`  ${r.skippedOrders} fixture orders had no matching customer and were skipped`);
  }
  // Same as the admin "reseed" button: drop caches built from the old data, or
  // the API keeps serving it (e.g. stale stock) until the TTLs run out.
  await flushDerivedState();
  console.log(`\n  demo password for every seeded account: ${DEMO_PASSWORD}`);
  await sql.end();
  // Importing the client opens all three connections; close them or the process never exits.
  await Promise.all([redis, subscriber, queueConnection].map((c) => c.quit().catch(() => {})));
}

main().catch(async (err) => {
  console.error(err);
  await sql.end().catch(() => {});
  process.exit(1);
});
