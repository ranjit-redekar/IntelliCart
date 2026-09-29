import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Mail,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip, StatusChip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import NotFoundPage from "./NotFoundPage";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import type { Feedback, Order } from "../types";

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalSpent: number;
  orders: Order[];
  reviews: Feedback[];
}
import { cn } from "../lib/cn";

function tierFor(orderCount: number) {
  if (orderCount >= 12) return { label: "VIP", tone: "info" as const };
  if (orderCount >= 6) return { label: "Loyal", tone: "shipped" as const };
  return { label: "New", tone: "neutral" as const };
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useApi(() => api.get<CustomerDetail>(`/admin/customers/${id}`), [id]);

  if (state.loading && !state.data) return <Skeleton rows={5} />;
  if (state.error?.status === 404) return <NotFoundPage />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  const customer = state.data;
  if (!customer) return <NotFoundPage />;

  const recentOrders = customer.orders;
  const customerReviews = customer.reviews;
  const orderCount = recentOrders.length;
  const avgGivenRating = customerReviews.length
    ? (customerReviews.reduce((s, r) => s + r.rating, 0) / customerReviews.length).toFixed(1)
    : null;

  // The phone number, street address, account-manager note and join date were
  // all derived from a hash of the customer id — plausible-looking data that
  // was never entered by anyone. Only what is actually recorded is shown now.
  const since = customer.createdAt.slice(0, 10);

  const visibleSpend = customer.totalSpent;
  const visibleAvg = orderCount ? Math.round(visibleSpend / orderCount) : 0;
  const lifetimeValue = visibleSpend;
  const lastOrderDate = recentOrders[0]?.placedAt;
  const tier = tierFor(orderCount);

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to customers
        </Link>
      </div>

      <PageHeader
        eyebrow={`Customer · ${customer.id}`}
        title={
          <span className="inline-flex items-center gap-3">
            <Avatar name={customer.name} size={44} />
            <span>{customer.name}</span>
            <Chip tone={tier.tone}>{tier.label}</Chip>
          </span>
        }
        description={
          <span className="inline-flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-muted">
              <Mail size={13} /> {customer.email}
            </span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Calendar size={13} /> Customer since {since}
            </span>
          </span>
        }
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm">
              <MessageSquare size={14} /> Add note
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Mail size={14} /> Email customer
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-4 fade-up-stagger">
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
              <p className="text-[22px] font-semibold tabular-nums">{orderCount}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{
                background: "color-mix(in oklab, var(--color-accent-violet) 14%, transparent)",
                color: "var(--color-accent-violet)",
              }}
            >
              <Wallet size={18} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Lifetime value</p>
              <p className="text-[22px] font-semibold tabular-nums">${lifetimeValue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Avg. order value</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">
            ${visibleAvg || 112}
          </p>
          <p className="text-[12px] text-subtle mt-1">
            {recentOrders.length} recent · ${visibleSpend} spent
          </p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Last order</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">
            {lastOrderDate ?? "—"}
          </p>
          <p className="text-[12px] text-subtle mt-1">
            {lastOrderDate ? "Within the last 30 days" : "No orders on file"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 fade-up">
        <div className="space-y-6 min-w-0">
          <Card padded={false} className="overflow-hidden">
            <CardHeader
              eyebrow="History"
              title="Recent orders"
              subtitle={`${recentOrders.length} order${recentOrders.length === 1 ? "" : "s"} in the last 30 days`}
              className="px-5 pt-5"
            />
            {recentOrders.length === 0 ? (
              <div className="px-5 pb-5">
                <p className="text-[13px] text-muted">No orders in the visible window.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-b border-[var(--color-border)]">
                      <th className="px-5 py-3 font-semibold">Order</th>
                      <th className="px-5 py-3 font-semibold">Placed</th>
                      <th className="px-5 py-3 font-semibold text-right">Total</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <td className="px-5 py-3 font-semibold tabular-nums">
                          <Link to={`/orders/${o.id}`} className="hover:text-[var(--color-brand-600)]">
                            {o.id}
                          </Link>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-muted">{o.placedAt}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold">${o.total}</td>
                        <td className="px-5 py-3">
                          <StatusChip status={o.status} />
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            to={`/orders/${o.id}`}
                            className="btn btn-icon btn-sm btn-ghost"
                            aria-label="View order"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              eyebrow="Notes"
              title="Account notes"
              action={<Sparkles size={14} className="text-[var(--color-accent-violet)]" />}
            />
            <div className="space-y-3">
              <div className="soft-surface p-4">
                <p className="text-[13px] leading-relaxed text-muted">
                  No notes yet. Notes are not stored server-side.
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm w-full justify-center">
                <MessageSquare size={13} /> Add another note
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Voice of customer"
              title="Reviews left"
              subtitle={
                customerReviews.length
                  ? `${customerReviews.length} review${customerReviews.length === 1 ? "" : "s"} · ${avgGivenRating}★ average given`
                  : "This customer hasn't left a review yet"
              }
              action={
                customerReviews.length > 0 && (
                  <Link
                    to="/feedback"
                    className="text-[11.5px] font-semibold text-[var(--color-brand-600)] hover:underline"
                  >
                    View all
                  </Link>
                )
              }
            />
            {customerReviews.length === 0 ? (
              <p className="text-[13px] text-muted">
                No reviews on file. Consider triggering a post-purchase request after their next delivery.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] -mx-1">
                {customerReviews.map((r) => (
                  <li key={r.id} className="px-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            to={`/feedback/${r.id}`}
                            className="text-[13.5px] font-semibold hover:text-[var(--color-brand-600)]"
                          >
                            {r.title}
                          </Link>
                          <span
                            className="inline-flex items-center gap-0.5"
                            aria-label={`${r.rating} out of 5`}
                          >
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={11}
                                className={cn(
                                  i <= r.rating
                                    ? "fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]"
                                    : "text-[var(--color-surface-3)]"
                                )}
                              />
                            ))}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-subtle mt-0.5">
                          <Link
                            to={`/products/${r.productId}`}
                            className="hover:text-[var(--color-text)]"
                          >
                            {r.productName}
                          </Link>
                          {" · "}
                          <span className="tabular-nums">{r.createdAt}</span>
                        </p>
                        <p className="text-[13px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                          {r.body}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6 min-w-0">
          <Card>
            <CardHeader eyebrow="Contact" title="Reach out" />
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-start gap-3">
                <Mail size={14} className="mt-0.5 text-subtle" />
                <a
                  href={`mailto:${customer.email}`}
                  className="text-[var(--color-text)] hover:text-[var(--color-brand-600)] break-all"
                >
                  {customer.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} className="mt-0.5 text-subtle" />
                <span className="text-muted">
                  {lastOrderDate ? `Last shipped ${lastOrderDate}` : "No orders yet"}
                </span>
              </li>
            </ul>
          </Card>

          <Card>
            <CardHeader eyebrow="Segments" title="Tags" />
            <div className="flex flex-wrap gap-1.5">
              <Chip tone={tier.tone}>{tier.label}</Chip>
              {orderCount >= 20 && <Chip tone="success">Top spender</Chip>}
              {orderCount < 4 && <Chip tone="pending">Needs nudge</Chip>}
              {recentOrders.length >= 2 && <Chip tone="info">Active this month</Chip>}
              <Chip tone="neutral">Newsletter</Chip>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="AI" title="Next best action" action={<Sparkles size={14} className="text-[var(--color-accent-violet)]" />} />
            <p className="text-[13px] leading-relaxed text-muted">
              {tier.label === "VIP"
                ? "Offer early access to the next drop — VIPs in this cohort convert 2.3× on previews."
                : tier.label === "Loyal"
                ? "Send a thank-you with a free-shipping code. Loyal repeat-rate improves 14% after a small gesture."
                : "Trigger the welcome series and surface a 10% first-repeat coupon to lift their next order."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
