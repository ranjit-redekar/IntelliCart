import { randomBytes, createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../db/index.js";
import { settings, adminUsers, apiKeys } from "../db/schema.js";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";
import { cached, invalidateKeys } from "../redis/cache.js";
import { requirePermission } from "../plugins/auth.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
import { ROLE_PERMISSIONS, PERMISSIONS } from "../lib/permissions.js";
import { newId } from "../lib/ids.js";
import { audit } from "../lib/audit.js";

const SCOPES = ["store", "localization", "shipping", "payments", "authentication", "webhooks"] as const;
type Scope = (typeof SCOPES)[number];

export async function settingsRoutes(app: FastifyInstance) {
  /* ------------------------------------------------------------- settings */
  /**
   * Read on nearly every screen, written almost never — the clearest cache
   * win in the system, so these go through Redis with an explicit bust.
   */
  app.get("/admin/settings/:scope", { preHandler: requirePermission("settings") }, async (req) => {
    const { scope } = z.object({ scope: z.enum(SCOPES) }).parse(req.params);
    const value = await cached(k.settings(scope), TTL.settings, async () => {
      const [row] = await db.select().from(settings).where(eq(settings.scope, scope));
      return row?.value ?? {};
    });
    return { scope, value };
  });

  app.put("/admin/settings/:scope", { preHandler: requirePermission("settings") }, async (req) => {
    const { scope } = z.object({ scope: z.enum(SCOPES) }).parse(req.params);
    const value = z.record(z.unknown()).parse(req.body);
    await db
      .insert(settings)
      .values({ scope, value })
      .onConflictDoUpdate({ target: settings.scope, set: { value, updatedAt: new Date() } });
    await invalidateKeys([k.settings(scope)]);
    return { scope, value };
  });

  /** Public subset: the storefront needs currency and free-shipping copy. */
  app.get("/settings/public", async () => {
    const value = await cached(k.settings("public"), TTL.settings, async () => {
      const rows = await db.select().from(settings);
      const byScope = new Map(rows.map((r) => [r.scope, r.value as Record<string, unknown>]));
      return {
        storeName: byScope.get("store")?.name ?? "IntelliCart",
        currency: byScope.get("store")?.currency ?? "USD",
        freeShippingOver: byScope.get("shipping")?.freeOver ?? 50,
        supportEmail: byScope.get("store")?.supportEmail ?? null,
      };
    });
    return value;
  });

  /* -------------------------------------------------------------- members */

  app.get("/admin/members", { preHandler: requirePermission("members") }, async () => {
    const rows = await db.select().from(adminUsers).orderBy(adminUsers.createdAt);
    return {
      items: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        permissions: ROLE_PERMISSIONS[u.role],
        createdAt: u.createdAt.toISOString(),
      })),
      roles: (Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).map((role) => ({
        id: role,
        permissions: ROLE_PERMISSIONS[role],
      })),
      allPermissions: PERMISSIONS,
    };
  });

  app.post("/admin/members", { preHandler: requirePermission("members") }, async (req, reply) => {
    const body = z
      .object({
        name: z.string().trim().min(1),
        email: z.string().email(),
        role: z.enum(["owner", "admin", "manager", "support", "viewer"]),
        password: z.string().min(8, "Use at least 8 characters"),
      })
      .parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email));
    if (existing.length) throw conflict("A member with that email already exists.");
    const id = newId("A");
    await db.insert(adminUsers).values({
      id,
      name: body.name,
      email,
      role: body.role,
      passwordHash: await argon2.hash(body.password, { type: argon2.argon2id }),
    });
    return reply.code(201).send({ id });
  });

  app.patch("/admin/members/:id", { preHandler: requirePermission("roles") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        name: z.string().trim().min(1).optional(),
        role: z.enum(["owner", "admin", "manager", "support", "viewer"]).optional(),
      })
      .parse(req.body);
    if (!Object.keys(body).length) throw badRequest("Nothing to update.");

    // Demoting the last owner locks everyone out of billing permanently.
    if (body.role && body.role !== "owner") {
      const owners = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, "owner"));
      if (owners.length === 1 && owners[0]?.id === id) {
        throw badRequest("This is the only owner. Promote someone else first.");
      }
    }
    const updated = await db.update(adminUsers).set(body).where(eq(adminUsers.id, id)).returning({ id: adminUsers.id });
    if (!updated.length) throw notFound("No such member.");
    return { ok: true };
  });

  app.delete("/admin/members/:id", { preHandler: requirePermission("members") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    if (req.session?.userId === id) throw badRequest("You cannot remove your own account.");
    const owners = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, "owner"));
    if (owners.length === 1 && owners[0]?.id === id) throw badRequest("This is the only owner.");
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return { ok: true };
  });

  /* ------------------------------------------------------------- api keys */

  app.get("/admin/api-keys", { preHandler: requirePermission("settings") }, async () => {
    const rows = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    return {
      items: rows.map((key) => ({
        id: key.id,
        name: key.name,
        // Only the prefix is ever shown again. The full key is not recoverable.
        prefix: key.prefix,
        createdAt: key.createdAt.toISOString(),
        lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
        revokedAt: key.revokedAt?.toISOString() ?? null,
      })),
    };
  });

  app.post("/admin/api-keys", { preHandler: requirePermission("settings") }, async (req, reply) => {
    const { name } = z.object({ name: z.string().trim().min(1) }).parse(req.body);
    const secret = `ic_${randomBytes(24).toString("base64url")}`;
    const hash = createHash("sha256").update(secret).digest("hex");
    const id = newId("KEY");
    await db.insert(apiKeys).values({
      id,
      name,
      prefix: secret.slice(0, 11),
      hash,
      createdBy: req.session?.userId ?? null,
    });
    // Returned exactly once. Storing only the hash means a leaked database
    // does not leak usable keys.
    return reply.code(201).send({ id, name, secret, prefix: secret.slice(0, 11) });
  });

  app.delete("/admin/api-keys/:id", { preHandler: requirePermission("settings") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    if (!row) throw notFound("No such key.");
    await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id));
    await redis.del(k.apiKey(row.hash)).catch(() => {});
    return { ok: true };
  });

  // Same record, new secret. The old hash is overwritten, so the old secret
  // stops working at once (no grace period: the schema holds one hash per key).
  app.post("/admin/api-keys/:id/rotate", { preHandler: requirePermission("settings") }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    if (!row) throw notFound("No such key.");
    if (row.revokedAt) throw conflict("A revoked key cannot be rotated.");
    const secret = `ic_${randomBytes(24).toString("base64url")}`;
    const hash = createHash("sha256").update(secret).digest("hex");
    await db.update(apiKeys).set({ hash, prefix: secret.slice(0, 11), lastUsedAt: null }).where(eq(apiKeys.id, id));
    await redis.del(k.apiKey(row.hash)).catch(() => {});
    await audit(req, "api_key.rotate", "api_key", id, { oldPrefix: row.prefix });
    return { id, name: row.name, secret, prefix: secret.slice(0, 11) };
  });
}
