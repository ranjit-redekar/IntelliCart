import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.string().default("info"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Split origin (see architecture D7). Explicit allowlist, no wildcards.
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECRET: z.string().min(16).default("dev-only-cookie-secret-change-me"),
  SESSION_TTL_DAYS: z.coerce.number().default(30),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("intellicart-media"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  SMTP_URL: z.string().optional(),
  /** Sender for transactional email. */
  MAIL_FROM: z.string().default("IntelliCart <no-reply@intellicart.local>"),

  /**
   * Serve the built web apps from this process.
   *
   * This is the deployment that actually works on a free tier: one service,
   * one origin. It also removes the third-party-cookie problem — a session
   * cookie set by api.example.com for a SPA on user.github.io is a third-party
   * cookie, which Safari blocks outright and Chrome is removing.
   */
  SERVE_WEB: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  WEB_DIST: z.string().default("../web/dist"),

  /** Run the background worker inside this process, for one-service hosts. */
  RUN_WORKER: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),

  // Lets an owner wipe and reseed the database from the admin UI. Off by
  // default in production, where that would destroy real orders.
  ALLOW_DEMO_SEED: z
    .enum(["true", "false"])
    .default(process.env.NODE_ENV === "production" ? "false" : "true")
    .transform((v) => v === "true"),

  // Blank => AI routes serve fixtures instead of calling out. This is the
  // default in local and preview so nobody burns budget running tests.
  ANTHROPIC_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default("claude-sonnet-5"),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().default(25),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:\n" + JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const aiEnabled = env.ANTHROPIC_API_KEY.length > 0;
