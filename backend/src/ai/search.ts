/**
 * Deterministic query interpretation, ported from web/src/shop/lib/ai.ts.
 *
 * Runs server-side so the Expo client gets the same behaviour and the filters
 * can be pushed into SQL instead of applied to a bundled array of 24 products.
 * No model call — it is regex intent extraction and always was.
 *
 * Beyond the original: it also returns `residual`, the query with the parts it
 * understood removed. Without that, "top rated electronics under $200" gets
 * turned into filters AND matched literally against product names, which
 * matches nothing — the more precisely a shopper phrases a search, the fewer
 * results they get.
 */
export interface SmartSearchInterpretation {
  summary: string | null;
  /** What is left after the understood parts are removed; "" when nothing is. */
  residual: string;
  filters: {
    categoryId?: string;
    maxPrice?: number;
    minRating?: number;
    sort?: "price-asc" | "price-desc" | "rating";
  };
}

const PRICE_CAP = /\bunder\s*\$?(\d+)\b/g;

const CATEGORIES: [RegExp, string, string][] = [
  [/\b(fashion|cloth|jacket|tee|wear|sneaker|beanie|scarf|trouser)\w*/g, "fashion", "in fashion"],
  [/\b(electronic|gadget|tech|watch|earbud|speaker|keyboard)\w*/g, "electronics", "in electronics"],
  [/\b(home|lamp|mug|decor|towel|vase|candle)\w*/g, "home", "for the home"],
];

const SORTS: [RegExp, "rating" | "price-asc" | "price-desc", string, number | undefined][] = [
  // The optional "rated" has to be part of the match. Matching only "best"
  // leaves "rated" behind, and a leftover word becomes a literal name filter
  // that matches no product.
  [/\b(?:top|best|highly|highest)(?:[\s-]?rated)?\b/g, "rating", "top-rated", 4.5],
  [/\b(?:cheap|cheapest|budget|afford\w*)\b/g, "price-asc", "budget-friendly", undefined],
  [/\b(?:premium|luxury|high[\s-]?end)\b/g, "price-desc", "premium", undefined],
];

/** Words that carry no search signal once the filters are extracted. */
const FILLER = /\b(show|me|find|get|i|want|need|looking|for|the|a|an|some|something|anything|please|with|and|in|of|under|over|good|nice|rated|rating|quality|items?|products?|things?|stuff)\b/g;

export function interpretSearch(query: string): SmartSearchInterpretation {
  const original = query.trim();
  const q = original.toLowerCase();
  if (!q) return { summary: null, residual: "", filters: {} };

  const filters: SmartSearchInterpretation["filters"] = {};
  const notes: string[] = [];
  let rest = q;

  const cap = [...q.matchAll(PRICE_CAP)][0];
  if (cap?.[1]) {
    filters.maxPrice = Number(cap[1]);
    notes.push(`under $${filters.maxPrice}`);
    rest = rest.replace(PRICE_CAP, " ");
  }

  for (const [pattern, categoryId, note] of CATEGORIES) {
    if (q.match(pattern)) {
      filters.categoryId = categoryId;
      notes.push(note);
      rest = rest.replace(pattern, " ");
      break;
    }
  }

  for (const [pattern, sort, note, minRating] of SORTS) {
    if (q.match(pattern)) {
      filters.sort = sort;
      if (minRating != null) filters.minRating = minRating;
      notes.push(note);
      rest = rest.replace(pattern, " ");
      break;
    }
  }

  const residual = rest.replace(FILLER, " ").replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();

  return {
    summary: notes.length ? notes.join(" · ") : null,
    // Nothing was understood => search the whole phrase literally.
    residual: notes.length ? residual : original,
    filters,
  };
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** Short and leaning on earlier context: "anything cheaper?", "what about in blue?". */
const FOLLOWUP = /\b(cheaper|less expensive|similar|those|these|them|it|that|ones?|instead|else|what about|how about|more like)\b/;
const CHEAPER = /\b(cheaper|less expensive|lower price)\b/;
export const isFollowup = (q: string) => q.split(/\s+/).length <= 8 && FOLLOWUP.test(q);

/**
 * Multi-turn interpretation without a model.
 *
 * Walks the shopper's turns oldest to newest. A turn that reads as a follow-up
 * keeps the filters in force and layers its own on top; anything else starts
 * fresh. "Cheaper" caps the price just below the cheapest item shown for the
 * filters in force at that point — `cheapestShown` re-runs that lookup, since
 * the client sends text only, not the products it displayed.
 *
 * ponytail: regex follow-up detection; misreads a long or pronoun-free
 * follow-up as a new search. The model path sees the full history anyway.
 */
export async function interpretConversation(
  prompt: string,
  history: ChatTurn[],
  cheapestShown: (filters: SmartSearchInterpretation["filters"]) => Promise<number | null>,
): Promise<SmartSearchInterpretation> {
  const turns = [...history.filter((t) => t.role === "user").map((t) => t.text), prompt];
  let current = interpretSearch(turns[0] ?? "");
  let merged = false;
  for (const turn of turns.slice(1)) {
    const next = interpretSearch(turn);
    const q = turn.toLowerCase();
    if (!isFollowup(q)) {
      current = next;
      merged = false;
      continue;
    }
    const filters = { ...current.filters, ...next.filters };
    if (CHEAPER.test(q)) {
      const floor = await cheapestShown(filters);
      if (floor != null) filters.maxPrice = Math.max(0, Math.ceil(floor) - 1);
    }
    current = { summary: null, residual: next.residual, filters };
    merged = true;
  }
  if (!merged) return current;

  // Re-describe the merged filters with the same notes a single query gets.
  const f = current.filters;
  const notes = [
    f.maxPrice != null ? `under $${f.maxPrice}` : null,
    CATEGORIES.find(([, id]) => id === f.categoryId)?.[2],
    SORTS.find(([, sort]) => sort === f.sort)?.[2],
  ].filter(Boolean);
  return { ...current, summary: notes.length ? notes.join(" · ") : null };
}
