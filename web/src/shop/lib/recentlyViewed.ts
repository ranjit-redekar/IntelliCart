/**
 * Product ids this browser viewed, newest first. Per-browser on purpose: it is
 * a convenience, not account data. Storage can throw (private mode, blocked
 * site data), so every access degrades to "nothing viewed".
 */
const KEY = "cw_recently_viewed";
const MAX = 8;

export function getRecentlyViewed(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(id: string) {
  try {
    const ids = [id, ...getRecentlyViewed().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — skip.
  }
}
