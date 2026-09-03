import type { FastifyInstance } from "fastify";
import { eq, sql as raw } from "drizzle-orm";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../db/index.js";
import { customers, adminUsers } from "../db/schema.js";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";
import {
  createSession, destroySession, destroyAllSessions, listSessions,
  setSessionCookie, clearSessionCookie, COOKIE_NAME, requireAdmin,
} from "../plugins/auth.js";
import { badRequest, conflict, unauthorized, tooMany } from "../lib/errors.js";
import { ROLE_PERMISSIONS } from "../lib/permissions.js";
import { newId } from "../lib/ids.js";
import { seedDatabase, resolveDatasets, DATASETS, ALL_DATASETS, type DatasetKey } from "../db/seedData.js";
import { env } from "../env.js";

const MAX_FAILS = 8;

/** Escalating lockout, on top of the route rate limit. */
async function assertNotLockedOut(email: string) {
  const fails = Number((await redis.get(k.loginFail(email)).catch(() => "0")) ?? 0);
  if (fails >= MAX_FAILS) throw tooMany("Too many failed attempts. Try again in 15 minutes.");
}
async function noteFailure(email: string) {
  const key = k.loginFail(email);
  const n = await redis.incr(key).catch(() => 0);
  if (n === 1) await redis.expire(key, TTL.loginFail).catch(() => {});
}
const clearFailures = (email: string) => redis.del(k.loginFail(email)).catch(() => {});

const credentials = z.object({
  email: z.string().email("That email doesn't look right"),
  password: z.string().min(1, "Enter your password"),
});

