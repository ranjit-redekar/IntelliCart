import { db } from "../db/index.js";
import { auditLog } from "../db/schema.js";
import { redis } from "../redis/client.js";
import { k } from "../redis/keys.js";

/** Audit writes go through Redis and are flushed in batches by the worker. */
export async function audit(req: any, action: string, entity: string, entityId?: string, meta?: unknown) {
  const entry = {
    actorId: req.session?.userId ?? null,
    actorEmail: req.session?.email ?? null,
    action, entity, entityId: entityId ?? null,
    meta: meta ? JSON.stringify(meta) : null,
    at: new Date().toISOString(),
  };
  const ok = await redis.xadd(k.streamAudit(), "*", "entry", JSON.stringify(entry)).catch(() => null);
  // If Redis is unavailable the audit entry still has to land.
  if (!ok) {
    await db.insert(auditLog).values({
      actorId: entry.actorId, actorEmail: entry.actorEmail, action, entity,
      entityId: entry.entityId, meta: (meta as Record<string, unknown>) ?? null,
    }).catch(() => {});
  }
}
