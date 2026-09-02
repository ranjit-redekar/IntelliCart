import { Link } from "react-router-dom";
import { ArrowRight, Heart, MapPin, Settings, ShoppingBag } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Chip, StatusChip } from "../components/ui/StatusChip";
import { useSession } from "../lib/session";
import { useWishlist } from "../lib/wishlist";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Order } from "../../../../shared/types";

interface Overview {
  orders: number;
  totalSpent: number;
  reviews: number;
  wishlist: number;
  tier: string;
}

export default function AccountOverviewPage() {
  const { user } = useSession();
  const savedCount = useWishlist().ids.length;
  // Counts are aggregated in SQL. They used to come from filtering the bundled
  // fixtures by display-name string, which matched the wrong person whenever
  // two customers shared a name.
  const overview = useApi(() => api.get<Overview>("/account/overview"), [user?.id]);
  const recent = useApi(
    () => api.get<Page<Order>>(`/account/orders${qs({ pageSize: 5 })}`),
    [user?.id],
  );

  if (!user) return null;

  const stats = overview.data;
  const myOrders = recent.data?.items ?? [];
  const totalSpent = stats?.totalSpent ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card interactive>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{
                background: "color-mix(in oklab, var(--color-brand-500) 14%, transparent)",
                color: "var(--color-brand-600)",
              }}
            >
              <ShoppingBag size={18} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Lifetime orders</p>
              <p className="text-[22px] font-semibold tabular-nums">{stats?.orders ?? "—"}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Visible spend</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">${totalSpent}</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Reviews left</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{stats?.reviews ?? "—"}</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Tier</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">
            {stats?.tier ?? "—"}
          </p>
        </Card>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Recent
            </p>
            <h2 className="text-[16px] font-semibold tracking-tight mt-0.5">Latest orders</h2>
          </div>
          <Link
            to="/account/orders"
            className="text-[12.5px] font-semibold text-[var(--color-brand-600)] hover:underline"
          >
            View all
          </Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="px-5 pb-6">
            <p className="text-[13px] text-muted">
              You haven't placed an order yet. Pick something out from{" "}
              <Link to="/shop" className="font-semibold hover:underline">
                the shop
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul>
            {myOrders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="border-t border-[var(--color-border)] px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div>
                  <Link
                    to={`/account/orders/${o.id}`}
                    className="font-semibold tabular-nums hover:text-[var(--color-brand-600)]"
                  >
                    {o.id}
                  </Link>
                  <p className="text-[11.5px] text-subtle tabular-nums">Placed {o.placedAt}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">${o.total}</span>
                  <StatusChip status={o.status} />
                  <Link
                    to={`/account/orders/${o.id}`}
                    className="btn btn-icon btn-sm btn-ghost"
                    aria-label="View order"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card interactive>
          <Heart size={18} className="text-[var(--color-accent-rose)]" />
          <p className="text-[14px] font-semibold mt-2">Wishlist</p>
          <p className="text-[12.5px] text-muted mt-1">
            {savedCount === 0
              ? "Tap the heart on any product to save it."
              : `${savedCount} item${savedCount === 1 ? "" : "s"} waiting for you.`}
          </p>
          <Link
            to="/account/wishlist"
            className="text-[12.5px] font-semibold text-[var(--color-brand-600)] hover:underline mt-2 inline-block"
          >
            {savedCount === 0 ? "Browse →" : "View saved →"}
          </Link>
        </Card>
        <Card interactive>
          <MapPin size={18} className="text-[var(--color-brand-600)]" />
          <p className="text-[14px] font-semibold mt-2">Addresses</p>
          <p className="text-[12.5px] text-muted mt-1">Manage where your orders ship.</p>
          <Link
            to="/account/addresses"
            className="text-[12.5px] font-semibold text-[var(--color-brand-600)] hover:underline mt-2 inline-block"
          >
            Manage →
          </Link>
        </Card>
        <Card interactive>
          <Settings size={18} className="text-[var(--color-accent-violet)]" />
          <p className="text-[14px] font-semibold mt-2">Profile</p>
          <p className="text-[12.5px] text-muted mt-1">Email and communication preferences.</p>
          <Chip tone="neutral" className="mt-2">
            Up to date
          </Chip>
        </Card>
      </div>
    </div>
  );
}