export async function authRoutes(app: FastifyInstance) {
  /* ------------------------------------------------------------ storefront */

  app.post("/auth/sign-up", async (req, reply) => {
    const body = z
      .object({
        name: z.string().trim().min(1, "Tell us your name"),
        email: z.string().email("That email doesn't look right"),
        password: z.string().min(8, "Use at least 8 characters for your password"),
      })
      .parse(req.body);

    const email = body.email.toLowerCase();
    const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email));
    // Sign-up today has no duplicate check and silently creates a shadow account.
    if (existing.length) throw conflict("An account with that email already exists. Sign in instead.");

    const id = newId("C");
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    await db.insert(customers).values({ id, name: body.name, email, passwordHash });

    const token = await createSession({
      kind: "customer", userId: id, email, name: body.name,
      userAgent: req.headers["user-agent"], ip: req.ip,
    });
    setSessionCookie(reply, token);
    return reply.code(201).send({ token, user: { id, name: body.name, email, orders: 0 } });
  });

  app.post("/auth/sign-in", async (req, reply) => {
    const body = credentials.parse(req.body);
    const email = body.email.toLowerCase();
    await assertNotLockedOut(email);

    const [row] = await db.select().from(customers).where(eq(customers.email, email));
    // Verify against a dummy hash on a miss so a missing account and a wrong
    // password take the same time — otherwise the endpoint enumerates users.
    const hash = row?.passwordHash ?? "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000";
    const ok = await argon2.verify(hash, body.password).catch(() => false);

    if (!row || !ok) {
      await noteFailure(email);
      throw unauthorized("Email or password is incorrect.");
    }
    await clearFailures(email);

    const token = await createSession({
      kind: "customer", userId: row.id, email: row.email, name: row.name,
      userAgent: req.headers["user-agent"], ip: req.ip,
    });
    setSessionCookie(reply, token);
    return { token, user: { id: row.id, name: row.name, email: row.email } };
  });

  /* ----------------------------------------------------------------- admin */

  app.post("/auth/admin/sign-in", async (req, reply) => {
    const body = credentials.parse(req.body);
    const email = body.email.toLowerCase();
    await assertNotLockedOut(email);

    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    const hash = row?.passwordHash ?? "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000";
    const ok = await argon2.verify(hash, body.password).catch(() => false);

    if (!row || !ok) {
      await noteFailure(email);
      throw unauthorized("Email or password is incorrect.");
    }
    await clearFailures(email);

    const token = await createSession({
      kind: "admin", userId: row.id, email: row.email, name: row.name, role: row.role,
      userAgent: req.headers["user-agent"], ip: req.ip,
    });
    setSessionCookie(reply, token);
    return {
      token,
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
      permissions: ROLE_PERMISSIONS[row.role],
    };
  });

  /* ------------------------------------------------------- first-run setup */

  /**
   * Whether the store still needs its first owner.
   *
   * Public on purpose: the admin app calls it before rendering sign-in so it
   * can send a brand-new install to the setup screen instead of a login form
   * nobody has credentials for. It leaks only a boolean.
   */
  app.get("/auth/setup-status", async () => {
    const [row] = await db.select({ n: raw<number>`count(*)::int` }).from(adminUsers);
    const admins = row?.n ?? 0;
    return {
      needsSetup: admins === 0,
      canSeed: env.ALLOW_DEMO_SEED,
      datasets: ALL_DATASETS.map((key) => ({
        key,
        label: DATASETS[key].label,
        description: DATASETS[key].description,
        requires: DATASETS[key].requires,
      })),
    };
  });

  /**
   * Create the first owner, and optionally load demo data in the same step.
   *
   * Only available while `admin_users` is empty. Without that check this is an
   * open endpoint for minting owner accounts on a live store — the one thing
   * that must never be possible.
   */
  app.post("/auth/register", async (req, reply) => {
    const [row] = await db.select({ n: raw<number>`count(*)::int` }).from(adminUsers);
    if ((row?.n ?? 0) > 0) {
      throw conflict("This store is already set up. Ask an owner to invite you.");
    }

    const body = z
      .object({
        name: z.string().trim().min(1, "Tell us your name"),
        email: z.string().email("That email doesn't look right"),
        password: z.string().min(8, "Use at least 8 characters for your password"),
        datasets: z.array(z.string()).default([]),
      })
      .parse(req.body);

    const email = body.email.toLowerCase();
    const id = newId("A");
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    await db.insert(adminUsers).values({ id, name: body.name, email, passwordHash, role: "owner" });

    // Seed after the account exists, with preserveAdmins so the owner that was
    // just created survives.
    let seeded: Awaited<ReturnType<typeof seedDatabase>> | null = null;
    const requested = body.datasets.filter((d): d is DatasetKey => d in DATASETS);
    if (requested.length && env.ALLOW_DEMO_SEED) {
      seeded = await seedDatabase({ datasets: resolveDatasets(requested), preserveAdmins: true });
    }

    const token = await createSession({
      kind: "admin", userId: id, email, name: body.name, role: "owner",
      userAgent: req.headers["user-agent"], ip: req.ip,
    });
    setSessionCookie(reply, token);

    return reply.code(201).send({
      token,
      user: { id, name: body.name, email, role: "owner" as const },
      permissions: ROLE_PERMISSIONS.owner,
      seeded,
    });
  });

  /* ---------------------------------------------------------------- shared */

  app.get("/auth/me", async (req) => {
    if (!req.session) return { user: null };
    const { userId, email, name, role, kind } = req.session;
    return {
      user: { id: userId, email, name, role },
      kind,
      permissions: role ? ROLE_PERMISSIONS[role] : [],
    };
  });

  app.post("/auth/sign-out", async (req, reply) => {
    const raw = (req.cookies as Record<string, string | undefined>)[COOKIE_NAME]
      ?? (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
    if (raw) await destroySession(raw);
    clearSessionCookie(reply);
    return { ok: true };
  });

  /** Backs the live session list on /settings/authentication. */
  app.get("/auth/sessions", { preHandler: requireAdmin }, async (req) => {
    const sessions = await listSessions(req.session!.userId);
    return {
      items: sessions.map((s) => ({
        id: s.token.slice(0, 12),
        createdAt: new Date(s.createdAt).toISOString(),
        userAgent: s.userAgent ?? null,
        ip: s.ip ?? null,
        current: s.token === req.session!.token,
      })),
    };
  });

  app.post("/auth/sessions/revoke-all", { preHandler: requireAdmin }, async (req, reply) => {
    await destroyAllSessions(req.session!.userId);
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.post("/auth/password", async (req) => {
    if (!req.session) throw unauthorized();
    const body = z
      .object({ current: z.string().min(1), next: z.string().min(8, "Use at least 8 characters") })
      .parse(req.body);

    const table = req.session.kind === "admin" ? adminUsers : customers;
    const [row] = await db.select().from(table as any).where(eq((table as any).id, req.session.userId));
    if (!row) throw unauthorized();
    if (!(await argon2.verify(row.passwordHash, body.current).catch(() => false))) {
      throw badRequest("Current password is incorrect.");
    }
    const passwordHash = await argon2.hash(body.next, { type: argon2.argon2id });
    await db.update(table as any).set({ passwordHash }).where(eq((table as any).id, req.session.userId));
    // Changing a password ends every other session. This is the whole reason
    // sessions are revocable server-side.
    await destroyAllSessions(req.session.userId);
    return { ok: true };
  });
}
