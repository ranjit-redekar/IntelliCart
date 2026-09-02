import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import type { Order, OrderStatus } from "../../../../shared/types";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import { Card } from "../components/ui/Card";
import { StatusChip } from "../components/ui/StatusChip";
import { useSession } from "../lib/session";
import { cn } from "../lib/cn";

const filters: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

export default function AccountOrdersPage() {
  const { user } = useSession();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");

  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  // Scoped to the signed-in customer by the session, not by matching a name.
  const state = useApi(
    () =>
      api.get<Page<Order>>(
        `/account/orders${qs({ status: filter, q: debounced || undefined, pageSize: 50 })}`,
      ),
    [filter, debounced, user?.id],
  );
  const list = state.data?.items ?? [];

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9 h-10"
            placeholder="Search by order number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 h-9 rounded-[10px] text-[13px] font-medium border whitespace-nowrap transition-colors",
                filter === f.id
                  ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.loading && list.length === 0 ? (
        <Skeleton rows={3} />
      ) : list.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted">No orders match those filters.</p>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul>
            {list.map((o) => (
              <li
                key={o.id}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Link to={`/account/orders/${o.id}`} className="block p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">
                        Order
                      </p>
                      <p className="text-[15px] font-semibold tabular-nums">{o.id}</p>
                    </div>
                    <StatusChip status={o.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-muted tabular-nums">Placed {o.placedAt}</span>
                    <span className="font-semibold tabular-nums">${o.total}</span>
                    <span className="text-[12px] text-[var(--color-brand-600)] font-semibold inline-flex items-center gap-1">
                      Details <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
