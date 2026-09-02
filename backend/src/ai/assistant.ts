import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { env, aiEnabled } from "../env.js";
import { redis } from "../redis/client.js";
import { k, TTL } from "../redis/keys.js";

/**
 * The one genuinely model-backed route.
 *
 * Everything else in the AI Hub serves fixtures behind the same contract, so
 * upgrading any of them later is a change in one service function and nothing
 * else moves.
 */
const client = aiEnabled ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export const promptHash = (s: string) =>
  createHash("sha256").update(s.trim().toLowerCase()).digest("hex").slice(0, 20);

const SYSTEM = `You are a shopping assistant for IntelliCart, an online store.
Answer in at most three short sentences. Be concrete and never invent products,
prices, or stock levels — you are given the catalog subset that matched the
shopper's question, and you may only refer to those items. If nothing matched,
say so plainly and suggest broadening the search.`;

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
}

const yearMonth = () => new Date().toISOString().slice(0, 7);

/** Hard budget stop. An AI feature that can bankrupt you is not a feature. */
export async function withinBudget(): Promise<boolean> {
  const spent = Number((await redis.get(k.aiSpend(yearMonth())).catch(() => "0")) ?? 0);
  return spent < env.AI_MONTHLY_BUDGET_USD * 100;
}

async function recordSpend(inputTokens: number, outputTokens: number) {
  // Rough cents; exact accounting belongs on the invoice, this is a guardrail.
  const cents = Math.ceil((inputTokens * 0.0003 + outputTokens * 0.0015) / 10);
  const key = k.aiSpend(yearMonth());
  const total = await redis.incrby(key, Math.max(cents, 1)).catch(() => 0);
  if (total === cents) await redis.expire(key, 60 * 60 * 24 * 40).catch(() => {});
}

export interface AssistantAnswer {
  text: string;
  products: CatalogItem[];
  followups: string[];
  source: "model" | "fixture" | "cache";
}

const FOLLOWUPS = [
  "Anything similar but cheaper?",
  "What do customers say about these?",
  "Show me more like the first one",
];

/** The fallback is a real answer, not an error page. */
function deterministicAnswer(prompt: string, matches: CatalogItem[]): AssistantAnswer {
  const q = prompt.toLowerCase();
  if (!matches.length) {
    return {
      text: "I couldn't find anything matching that. Try dropping the price cap or removing a category word.",
      products: [], followups: ["Show me everything top-rated", "What's under $50?", "Browse home goods"],
      source: "fixture",
    };
  }
  const intro =
    /gift|present/.test(q) ? "Crowd-pleasing gift ideas — high-rated and broadly liked."
    : /cheap|budget|afford|under/.test(q) ? "The most rewarding picks at lower price points."
    : /best|top|rated/.test(q) ? "These are the highest-rated pieces customers keep coming back to."
    : "Here are a few picks based on what you asked.";
  return { text: intro, products: matches.slice(0, 3), followups: FOLLOWUPS, source: "fixture" };
}

export async function assistantAnswer(prompt: string, matches: CatalogItem[]): Promise<AssistantAnswer> {
  const cacheKey = k.ai("assistant", promptHash(prompt + matches.map((m) => m.id).join(",")));

  const hit = await redis.get(cacheKey).catch(() => null);
  if (hit) return { ...(JSON.parse(hit) as AssistantAnswer), source: "cache" };

  if (!client || !(await withinBudget())) return deterministicAnswer(prompt, matches);

  try {
    const catalog = matches.slice(0, 8).map((p) =>
      `- ${p.name} (${p.category}) $${p.price}, rated ${p.rating}, ${p.stock} in stock`).join("\n");

    const message = await client.messages.create({
      model: env.AI_MODEL,
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: `Shopper asked: "${prompt}"\n\nMatching catalog items:\n${catalog || "(none)"}` }],
    });

    await recordSpend(message.usage.input_tokens, message.usage.output_tokens);

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text).join("").trim();

    const answer: AssistantAnswer = {
      text: text || deterministicAnswer(prompt, matches).text,
      products: matches.slice(0, 3),
      followups: FOLLOWUPS,
      source: "model",
    };
    await redis.set(cacheKey, JSON.stringify(answer), "EX", TTL.ai).catch(() => {});
    return answer;
  } catch {
    // A model outage degrades the feature; it does not break the page.
    return deterministicAnswer(prompt, matches);
  }
}
