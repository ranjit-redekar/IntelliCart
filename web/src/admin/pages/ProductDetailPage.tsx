import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Copy,
  DollarSign,
  Edit3,
  Image as ImageIcon,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip, StatusChip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import NotFoundPage from "./NotFoundPage";
import { cn } from "../lib/cn";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import { reportWrite } from "../../lib/toast";
import type { Feedback } from "../types";
import type { OrderStatus } from "../types";

interface ProductSales {
  unitsSold: number;
  revenue: number;
  buyers: number;
  orders: { orderId: string; placedAt: string; status: string; customerName: string; qty: number }[];
}
interface AdminProductDetail {
  id: string; name: string; description: string; sku: string;
  category: string; categoryId: string; price: number; stock: number; lowStock?: number; rating: number; image: string;
  images: { id: string; initials: string; theme: string; caption?: string; url?: string }[];
  specs: { key: string; value: string }[];
  highlights: string[]; inBox: string[];
  sales: ProductSales;
  reviews: { count: number; average: number; positiveShare: number };
}

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

// Thresholds come from the product's own low-stock setting (default 10).
function stockState(stock: number, lowStock = 10) {
  if (stock <= lowStock) return { tone: "danger" as const, label: "Low stock", health: "At risk" };
  if (stock <= lowStock * 2) return { tone: "pending" as const, label: "In stock", health: "Healthy" };
  return { tone: "success" as const, label: "Healthy", health: "Surplus" };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const state = useApi(() => api.get<AdminProductDetail>(`/admin/products/${id}`), [id]);
  const reviewState = useApi(
    () => api.get<Page<Feedback>>(`/products/${id}/reviews${qs({ pageSize: 20 })}`),
    [id],
  );

  if (state.loading && !state.data) return <Skeleton rows={6} />;
  if (state.error?.status === 404) return <NotFoundPage />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  const product = state.data;
  if (!product) return <NotFoundPage />;

  const accent = categoryAccent[product.categoryId] ?? "var(--color-brand-500)";
  const stock = stockState(product.stock, product.lowStock);

  // Real order lines for this SKU. This used to be reconstructed by running
  // the hash-derivation across every order and seeing whether it fell out.
  const ordersWithThis = product.sales.orders.map((o) => ({
    order: { id: o.orderId, placedAt: o.placedAt, status: o.status, customerName: o.customerName },
    qty: o.qty,
  }));

  const unitsSold = product.sales.unitsSold;
  const revenue = product.sales.revenue;
  const repeatBuyers = product.sales.buyers;
  const productReviews = reviewState.data?.items ?? [];
  // No `|| 12 + hash % 88` fallback: zero reviews is a real answer.
  const reviewCount = product.reviews.count;
  const avgReview = productReviews.length
    ? (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1)
    : product.rating.toFixed(1);
  const positiveShare = productReviews.length
    ? Math.round(
        (productReviews.filter((r) => r.sentiment === "positive").length / productReviews.length) * 100
      )
    : null;
  const sellThrough = Math.min(
    100,
    Math.round((unitsSold / Math.max(1, unitsSold + product.stock)) * 100)
  );

  // Margin was invented from a hash of the product id. Cost is a real column
  // now; when it has not been entered, the margin is simply unknown.
  const cost = (product as { cost?: number | null }).cost ?? null;
  const margin = cost != null && product.price > 0
    ? Math.round(((product.price - cost) / product.price) * 100)
    : null;
  const extras = product;

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to products
        </Link>
      </div>

      <PageHeader
        eyebrow={`Catalog · ${product.category}`}
        title={
          <span className="inline-flex items-center gap-3">
            <span>{product.name}</span>
            <Chip tone={stock.tone}>{stock.label}</Chip>
          </span>
        }
        description={`${product.id} · $${product.price} · ${product.stock} units on hand · ${avgReview}★ across ${reviewCount} reviews`}
        actions={
          <>
            <Link to={`/products/new?from=${encodeURIComponent(product.id)}`} className="btn btn-ghost btn-sm">
              <Copy size={14} /> Duplicate
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                if (!window.confirm(`Archive ${product.name}? It disappears from the storefront.`)) return;
                if (await reportWrite(api.del(`/admin/products/${product.id}`), "Product archived")) navigate("/products");
              }}
            >
              <Archive size={14} /> Archive
            </button>
            <Link to={`/products/${product.id}/edit`} className="btn btn-primary btn-sm">
              <Edit3 size={14} /> Edit product
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 fade-up-stagger">
        <div className="space-y-6 min-w-0">
          <Card padded={false} className="overflow-hidden">
            <div
              className="h-56 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, var(--color-surface-2)), var(--color-surface-2))`,
              }}
            >
              <span className="absolute inset-0 bg-grid opacity-50" aria-hidden />
              <img src={product.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <span
                className="absolute top-4 left-4 text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-md backdrop-blur"
                style={{
                  color: accent,
                  background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
                }}
              >
                {product.category}
              </span>
              <span className="absolute left-4 bottom-4 inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur">
                <Star size={12} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
                <span className="tabular-nums font-semibold">{product.rating}</span>
                <span className="text-subtle">· {reviewCount} reviews</span>
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">SKU</p>
                  <p className="text-[15.5px] font-semibold tracking-tight tabular-nums">{product.id}</p>
                </div>
                <Link to={`/products/${product.id}/edit`} className="btn btn-soft btn-sm">
                  <ImageIcon size={13} /> Manage images
                </Link>
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted">
                {product.description || "No description yet."}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card interactive>
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{
                    background: "color-mix(in oklab, var(--color-brand-500) 14%, transparent)",
                    color: "var(--color-brand-600)",
                  }}
                >
                  <ShoppingBag size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] text-muted">Units sold</p>
                  <p className="text-[22px] font-semibold tabular-nums">{unitsSold}</p>
                </div>
              </div>
            </Card>
            <Card interactive>
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{
                    background: "color-mix(in oklab, var(--color-accent-violet) 14%, transparent)",
                    color: "var(--color-accent-violet)",
                  }}
                >
                  <DollarSign size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] text-muted">Revenue</p>
                  <p className="text-[22px] font-semibold tabular-nums">${revenue.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card interactive>
              <p className="text-[12px] text-muted">Margin</p>
              <p className="text-[22px] font-semibold tabular-nums mt-1">{margin == null ? "—" : `${margin}%`}</p>
              <p className="text-[12px] text-subtle mt-1">
                Cost <span className="tabular-nums">{cost == null ? "—" : `$${cost}`}</span>
              </p>
            </Card>
            <Card interactive>
              <p className="text-[12px] text-muted">Sell-through</p>
              <p className="text-[22px] font-semibold tabular-nums mt-1">{sellThrough}%</p>
              <div className="mt-2 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${sellThrough}%`,
                    background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 60%, white))`,
                  }}
                />
              </div>
            </Card>
          </div>

          <Card padded={false} className="overflow-hidden">
            <CardHeader
              eyebrow="History"
              title="Recent orders with this product"
              subtitle={
                ordersWithThis.length === 0
                  ? "No orders in the visible window included this product"
                  : `${ordersWithThis.length} order${ordersWithThis.length === 1 ? "" : "s"} · ${repeatBuyers} unique buyer${repeatBuyers === 1 ? "" : "s"}`
              }
              className="px-5 pt-5"
            />
            {ordersWithThis.length === 0 ? (
              <div className="px-5 pb-5">
                <p className="text-[13px] text-muted">
                  This product hasn't shown up in the recent order sample. Try restocking or running a promo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-b border-[var(--color-border)]">
                      <th className="px-5 py-3 font-semibold">Order</th>
                      <th className="px-5 py-3 font-semibold">Customer</th>
                      <th className="px-5 py-3 font-semibold">Placed</th>
                      <th className="px-5 py-3 font-semibold text-right">Qty</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {ordersWithThis.map(({ order, qty }) => (
                      <tr
                        key={order.id}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <td className="px-5 py-3 font-semibold tabular-nums">
                          <Link to={`/orders/${order.id}`} className="hover:text-[var(--color-brand-600)]">
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-muted">{order.customerName}</td>
                        <td className="px-5 py-3 tabular-nums text-muted">{order.placedAt}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold">×{qty}</td>
                        <td className="px-5 py-3">
                          <StatusChip status={order.status as OrderStatus} />
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            to={`/orders/${order.id}`}
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
              eyebrow="Custom fields"
              title="Specifications & highlights"
              subtitle={`${extras.specs.length} specs · ${extras.highlights.length} highlights · ${extras.images.length} images`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2">
                  Highlights
                </p>
                {extras.highlights.length === 0 ? (
                  <p className="text-[13px] text-muted">No highlights configured.</p>
                ) : (
                  <ul className="space-y-1.5 text-[13px] text-muted">
                    {extras.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-text-subtle)] shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2">
                  Spec sheet
                </p>
                <dl className="text-[12.5px]">
                  {extras.specs.map((s, i) => (
                    <div
                      key={s.key}
                      className={cn(
                        "grid grid-cols-[120px_1fr] gap-3 px-2 py-1.5 rounded-md",
                        i % 2 === 0 && "bg-[var(--color-surface-2)]"
                      )}
                    >
                      <dt className="text-muted truncate">{s.key}</dt>
                      <dd className="text-[var(--color-text)] truncate">{s.value}</dd>
                    </div>
                  ))}
                </dl>
                {extras.inBox && extras.inBox.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle mb-1.5">
                      In the box
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {extras.inBox.map((b) => (
                        <li
                          key={b}
                          className="text-[11.5px] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Voice of customer"
              title="Customer reviews"
              subtitle={
                productReviews.length
                  ? `${productReviews.length} review${productReviews.length === 1 ? "" : "s"} · ${avgReview}★ average${positiveShare !== null ? ` · ${positiveShare}% positive` : ""}`
                  : "No reviews yet"
              }
              action={
                <Link
                  to="/feedback"
                  className="text-[11.5px] font-semibold text-[var(--color-brand-600)] hover:underline"
                >
                  View all
                </Link>
              }
            />
            {productReviews.length === 0 ? (
              <p className="text-[13px] text-muted py-4 text-center">
                Reviews will show here once customers rate this product.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] -mx-1">
                {productReviews.slice(0, 4).map((r) => (
                  <li key={r.id} className="px-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar name={r.customerName} size={34} />
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
                          {r.status === "new" && <Chip tone="info">new</Chip>}
                          {r.status === "flagged" && <Chip tone="danger">flagged</Chip>}
                        </div>
                        <p className="text-[11.5px] text-subtle mt-0.5">
                          {r.customerName} · <span className="tabular-nums">{r.createdAt}</span>
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
            <CardHeader eyebrow="Pricing" title="Price & cost" />
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Retail price</dt>
                <dd className="font-semibold tabular-nums">${product.price}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Cost per item</dt>
                <dd className="tabular-nums">{cost == null ? "—" : `$${cost}`}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2 mt-2">
                <dt className="font-semibold">Margin</dt>
                <dd className="font-semibold tabular-nums">{margin == null ? "—" : `${margin}%`}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Inventory"
              title="On hand"
              action={<Boxes size={14} className="text-subtle" />}
            />
            <div className="flex items-end gap-2">
              <p className="text-[28px] font-semibold tabular-nums leading-none">{product.stock}</p>
              <p className="text-[12px] text-subtle mb-1">units</p>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, product.stock)}%`,
                  background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 60%, white))`,
                }}
              />
            </div>
            <p
              className={cn(
                "text-[11.5px] mt-2 font-medium",
                product.stock < 40 ? "text-[var(--color-accent-rose)]" : "text-subtle"
              )}
            >
              {stock.health} · {stock.tone === "danger" ? "Consider restocking" : "No action needed"}
            </p>
          </Card>

          <Card>
            <CardHeader eyebrow="Category" title="Classification" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-subtle" />
                <span className="text-[13px]">{product.category}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="neutral">{product.category}</Chip>
                {product.rating >= 4.6 && <Chip tone="success">Top rated</Chip>}
                {stock.tone === "danger" && <Chip tone="danger">Low stock</Chip>}
                {unitsSold > 0 && <Chip tone="info">Selling</Chip>}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Trend"
              title="Last 30 days"
              action={<TrendingUp size={14} className="text-[var(--color-success-text)]" />}
            />
            <p className="text-[13px] text-muted leading-relaxed">
              {unitsSold > 0
                ? `${unitsSold} unit${unitsSold === 1 ? "" : "s"} sold across ${ordersWithThis.length} order${ordersWithThis.length === 1 ? "" : "s"}, generating $${revenue.toLocaleString()} in revenue.`
                : "No sales recorded in the visible window — consider featuring this product on the storefront."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
