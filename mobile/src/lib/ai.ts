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

/** A prior chat turn. The server takes at most 10, each up to 500 chars. */
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/**
 * POST /ai/assistant — same contract as the web storefront: the new prompt plus
 * recent turns for follow-ups. Throws ApiError so the screen can offer a retry.
 */
export const generateAssistantReply = (prompt: string, history: ChatTurn[] = []) =>
  api.post<AssistantReply>("/ai/assistant", { prompt, history });
