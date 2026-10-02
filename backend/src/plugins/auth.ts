import { randomBytes, createHash } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";
import { env, isProd } from "../env.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import { can, type Permission } from "../lib/permissions.js";
import type { Role } from "../db/schema.js";

export const COOKIE_NAME = "ic_session";

export interface Session {
  token: string;
  kind: "customer" | "admin";
  userId: string;
  email: string;
  name: string;
  role?: Role;
  createdAt: number;
  userAgent?: string;
  ip?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    session: Session | null;
  }
}

const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/**
 * Opaque tokens in Redis, deliberately not JWT: the settings screen lists live
 * sessions and offers revoke, and revoke has to actually take effect. A JWT
 * stays valid until it expires no matter what the server thinks.
 */
export async function createSession(
  data: Omit<Session, "token" | "createdAt">,
): Promise<string> {
  const token = newToken();
  const session: Session = { ...data, token: hashToken(token), createdAt: Date.now() };
  const ttl = TTL.session;
  await redis
    .multi()
    .set(k.session(session.token), JSON.stringify(session), "EX", ttl)
    .sadd(k.sessionsOfUser(data.userId), session.token)
    .expire(k.sessionsOfUser(data.userId), ttl)
    .exec();
  return token;
}

export async function readSession(rawToken: string): Promise<Session | null> {
  const id = hashToken(rawToken);
  try {
    const raw = await redis.get(k.session(id));
    if (!raw) return null;
    // Sliding expiry: an active session does not get logged out mid-use.
    await redis.expire(k.session(id), TTL.session);
    return JSON.parse(raw) as Session;
  } catch {
    return null; // Redis down => treated as signed out. Auth fails closed.
  }
}

export async function destroySession(rawToken: string) {
  const id = hashToken(rawToken);
  const raw = await redis.get(k.session(id)).catch(() => null);
  if (raw) {
    const s = JSON.parse(raw) as Session;
    await redis.srem(k.sessionsOfUser(s.userId), id).catch(() => {});
  }
  await redis.del(k.session(id)).catch(() => {});
}

/** "Sign out everywhere" — the reason sess:user:{id} exists. */
export async function destroyAllSessions(userId: string) {
  const ids = await redis.smembers(k.sessionsOfUser(userId)).catch(() => [] as string[]);
  if (ids.length) await redis.del(...ids.map(k.session)).catch(() => {});
  await redis.del(k.sessionsOfUser(userId)).catch(() => {});
}

/** Revoke one of the user's sessions by stored (hashed) id. Scoped to the user's own set. */
export async function destroySessionId(userId: string, id: string) {
  await redis.multi().del(k.session(id)).srem(k.sessionsOfUser(userId), id).exec();
}

/** "Sign out everywhere else": every session of the user but `keepId` (hashed). */
export async function destroyOtherSessions(userId: string, keepId: string) {
  const ids = (await redis.smembers(k.sessionsOfUser(userId))).filter((id) => id !== keepId);
  if (ids.length) await redis.multi().del(...ids.map(k.session)).srem(k.sessionsOfUser(userId), ...ids).exec();
  return ids.length;
}

/** Resolve the 12-char prefix GET /auth/sessions exposes, against the user's own set only. */
export async function resolveSessionId(userId: string, prefix: string): Promise<string | null> {
  if (!/^[0-9a-f]{12}$/.test(prefix)) return null;
  const hits = (await redis.smembers(k.sessionsOfUser(userId))).filter((id) => id.startsWith(prefix));
  return hits.length === 1 ? hits[0]! : null; // unknown or ambiguous
}

export async function listSessions(userId: string): Promise<Session[]> {
  const ids = await redis.smembers(k.sessionsOfUser(userId)).catch(() => [] as string[]);
  if (!ids.length) return [];
  const raws = await redis.mget(...ids.map(k.session));
  return raws.filter((r): r is string => !!r).map((r) => JSON.parse(r) as Session);
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    // When this process serves the SPA too, the cookie is first-party and
    // `lax` is both safer and universally supported. `none` is only needed for
    // the split-origin deployment, and browsers are actively killing it.
    sameSite: env.SERVE_WEB ? "lax" : isProd ? "none" : "lax",
    secure: isProd,
    domain: env.COOKIE_DOMAIN,
    path: "/",
    maxAge: TTL.session,
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(COOKIE_NAME, { path: "/", domain: env.COOKIE_DOMAIN });
}

function tokenFrom(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  // Bearer for the Expo client, which has no cookie jar worth relying on.
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = (req.cookies as Record<string, string | undefined>)[COOKIE_NAME];
  return cookie ?? null;
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest("session", null);

  app.addHook("onRequest", async (req) => {
    const token = tokenFrom(req);
    req.session = token ? await readSession(token) : null;
  });
});

/* --------------------------------------------------------------- guards */

export const requireCustomer = async (req: FastifyRequest) => {
  if (!req.session || req.session.kind !== "customer") throw unauthorized();
};

export const requireAdmin = async (req: FastifyRequest) => {
  if (!req.session || req.session.kind !== "admin") throw unauthorized();
};

/**
 * The guard that does not exist today. `RequireAuth` in the admin app checks
 * only that a session is present — every role can reach every route including
 * billing.
 */
export const requirePermission =
  (permission: Permission) => async (req: FastifyRequest) => {
    if (!req.session || req.session.kind !== "admin") throw unauthorized();
    if (!req.session.role || !can(req.session.role, permission)) {
      throw forbidden(`This action needs the "${permission}" permission.`);
    }
  };
