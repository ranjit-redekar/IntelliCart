import { useEffect, useState } from "react";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState } from "../../lib/AsyncBoundary";
import type { Order } from "../types";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Filter, Hourglass, Search, Truck, Wallet } from "lucide-react";
import type { OrderStatus } from "../types";
import { Card } from "../components/ui/Card";
import { StatusChip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import { Pagination } from "../components/ui/Pagination";
import { cn } from "../lib/cn";

const statuses: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

const summaries = [
  { id: "rev", label: "Total revenue", value: "$929", icon: Wallet, tone: "var(--color-brand-500)" },
  { id: "pending", label: "Awaiting action", value: "1", icon: Hourglass, tone: "var(--color-accent-amber)" },
  { id: "transit", label: "In transit", value: "1", icon: Truck, tone: "var(--color-accent-violet)" },
  { id: "done", label: "Fulfilled today", value: "0", icon: CheckCircle2, tone: "var(--color-accent-mint)" },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [filter, debounced, pageSize]);

  const state = useApi(
    () =>
      api.get<Page<Order>>(
        `/admin/orders${qs({ status: filter, q: debounced || undefined, page, pageSize })}`,
      ),
    [filter, debounced, page, pageSize],
  );

  const paginated = state.data?.items ?? [];
  const total = state.data?.total ?? 0;

  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfillment"
        title="Orders"
        description="Track and act on every order from cart to delivery."
        actions={
          <button type="button" className="btn btn-primary btn-sm">
            <Filter size={14} /> Bulk actions
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up-stagger">
        {summaries.map((s) => (
          <Card key={s.id} interactive>
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in oklab, ${s.tone} 14%, transparent)`, color: s.tone }}
              >
                <s.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] text-muted">{s.label}</p>
                <p className="text-[22px] font-semibold tracking-tight tabular-nums">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 fade-up">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9 h-10"
            placeholder="Search by order ID or customer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1">
          {statuses.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              className={cn(
                "px-3 h-9 rounded-[10px] text-[13px] font-medium border whitespace-nowrap transition-colors",
                filter === s.id
                  ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 fade-up-stagger">
        {paginated.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block focus:outline-none focus-visible:rounded-[16px] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-400)]"
          >
            <Card interactive className="group h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">Order</p>
                  <p className="text-[15.5px] font-semibold tracking-tight tabular-nums break-all">{order.id}</p>
                </div>
                <StatusChip status={order.status} />
              </div>

              <div className="mt-4 flex items-center gap-3 py-3 border-y border-[var(--color-border)]">
                <Avatar name={order.customerName} size={36} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{order.customerName}</p>
                  <p className="text-[12px] text-subtle">Placed {order.placedAt}</p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">Total</p>
                  <p className="text-[22px] font-semibold tracking-tight tabular-nums">${order.total}</p>
                </div>
                <span className="btn btn-soft btn-sm transition-transform group-hover:translate-x-0.5">
                  View <ArrowRight size={13} />
                </span>
              </div>
            </Card>
          </Link>
        ))}
        {!state.loading && paginated.length === 0 && (
          <Card className="col-span-full text-center py-12">
            <p className="text-muted">No orders match those filters.</p>
          </Card>
        )}
      </div>

      {total > 0 && (
        <Card padded={false}>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}
    </div>
  );
}
