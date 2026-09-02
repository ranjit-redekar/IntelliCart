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
