import { Worker, type Job } from "bullmq";
import { eq, sql as raw } from "drizzle-orm";
import { db, sql } from "./db/index.js";
import { auditLog, products, orders, orderItems, customers, feedback } from "./db/schema.js";
import { redis, subscriber, queueConnection, closeRedis } from "./redis/client.js";
import { k, QUEUE } from "./redis/keys.js";
import { env } from "./env.js";
import { sendMail, closeMail } from "./lib/mail.js";
import * as tpl from "./lib/mailTemplates.js";

const log = (msg: string, extra?: unknown) =>
  console.log(JSON.stringify({ at: new Date().toISOString(), msg, ...(extra ?? {}) }));

/* ------------------------------------------------------------------ jobs */

async function loadCustomer(id: string) {
  const [c] = await db.select({ name: customers.name, email: customers.email }).from(customers).where(eq(customers.id, id));
  // Throw, not skip: retries cover a lagging replica, then it lands in the DLQ.
  if (!c) throw new Error(`customer ${id} not found`);
  return c;
}

async function loadOrder(id: string) {
  const [o] = await db.select().from(orders).where(eq(orders.id, id));
  if (!o) throw new Error(`order ${id} not found`);
  const items = await db
    .select({ name: orderItems.name, qty: orderItems.qty, unitPriceCents: orderItems.unitPriceCents })
    .from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.id);
  return { ...o, items };
}

/** Dispatch by job name. Unknown names throw so they reach the failed set (DLQ). */
async function sendEmailJob(job: Job) {
  const d = job.data;
  let to: string, mail: tpl.Rendered;
  switch (job.name) {
    case "order-confirmation": {
      const o = await loadOrder(d.orderId);
      const c = await loadCustomer(d.customerId ?? o.customerId);
      to = c.email; mail = tpl.orderConfirmation(c.name, o);
      break;
    }
    case "order-shipped": {
      const o = await loadOrder(d.orderId);
      const c = await loadCustomer(o.customerId);
      to = c.email; mail = tpl.orderShipped(c.name, o);
      break;
    }
    case "customer-message": {
      if (!d.subject || !d.body) throw new Error("customer-message needs subject and body");
      const c = await loadCustomer(d.customerId);
      if (d.orderId) await loadOrder(d.orderId); // a reference to a missing order is a bug upstream
      to = c.email; mail = tpl.customerMessage(c.name, d.subject, d.body, d.orderId);
      log("email.customer-message", { sentBy: d.sentBy, customerId: d.customerId, orderId: d.orderId });
      break;
    }
    default:
      throw new Error(`unknown email job "${job.name}"`);
  }
  await sendMail({ to, ...mail });
  log("email.sent", { job: job.name, id: job.id, to });
}

let emailWorker: Worker | undefined;
let cartRecoveryWorker: Worker | undefined;
let timer: NodeJS.Timeout | undefined;

/** Queue consumers, created lazily so importing this module has no side effects. */
export function createWorkers() {
  emailWorker = new Worker(
    QUEUE.email,
    async (job: Job) => {
      log("email.send", { job: job.name, data: job.data, smtp: env.SMTP_URL ?? "(unconfigured)" });
      await sendEmailJob(job);
    },
    { connection: queueConnection, concurrency: 5 },
  );

  cartRecoveryWorker = new Worker(
    QUEUE.cartRecovery,
    async (job: Job<{ cartKey: string }>) => {
      log("cart.recovery", { cartKey: job.data.cartKey });
    },
    { connection: queueConnection, concurrency: 2 },
  );
}

/* --------------------------------------------- abandoned-cart via keyspace */
/**
 * Requires `--notify-keyspace-events Ex` on the Redis server. Without it this
 * subscription is silent and the feature simply never fires — which is why the
 * flag is in docker-compose.yml with a comment on it.
 */
async function watchExpiredCarts() {
  const channel = "__keyevent@0__:expired";
  await subscriber.subscribe(channel);
  subscriber.on("message", async (chan, key) => {
    if (chan !== channel) return;
    if (!key.startsWith("cart:")) return;
    log("cart.expired", { key });
    const { Queue } = await import("bullmq");
    const q = new Queue(QUEUE.cartRecovery, { connection: queueConnection });
    await q.add("recover", { cartKey: key }).catch(() => {});
    await q.close();
  });
  log("watching expired carts", { channel });
}

