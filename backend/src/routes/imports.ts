import type { FastifyInstance } from "fastify";
import { eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { products, categories } from "../db/schema.js";
import { requirePermission } from "../plugins/auth.js";
import { toCents } from "../lib/money.js";
import { invalidateProducts } from "../redis/cache.js";
import { newId } from "../lib/ids.js";
import { conflict } from "../lib/errors.js";
import { audit } from "../lib/audit.js";
import { productBody } from "./admin.js";

/**
 * The product form's own rules, with every field optional so a row updates
 * only what it carries. Tags arrive as one "a; b" cell rather than an array.
 */
const fields = productBody
  .pick({ name: true, sku: true, price: true, comparePrice: true, cost: true, stock: true, lowStock: true, status: true })
  .partial()
  .extend({ tags: z.string().transform((s) => s.split(";").map((t) => t.trim()).filter(Boolean)).optional() });

/** Error messages use the export's column labels so they match the file. */
const LABELS: Record<string, string> = {
  id: "ID", sku: "SKU", name: "Name", category: "Category", status: "Status", price: "Price",
  comparePrice: "Compare-at price", cost: "Cost", stock: "Stock", lowStock: "Low-stock threshold", tags: "Tags",
};

const body = z.object({
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))).min(1).max(1000, "Import at most 1,000 rows at a time."),
  dryRun: z.boolean().default(false),
});

type Result = { row: number; sku: string; action: "create" | "update" | "skip"; errors?: string[] };

export async function importRoutes(app: FastifyInstance) {
  app.post("/admin/products/import", { preHandler: requirePermission("products") }, async (req) => {
    const { rows, dryRun } = body.parse(req.body);

    // Blank cells mean "leave as is" (or the default, on create). Rating/Created are read-only.
    const clean = rows.map((r) => {
      const out: Record<string, string> = {};
      for (const key of Object.keys(LABELS)) {
        const v = r[key];
        if (v != null && String(v).trim() !== "") out[key] = String(v).trim();
      }
      return out;
    });

    const ids = clean.flatMap((r) => (r.id ? [r.id] : []));
    const skus = clean.flatMap((r) => (r.sku ? [r.sku] : []));
    const [existing, cats] = await Promise.all([
      ids.length || skus.length
        ? db.select({ id: products.id, sku: products.sku }).from(products)
          .where(or(ids.length ? inArray(products.id, ids) : undefined, skus.length ? inArray(products.sku, skus) : undefined))
        : [],
      db.select({ id: categories.id, name: categories.name }).from(categories),
    ]);
    const byId = new Map(existing.map((p) => [p.id, p]));
    const bySku = new Map(existing.map((p) => [p.sku, p]));
    const catOf = (v: string) => cats.find((c) => c.id === v || c.name.toLowerCase() === v.toLowerCase());

    const results: Result[] = [];
    const writes: { id: string; create: boolean; set: Record<string, unknown> }[] = [];
    const seenSku = new Set<string>();
    const seenId = new Set<string>();

    clean.forEach((r, i) => {
      const errors: string[] = [];
      const parsed = fields.safeParse(r);
      if (!parsed.success) {
        for (const iss of parsed.error.issues) errors.push(`${LABELS[String(iss.path[0])] ?? iss.path[0]}: ${iss.message}`);
      }
      const f = parsed.success ? parsed.data : {};

      const match = (r.id && byId.get(r.id)) || (r.sku ? bySku.get(r.sku) : undefined);
      if (match && r.sku && bySku.get(r.sku) && bySku.get(r.sku)!.id !== match.id) {
        errors.push(`SKU: "${r.sku}" already belongs to product ${bySku.get(r.sku)!.id}`);
      }
      if (r.sku && seenSku.has(r.sku)) errors.push(`SKU: "${r.sku}" appears more than once in this file`);
      if (match && seenId.has(match.id)) errors.push(`Product ${match.id} appears more than once in this file`);

      let categoryId: string | undefined;
      if (r.category) {
        categoryId = catOf(r.category)?.id;
        if (!categoryId) errors.push(`Category: no category named "${r.category}"`);
      }
      if (!match) {
        for (const key of ["sku", "name", "category", "price"] as const) {
          if (!r[key]) errors.push(`${LABELS[key]}: required for a new product`);
        }
      }

      const sku = r.sku ?? match?.sku ?? "";
      if (r.sku) seenSku.add(r.sku);
      if (match) seenId.add(match.id);
      if (errors.length) {
        results.push({ row: i + 1, sku, action: "skip", errors });
        return;
      }

      const set: Record<string, unknown> = {};
      if (f.name !== undefined) set.name = f.name;
      if (f.sku !== undefined) set.sku = f.sku;
      if (categoryId) set.categoryId = categoryId;
      if (f.price !== undefined) set.priceCents = toCents(f.price);
      if (f.comparePrice !== undefined) set.comparePriceCents = f.comparePrice === null ? null : toCents(f.comparePrice);
      if (f.cost !== undefined) set.costCents = f.cost === null ? null : toCents(f.cost);
      if (f.stock !== undefined) set.stock = f.stock;
      if (f.lowStock !== undefined) set.lowStock = f.lowStock;
      if (f.status !== undefined) set.status = f.status;
      if (f.tags !== undefined) set.tags = f.tags;
      // productBody's create default is "draft"; the DB default is "active".
      if (!match) set.status ??= "draft";

      writes.push({ id: match?.id ?? newId("P"), create: !match, set });
      results.push({ row: i + 1, sku, action: match ? "update" : "create" });
    });

    const created = writes.filter((w) => w.create).length;
    const counts = { created, updated: writes.length - created, skipped: results.length - writes.length };
    if (dryRun || !writes.length) return { dryRun, ...counts, results };

    // ponytail: one statement per row; fine at the 1,000-row cap.
    await db.transaction(async (tx) => {
      for (const w of writes) {
        if (w.create) await tx.insert(products).values({ id: w.id, ...w.set } as typeof products.$inferInsert);
        else await tx.update(products).set({ ...w.set, updatedAt: new Date() }).where(eq(products.id, w.id));
      }
    }).catch((err) => {
      // A SKU swap between rows, or a product saved meanwhile, can still collide.
      const e = err as { code?: string; cause?: { code?: string } };
      if (e?.code === "23505" || e?.cause?.code === "23505") throw conflict("A SKU in this file collides with another product. Nothing was imported.");
      throw err;
    });
    await invalidateProducts(writes.map((w) => w.id));
    await audit(req, "product.import", "product", undefined, counts);
    return { dryRun, ...counts, results };
  });
}
