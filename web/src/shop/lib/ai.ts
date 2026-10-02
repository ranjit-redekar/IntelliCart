import { api } from "../../lib/api";
import type { Product } from "../types";

export interface AssistantReply {
  text: string;
  products: Product[];
  followups: string[];
  interpretation?: string | null;
  source?: "model" | "fixture" | "cache";
  /** Client-side only: the request failed and this is the stand-in text. */
  failed?: boolean;
}

/** A prior chat turn. The server takes at most 10, each up to 500 chars. */
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/**
 * The assistant runs on the server.
 *
 * It used to be regex intent-matching over the 24 bundled products. Now the
 * server matches against the real catalog in SQL and — when an API key is
 * configured — has a model write the reply, grounded in only those rows so it
 * cannot invent products or prices. With no key it falls back to the same
 * deterministic phrasing, so the feature degrades rather than breaking.
 */
export async function generateAssistantReply(
  prompt: string,
  history: ChatTurn[] = [],
): Promise<AssistantReply> {
  try {
    return await api.post<AssistantReply>("/ai/assistant", { prompt, history });
  } catch {
    return {
      text: "I can't reach the catalog right now. Try again in a moment.",
      products: [],
      followups: [],
      failed: true,
    };
  }
}

export interface SmartSearchInterpretation {
  summary: string | null;
  filters: {
    categoryId?: string;
    maxPrice?: number;
    minRating?: number;
    sort?: "price-asc" | "price-desc" | "rating";
  };
}

/** Server-side query interpretation, so mobile gets the same behaviour. */
export async function interpretSearch(query: string): Promise<SmartSearchInterpretation> {
  if (!query.trim()) return { summary: null, filters: {} };
  try {
    return await api.get<SmartSearchInterpretation>(
      `/ai/search?q=${encodeURIComponent(query)}`,
    );
  } catch {
    return { summary: null, filters: {} };
  }
}

export async function generateProductAnswer(
  question: string,
  productName: string,
  category: string,
): Promise<string> {
  // Category is real context for the model, so it goes into the prompt rather
  // than being accepted and ignored.
  const reply = await generateAssistantReply(
    `About the ${productName} (${category}): ${question}`,
  );
  return reply.text;
}