/* -------------------------------------------------- audit stream -> Postgres */

async function flushAuditStream() {
  const stream = k.streamAudit();
  // One flusher at a time: without this, two worker processes (or a worker
  // inside the API) read the same batch and both insert it.
  const lock = `${stream}:flush-lock`;
  if ((await redis.set(lock, "1", "PX", 30_000, "NX").catch(() => null)) !== "OK") return;
  try {
    await flushAuditBatch(stream);
  } finally {
    await redis.del(lock).catch(() => {});
  }
}

async function flushAuditBatch(stream: string) {
  const entries = await redis.xrange(stream, "-", "+", "COUNT", 500).catch(() => []);
  if (!entries.length) return;

  const rows = entries.flatMap(([, fields]) => {
    const idx = fields.indexOf("entry");
    if (idx === -1) return [];
    try {
      const e = JSON.parse(fields[idx + 1]!);
      return [{
        actorId: e.actorId ?? null, actorEmail: e.actorEmail ?? null,
        action: e.action, entity: e.entity, entityId: e.entityId ?? null,
        meta: e.meta ? JSON.parse(e.meta) : null,
        at: new Date(e.at),
      }];
    } catch {
      return [];
    }
  });

  if (rows.length) await db.insert(auditLog).values(rows);
  // Delete exactly the entries just written. (XTRIM MINID <lastId> keeps
  // lastId itself, so the newest entry was re-inserted on every tick.)
  await redis.xdel(stream, ...entries.map(([id]) => id)).catch(() => {});
  log("audit.flushed", { count: rows.length });
}

/* ------------------------------------------ counters + analytics warm-up */

async function refreshCounters() {
  const [low, pending, fb] = await Promise.all([
    db.select({ n: raw<number>`count(*)::int` }).from(products)
      .where(raw`${products.trackInventory} and ${products.stock} < ${products.lowStock}`),
    db.select({ n: raw<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")),
    db.select({ n: raw<number>`count(*)::int` }).from(feedback).where(eq(feedback.status, "new")),
  ]);
  await redis.mset({
    [k.countLowStock()]: low[0]?.n ?? 0,
    [k.countPendingOrders()]: pending[0]?.n ?? 0,
    [k.countNewFeedback()]: fb[0]?.n ?? 0,
  });
  log("counters.refreshed", { lowStock: low[0]?.n, pending: pending[0]?.n, feedback: fb[0]?.n });
}

/** Flush buffered view counts so a hot product does not write a row per view. */
async function flushViewCounters() {
  const keys = await redis.keys("views:product:*").catch(() => [] as string[]);
  for (const key of keys) {
    const id = key.split(":").pop()!;
    const n = Number(await redis.getdel(key).catch(() => 0));
    if (n > 0) {
      await db.execute(raw`update products set updated_at = now() where id = ${id}`).catch(() => {});
    }
  }
  if (keys.length) log("views.flushed", { keys: keys.length });
}

/* ----------------------------------------------------------------- loop */

const INTERVAL_MS = 60_000;

async function tick() {
  try {
    await flushAuditStream();
    await refreshCounters();
    await flushViewCounters();
  } catch (err) {
    log("tick.failed", { error: (err as Error).message });
  }
}

/**
 * Start the background work.
 *
 * Exported so it can run inside the API process on hosts that only hand you a
 * single service (see RUN_WORKER in env.ts). Two processes is still the better
 * shape wherever you can have them — this exists so a free tier is not a wall.
 */
export async function startWorker() {
  log("worker.start");
  createWorkers();
  await watchExpiredCarts();
  await tick();
  timer = setInterval(() => void tick(), INTERVAL_MS);
}

export async function stopWorker() {
  if (timer) clearInterval(timer);
  await Promise.allSettled([emailWorker?.close(), cartRecoveryWorker?.close()]);
  closeMail();
}

const shutdown = async () => {
  log("worker.stop");
  await stopWorker();
  await Promise.allSettled([closeRedis(), sql.end({ timeout: 5 })]);
  process.exit(0);
};

// Only take over the process when this file IS the entry point. When the API
// imports it, that process owns the signal handlers.
if (process.argv[1]?.endsWith("worker.js") || process.argv[1]?.endsWith("worker.ts")) {
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
  startWorker().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
