import { api } from "./api";

/** A catalog row the server matched; it never returns products outside these. */
export interface AssistantProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  image?: string | null;
}

export interface AssistantReply {
  text: string;
  products: AssistantProduct[];
  followups: string[];
  interpretation?: string | null;
  source?: "model" | "fixture" | "cache";
}

/**
 * POST /ai/assistant — same contract as the web storefront. The server takes a
 * single prompt (no history). Throws ApiError so the screen can offer a retry.
 */
export const generateAssistantReply = (prompt: string) =>
  api.post<AssistantReply>("/ai/assistant", { prompt });
