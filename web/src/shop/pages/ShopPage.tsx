import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownUp, Search, Sparkles } from "lucide-react";
import { categories, products } from "../mockdata";
import { interpretSearch } from "../lib/ai";
import ProductCard from "../components/ProductCard";
import { cn } from "../lib/cn";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low → high",
  "price-desc": "Price: high → low",
  rating: "Top rated",
};

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") ?? "all";
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>("featured");

  const interpretation = useMemo(() => interpretSearch(query), [query]);

  const filtered = useMemo(() => {
    const aiCat = interpretation.filters.categoryId;
    const aiMax = interpretation.filters.maxPrice;
    const aiMinRating = interpretation.filters.minRating;
    const list = products
      .filter((p) => (cat === "all" ? true : p.categoryId === cat))
      .filter((p) => (aiCat ? p.categoryId === aiCat : true))
      .filter((p) => (aiMax != null ? p.price <= aiMax : true))
      .filter((p) => (aiMinRating != null ? p.rating >= aiMinRating : true))
      .filter(
        (p) =>
          !query ||
          interpretation.summary !== null ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );
    const sorted = [...list];
    const effectiveSort = interpretation.filters.sort ?? sort;
    if (effectiveSort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (effectiveSort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (effectiveSort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [cat, query, sort, interpretation]);

  function setCat(nextCat: string) {
    const next = new URLSearchParams(params);
    if (nextCat === "all") next.delete("cat");
    else next.set("cat", nextCat);
    setParams(next, { replace: true });
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
          {filtered.length} {filtered.length === 1 ? "item" : "items"} available
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
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
              onClick={() => setCat(c.id)}
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
            className="input pl-9 pr-8 h-10 cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
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
            {interpretation.summary}. Showing {filtered.length} matching{" "}
            {filtered.length === 1 ? "item" : "items"}.
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 card-surface">
          <p className="text-muted">No products match that search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} showCategory />
          ))}
        </div>
      )}
    </div>
  );
}
