import type { FastifyInstance } from "fastify";
import { sql as raw } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { seedDatabase, resolveDatasets, DATASETS, ALL_DATASETS, DEMO_PASSWORD, type DatasetKey } from "../db/seedData.js";
import { flushDerivedState } from "../redis/cache.js";
import { env, isProd } from "../env.js";
import { badRequest, forbidden } from "../lib/errors.js";
import { requireAdmin } from "../plugins/auth.js";

/** Typed by the operator to confirm. Deliberately not a one-click button. */
const CONFIRM_PHRASE = "RESET DEMO DATA";

/** Counts shown before and after, so the effect is visible. */
async function tableCounts() {
  const rows = await db.execute<{ table_name: string; rows: number }>(raw`
    select table_name,
           (xpath('/row/c/text()', query_to_xml('select count(*) c from '||quote_ident(table_name), false, true, '')))[1]::text::int as rows
    from information_schema.tables
    where table_schema = 'public'
    order by table_name`);
  return Object.fromEntries([...rows].map((r) => [r.table_name, Number(r.rows)]));
}

export async function demoRoutes(app: FastifyInstance) {
  /**
   * Whether reseeding is available, and what is in the database right now.
   * The admin UI reads this to decide whether to show the controls at all.
   */
  app.get("/admin/demo/status", { preHandler: requireAdmin }, async (req) => {
    const counts = await tableCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // Named datasets rather than raw table names: the person deciding whether
    // to wipe the database should see it in the terms the app uses.
    const datasets = [
      { key: "products", label: "Products", tables: ["products", "product_images", "product_specs", "product_highlights"] },
      { key: "customers", label: "Customers", tables: ["customers", "addresses", "wishlist_items"] },
      { key: "orders", label: "Orders", tables: ["orders", "order_items", "payments", "order_events"] },
      { key: "feedback", label: "Reviews", tables: ["feedback"] },
      { key: "merchandising", label: "Promotions & slides", tables: ["promotions", "hero_slides"] },
      { key: "ai", label: "AI Hub content", tables: ["ai_content"] },
      { key: "settings", label: "Settings", tables: ["settings"] },
      { key: "team", label: "Team & keys", tables: ["admin_users", "api_keys", "audit_log"] },
    ].map((d) => ({
      key: d.key,
      label: d.label,
      rows: d.tables.reduce((n, table) => n + (counts[table] ?? 0), 0),
      tables: d.tables,
      // Admin accounts survive a reseed; everything else is replaced.
      preserved: d.key === "team",
    }));

    return {
      datasets,
      available: ALL_DATASETS.map((key) => ({
        key,
        label: DATASETS[key].label,
        description: DATASETS[key].description,
        requires: DATASETS[key].requires,
      })),
      enabled: env.ALLOW_DEMO_SEED,
      // Only an owner can pull the trigger, so say so up front rather than
      // letting a manager click and get a 403.
      allowedForYou: env.ALLOW_DEMO_SEED && req.session?.role === "owner",
      environment: env.NODE_ENV,
      confirmPhrase: CONFIRM_PHRASE,
      demoPassword: isProd ? null : DEMO_PASSWORD,
      isEmpty: (counts.products ?? 0) === 0,
      totalRows: total,
      counts,
    };
  });

  /**
   * Wipe and reseed.
   *
   * Three locks, because this deletes every order and customer in the
   * database and there is no undo:
   *   1. ALLOW_DEMO_SEED must be on (off by default in production)
   *   2. the caller must be an owner
   *   3. they must type the confirmation phrase
   *
   * Admin accounts are preserved: the caller is one of them, and wiping the
   * table would sign them out and delete the account they would need to sign
   * back in with.
   */
  app.post("/admin/demo/seed", { preHandler: requireAdmin }, async (req) => {
    if (!env.ALLOW_DEMO_SEED) {
      throw forbidden("Demo seeding is disabled on this environment (ALLOW_DEMO_SEED is off).");
    }
    if (req.session?.role !== "owner") {
      throw forbidden("Only an owner can reset demo data.");
    }

    const body = z
      .object({
        confirm: z.string(),
        preserveAdmins: z.boolean().default(true),
        // Empty means everything, so an older client keeps working.
        datasets: z.array(z.string()).default([]),
      })
      .parse(req.body);

    if (body.confirm !== CONFIRM_PHRASE) {
      throw badRequest(`Type "${CONFIRM_PHRASE}" to confirm.`, {
        confirm: [`Expected "${CONFIRM_PHRASE}".`],
      });
    }

    const before = await tableCounts();
    const started = Date.now();
    const requested = body.datasets.filter((d): d is DatasetKey => d in DATASETS);
    const result = await seedDatabase({
      datasets: requested.length ? resolveDatasets(requested) : ALL_DATASETS,
      preserveAdmins: body.preserveAdmins,
    });

    // Everything cached is now stale: prices, lists, analytics, settings, and
    // any cart holding a product id that no longer exists.
    await flushDerivedState();

    const after = await tableCounts();
    req.log.info({ actor: req.session?.email, result }, "demo data reseeded");

    return {
      ok: true,
      tookMs: Date.now() - started,
      seeded: result,
      before,
      after,
      demoPassword: isProd ? null : DEMO_PASSWORD,
    };
  });
}

