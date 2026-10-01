import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownUp, Search, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { cn } from "../lib/cn";
import { api, qs, type Page } from "../../lib/api";
import { useInfinite } from "../../lib/useInfinite";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import type { Product } from "../types";

interface Category {
  id: string;
  name: string;
}

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low → high",
  "price-desc": "Price: high → low",
  rating: "Top rated",
};

function useApiCategories() {
  const [items, setItems] = useState<Category[]>([]);
  useEffect(() => {
    let live = true;
    api
      .get<{ items: Category[] }>("/categories")
      .then((r) => live && setItems(r.items))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return { data: { items } };
}

/** Products the API returns, plus how it read the query. */
type ProductPage = Page<Product> & { interpretation: string | null };

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  // Filters live in the URL so Back, refresh and shared links keep them.
  const cat = params.get("cat") ?? "all";
  const sort = (params.get("sort") as SortKey | null) ?? "featured";
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  // The header search navigates to /shop?q=… even when we're already here.
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    setQuery(urlQuery);
  }
  // Debounced so a search is one request per pause, not one per keystroke.
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);
  useEffect(() => {
    if (debounced !== urlQuery) setParam("q", debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const cats = useApiCategories();
  // Filtering, sorting and query interpretation all run on the server — the
  // client no longer holds the catalog, so it cannot do them.
  const [interpretationSummary, setInterpretationSummary] = useState<string | null>(null);

  const state = useInfinite<Product>(
    async (page) => {
      const res = await api.get<ProductPage>(
        `/products${qs({
          q: debounced || undefined,
          cat: cat === "all" ? undefined : cat,
          sort: sort === "featured" ? undefined : sort,
          page,
          pageSize: 24,
        })}`,
      );
      setInterpretationSummary(res.interpretation);
      return res;
    },
    // Filter signature: when it changes, the list resets to page 1.
    `${debounced}|${cat}|${sort}`,
  );

  const filtered = state.items;
  const total = state.total;
  const interpretation = { summary: interpretationSummary };
  // "All" is a UI sentinel; the API only knows real categories.
  const categories = [{ id: "all", name: "All" }, ...(cats.data?.items ?? [])];

  function setParam(key: string, value: string | undefined) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
          Catalog
        </p>
        <h1 className="font-display text-[28px] md:text-[34px] tracking-tight font-semibold mt-1">
          {cat === "all"
            ? "All products"
            : categories.find((c) => c.id === cat)?.name ?? "Shop"}
        </h1>
        <p className="text-[13.5px] text-muted mt-1">
          {state.loading && total === 0 ? "Loading…" : `${total} ${total === 1 ? "item" : "items"} available`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            aria-label="Search products"
            className="input pl-9 pr-9 h-10"
            placeholder="Ask in plain English — e.g. 'top-rated home goods under $80'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Sparkles
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-accent-violet)] pointer-events-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setParam("cat", c.id === "all" ? undefined : c.id)}
              aria-pressed={cat === c.id}
              className={cn(
                "px-3 h-9 rounded-[10px] text-[13px] font-medium border whitespace-nowrap transition-colors",
                cat === c.id
                  ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="ml-auto relative">
          <ArrowDownUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <select
            aria-label="Sort products"
            className="input pl-9 pr-8 h-10 cursor-pointer"
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "featured" ? undefined : e.target.value)}
          >
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {sortLabels[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {interpretation.summary && (
        <div
          className="rounded-[12px] border px-3.5 py-2.5 flex items-start gap-2.5 text-[12.5px]"
          style={{
            borderColor: "color-mix(in oklab, var(--color-accent-violet) 28%, var(--color-border))",
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--color-accent-violet) 8%, var(--color-surface)), var(--color-surface))",
          }}
        >
          <Sparkles size={13} className="text-[var(--color-accent-violet)] mt-0.5 shrink-0" />
          <p className="text-muted">
            <span className="font-semibold text-[var(--color-text)]">AI interpreted:</span>{" "}
            {interpretation.summary}. Showing {total} matching{" "}
            {total === 1 ? "item" : "items"}.
          </p>
        </div>
      )}

      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.loading && filtered.length === 0 ? (
        <Skeleton rows={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card-surface">
          <p className="text-muted">No products match that search.</p>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            style={{ opacity: state.loading ? 0.6 : 1, transition: "opacity 120ms" }}
          >
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} showCategory />
            ))}
          </div>

          {!state.exhausted && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={state.loading}
                onClick={state.loadMore}
              >
                {state.loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
