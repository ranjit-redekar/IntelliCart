import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Filters, search and paging for a list page, kept in the URL so Back from a
 * detail page, refresh and shared links all land on the same view.
 *
 * `defaults` names the page's own filters (e.g. { status: "all" }); a value
 * equal to its default is left out of the URL. Changing anything but `page`
 * sends the list back to page 1.
 */
export function useListParams<F extends Record<string, string>>(defaults: F) {
  const [params, setParams] = useSearchParams();
  const all: Record<string, string> = { page: "1", pageSize: "10", q: "", ...defaults };

  const filters = Object.fromEntries(
    Object.keys(defaults).map((k) => [k, params.get(k) ?? defaults[k]]),
  ) as F;
  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 10);
  const q = params.get("q") ?? "";

  // One setSearchParams per change: React Router doesn't queue updaters, so
  // two calls in one event would overwrite each other.
  function update(patch: Partial<Record<keyof F | "page" | "pageSize" | "q", string | number>>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || String(v) === all[k]) next.delete(k);
          else next.set(k, String(v));
        }
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  // The search box types locally and lands in the URL once typing pauses.
  const [query, setQuery] = useState(q);
  // Follow outside URL changes (saved views, notification links) into the box.
  const [seenQ, setSeenQ] = useState(q);
  if (q !== seenQ) {
    setSeenQ(q);
    setQuery(q);
  }
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (query.trim() !== q) update({ q: query.trim() } as Parameters<typeof update>[0]);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { filters, page, pageSize, q, query, setQuery, update };
}
