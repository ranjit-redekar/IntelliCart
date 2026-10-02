import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useListParams } from "../lib/useListParams";
import { ArrowDown, ArrowUp, Download, LayoutGrid, List, Loader2, Plus, Search, Star, Upload } from "lucide-react";
import { exportAllCsv } from "../lib/csv";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import SavedViews from "../components/SavedViews";
import { cn } from "../lib/cn";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState } from "../../lib/AsyncBoundary";
import { toast } from "../../lib/toast";
import type { Product } from "../types";

interface AdminProduct extends Product {
  sku: string;
  status: "draft" | "active" | "archived";
  lowStock?: number;
}

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

const CSV_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "sku", label: "SKU" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "price", label: "Price" },
  { key: "comparePrice", label: "Compare-at price" },
  { key: "cost", label: "Cost" },
  { key: "stock", label: "Stock" },
  { key: "lowStock", label: "Low-stock threshold" },
  { key: "rating", label: "Rating" },
  { key: "tags", label: "Tags" },
  { key: "createdAt", label: "Created" },
];

// Thresholds come from the product's own low-stock setting (default 10).
function stockState(stock: number, lowStock = 10) {
  if (stock <= lowStock) return { tone: "danger" as const, label: "Low stock", health: "At risk" };
  if (stock <= lowStock * 2) return { tone: "pending" as const, label: "In stock", health: "Healthy" };
  return { tone: "success" as const, label: "Healthy", health: "Surplus" };
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { filters, page, pageSize, q, query, setQuery, update } = useListParams({ cat: "all", view: "grid", sort: "" });
  const cat = filters.cat;
  const view = filters.view as "grid" | "list";
  const sort = filters.sort; // "", "price-asc", "price-desc", "stock-asc", "stock-desc"
  // Click a header: ascending, then descending, then back to the default order.
  const sortBy = (col: "price" | "stock") =>
    update({ sort: sort === `${col}-asc` ? `${col}-desc` : sort === `${col}-desc` ? "" : `${col}-asc` });
  const ariaSort = (col: string) =>
    sort === `${col}-asc` ? "ascending" : sort === `${col}-desc` ? "descending" : "none";
  const sortIcon = (col: string) =>
    sort === `${col}-asc` ? <ArrowUp size={12} /> : sort === `${col}-desc` ? <ArrowDown size={12} /> : null;

  const cats = useApi(
    () => api.get<{ items: { id: string; name: string }[] }>("/categories"),
    [],
  );
  // Filtering and paging happen in SQL. The page no longer holds the catalog,
  // so a 10,000-product store costs the same as a 24-product one.
  const state = useApi(
    () =>
      api.get<Page<AdminProduct>>(
        `/admin/products${qs({ q: q || undefined, cat, sort: sort || undefined, page, pageSize })}`,
      ),
    [q, cat, sort, page, pageSize],
  );

  const paginated = state.data?.items ?? [];
  const total = state.data?.total ?? 0;

  // Bulk selection covers the visible page only; any page/filter change clears it.
  const listKey = `${q}|${cat}|${sort}|${page}|${pageSize}|${view}`;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selKey, setSelKey] = useState(listKey);
  if (selKey !== listKey) {
    setSelKey(listKey);
    setSelected(new Set());
  }
  const [archiving, setArchiving] = useState(false);
  const allSelected = paginated.length > 0 && paginated.every((p) => selected.has(p.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  async function archiveSelected() {
    const ids = [...selected];
    if (!window.confirm(`Archive ${ids.length} ${ids.length === 1 ? "product" : "products"}?`)) return;
    setArchiving(true);
    // ponytail: one DELETE per product; fine for a page (≤100). Add a bulk endpoint if pages get bigger.
    const results = await Promise.allSettled(ids.map((id) => api.del(`/admin/products/${id}`)));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) toast(`${failed} of ${ids.length} couldn't be archived. Try again.`);
    else toast(`Archived ${ids.length}`, "success");
    setArchiving(false);
    setSelected(new Set());
    state.reload();
  }

  const [exporting, setExporting] = useState(false);
  // Exports every row matching the current filters, not just this page.
  async function exportCsv() {
    setExporting(true);
    const r = await exportAllCsv("products", (p, n) => api.get<Page<AdminProduct>>(`/admin/products${qs({ q: q || undefined, cat, sort: sort || undefined, page: p, pageSize: n })}`), CSV_COLUMNS);
    toast(r.text, r.tone);
    setExporting(false);
  }

  const categories = [{ id: "all", name: "All" }, ...(cats.data?.items ?? [])];

  if (state.error) {
    return (
      <div className="space-y-6">
        <ErrorState error={state.error} onRetry={state.reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description={`${total} ${total === 1 ? "item" : "items"} in your catalog`}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm" disabled title="Coming soon">
              <Upload size={14} /> Import
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={exporting} aria-busy={exporting}>
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
            <Link to="/products/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add product
            </Link>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 fade-up">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            type="text"
            className="input pl-9 h-10"
            placeholder="Search by name or SKU…"
            aria-label="Search by name or SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 lg:overflow-visible">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ cat: c.id })}
              className={cn(
                "px-3 h-9 rounded-[10px] text-[13px] font-medium border transition-colors whitespace-nowrap",
                cat === c.id
                  ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <SavedViews pageKey="products" />
        <div className="ml-auto flex items-center p-0.5 soft-surface rounded-[10px]">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => update({ view: "grid", page })}
            className={cn(
              "btn btn-icon btn-sm border-0",
              view === "grid" ? "bg-[var(--color-surface)] shadow-[var(--shadow-soft)] text-[var(--color-text)]" : "text-subtle"
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => update({ view: "list", page })}
            className={cn(
              "btn btn-icon btn-sm border-0",
              view === "list" ? "bg-[var(--color-surface)] shadow-[var(--shadow-soft)] text-[var(--color-text)]" : "text-subtle"
            )}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-up-stagger">
          {paginated.map((p) => {
            const accent = categoryAccent[p.categoryId] ?? "var(--color-brand-500)";
            return (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="block focus:outline-none focus-visible:rounded-[16px] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-400)]"
              >
                <Card interactive padded={false} className="overflow-hidden group h-full">
                  <div
                    className="h-36 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, var(--color-surface-2)), var(--color-surface-2))`,
                    }}
                  >
                    <span className="absolute inset-0 bg-grid opacity-50" aria-hidden />
                    <img
                      src={p.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span
                      className="absolute top-3 left-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-md backdrop-blur"
                      style={{ color: accent, background: "color-mix(in oklab, var(--color-surface) 85%, transparent)" }}
                    >
                      {p.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14.5px] font-semibold truncate">{p.name}</p>
                        <p className="text-[12px] text-subtle">{p.id}</p>
                      </div>
                      <p className="text-[15px] font-semibold tabular-nums">${p.price}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
                        <Star size={13} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
                        <span className="tabular-nums font-medium text-[var(--color-text)]">{p.rating}</span>
                      </span>
                      <Chip tone={stockState(p.stock, p.lowStock).tone}>{p.stock} units</Chip>
                    </div>
                    <div className="pt-2">
                      <div className="h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, p.stock)}%`,
                            background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 60%, white))`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
          {!state.loading && paginated.length === 0 && (
            <Card className="col-span-full text-center py-10">
              <p className="text-muted">No products match your filters.</p>
            </Card>
          )}
        </div>
      ) : (
        <Card padded={false} className="overflow-hidden fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-b border-[var(--color-border)]">
                  <th className="pl-5 py-3 w-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 align-middle accent-[var(--color-brand-500)]"
                      aria-label="Select all products on this page"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = selected.size > 0 && !allSelected;
                      }}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(paginated.map((p) => p.id)))}
                      disabled={paginated.length === 0}
                    />
                  </th>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold text-right" aria-sort={ariaSort("price")}>
                    <button type="button" onClick={() => sortBy("price")} className="inline-flex items-center gap-1 uppercase hover:text-[var(--color-text)]">
                      Price {sortIcon("price")}
                    </button>
                  </th>
                  <th className="px-5 py-3 font-semibold" aria-sort={ariaSort("stock")}>
                    <button type="button" onClick={() => sortBy("stock")} className="inline-flex items-center gap-1 uppercase hover:text-[var(--color-text)]">
                      Stock {sortIcon("stock")}
                    </button>
                  </th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                  <th className="px-5 py-3 font-semibold">Health</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const accent = categoryAccent[p.categoryId] ?? "var(--color-brand-500)";
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                    >
                      <td className="pl-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 align-middle accent-[var(--color-brand-500)]"
                          aria-label={`Select ${p.name}`}
                          checked={selected.has(p.id)}
                          onChange={() => toggle(p.id)}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            className="w-9 h-9 rounded-[10px] object-cover shrink-0"
                            style={{ background: `color-mix(in oklab, ${accent} 18%, var(--color-surface-2))` }}
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/products/${p.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold truncate hover:text-[var(--color-brand-600)]"
                            >
                              {p.name}
                            </Link>
                            <p className="text-[11.5px] text-subtle">
                              {p.id}
                              {p.status !== "active" && (
                                <span className="chip chip-neutral ml-2 capitalize">{p.status}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Chip tone="neutral">{p.category}</Chip>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">${p.price}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 w-40">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, p.stock)}%`,
                                background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 60%, white))`,
                              }}
                            />
                          </div>
                          <span className="tabular-nums text-[12px] text-muted w-8 text-right">{p.stock}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
                          <Star size={13} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
                          <span className="font-medium text-[var(--color-text)]">{p.rating}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("chip", `chip-${stockState(p.stock, p.lowStock).tone}`)}>
                          {stockState(p.stock, p.lowStock).label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!state.loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted">
                      No products match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === "list" && selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="sticky bottom-4 z-20 flex items-center gap-3 px-4 py-2.5 rounded-[14px] card-surface shadow-[var(--shadow-pop)] fade-up"
        >
          <span className="text-[13px] font-medium tabular-nums">{selected.size} selected</span>
          <button type="button" className="btn btn-primary btn-sm ml-auto" onClick={archiveSelected} disabled={archiving}>
            {archiving ? "Archiving…" : "Archive"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {total > 0 && (
        <Card padded={false}>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => update({ page: p })}
            onPageSizeChange={(n) => update({ pageSize: n })}
          />
        </Card>
      )}
    </div>
  );
}
