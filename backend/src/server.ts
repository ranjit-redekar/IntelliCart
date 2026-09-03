import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { env, isProd } from "./env.js";
import { db, sql } from "./db/index.js";
import { redis, redisReady, closeRedis } from "./redis/client.js";
import { authPlugin } from "./plugins/auth.js";
import { registerErrorHandler, ApiError } from "./lib/errors.js";
import { authRoutes } from "./routes/auth.js";
import { catalogRoutes } from "./routes/catalog.js";
import { cartRoutes } from "./routes/cart.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { accountRoutes } from "./routes/orders.js";
import { adminRoutes } from "./routes/admin.js";
import { merchandisingRoutes } from "./routes/merchandising.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { aiRoutes } from "./routes/ai.js";
import { uploadRoutes } from "./routes/uploads.js";
import { settingsRoutes } from "./routes/settings.js";
import { demoRoutes } from "./routes/demo.js";
import { closeQueues } from "./queues.js";

export async function build() {
  const app = Fastify({
    logger: isProd
      ? { level: env.LOG_LEVEL }
      : { level: env.LOG_LEVEL, transport: { target: "pino-pretty", options: { singleLine: true } } },
    trustProxy: true,
    genReqId: (req) => (req.headers["x-request-id"] as string) ?? crypto.randomUUID(),
  });

  // Several endpoints take no body (sign-out, wishlist add/remove, cart merge).
  // Fastify rejects those with 400 when a client sets content-type: application/json
  // and sends nothing — which a shared fetch helper that always sets the header
  // will do on every one of them. Treat an empty JSON body as {}.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    const text = (body as string).trim();
    if (!text) return done(null, {});
    try {
      done(null, JSON.parse(text));
    } catch {
      done(new ApiError(400, "bad_request", "Request body is not valid JSON."), undefined);
    }
  });

  await app.register(cors, {
    // Explicit allowlist. The SPA is on a different origin than the API.
    origin: env.CORS_ORIGINS,
    credentials: true,
    exposedHeaders: ["etag"],
    maxAge: 86400, // cache preflights; cross-origin means one per route otherwise
  });
  await app.register(cookie, { secret: env.COOKIE_SECRET });

  await app.register(rateLimit, {
    global: false,
    redis,
    keyGenerator: (req) => req.ip,
  });

  await app.register(authPlugin);
  registerErrorHandler(app);

  /* --------------------------------------------------------------- health */

  app.get("/healthz", async () => ({ ok: true, uptime: process.uptime() }));

  // Readiness gates the rolling deploy, so it checks the things a request
  // actually needs rather than just that the process is alive.
  app.get("/readyz", async (_req, reply) => {
    const [dbOk, cacheOk] = await Promise.all([
      sql`select 1`.then(() => true).catch(() => false),
      redisReady(),
    ]);
    const ok = dbOk && cacheOk;
    return reply.code(ok ? 200 : 503).send({ ok, postgres: dbOk, redis: cacheOk });
  });

  /* --------------------------------------------------------------- routes */

  const strict = { max: 10, timeWindow: "1 minute" };
  await app.register(async (scoped) => {
    scoped.addHook("onRoute", (route) => {
      // Auth and AI are the routes worth spending a limiter on.
      if (route.url.startsWith("/auth/") || route.url.startsWith("/ai/")) {
        route.config = { ...(route.config ?? {}), rateLimit: strict };
      }
    });
    await scoped.register(authRoutes);
    await scoped.register(aiRoutes);
  });

  await app.register(catalogRoutes);
  await app.register(cartRoutes);
  await app.register(checkoutRoutes);
  await app.register(accountRoutes);
  await app.register(adminRoutes);
  await app.register(merchandisingRoutes);
  await app.register(analyticsRoutes);
  await app.register(uploadRoutes);
  await app.register(settingsRoutes);
  await app.register(demoRoutes);

  return app;
}

async function main() {
  const app = await build();
  await app.listen({ port: env.PORT, host: env.HOST });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    await Promise.allSettled([closeQueues(), closeRedis(), sql.end({ timeout: 5 })]);
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

// Only auto-start when run directly, so selfcheck.ts can import build().
if (process.argv[1]?.includes("server")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
