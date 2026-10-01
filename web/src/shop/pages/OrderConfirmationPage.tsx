import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check, Mail, Package } from "lucide-react";
import { Card } from "../components/ui/Card";
import type { Product } from "../../../../shared/types";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import ProductCard from "../components/ProductCard";

interface OrderDetail {
  id: string;
  total: number;
  status: string;
  placedAt: string;
  address: { name: string; line1: string; city: string; postal: string; country: string };
  items: { productId: string | null; name: string; qty: number; unitPrice: number }[];
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  // The order is fetched, not read out of router state. Refreshing this page
  // used to lose everything, because the order only ever existed in the URL.
  const orderState = useApi(() => api.get<OrderDetail>(`/account/orders/${id}`), [id]);
  const order = orderState.data;
  const boughtIds = order?.items.flatMap((i) => (i.productId ? [i.productId] : [])) ?? [];
  const boughtKey = boughtIds.join(",");
  // Same query ProductPage uses for "related", keyed off the first bought item's
  // category; falls back to bestsellers. Failures just hide the section.
  const suggestState = useApi(async () => {
    if (!boughtKey) return [] as Product[];
    const bought = new Set(boughtKey.split(","));
    const pick = (items: Product[]) => items.filter((p) => !bought.has(p.id)).slice(0, 4);
    try {
      const first = await api.get<Product>(`/products/${boughtKey.split(",")[0]}`);
      const related = await api.get<Page<Product>>(
        `/products${qs({ cat: first.categoryId, pageSize: 8 })}`,
      );
      const picks = pick(related.items);
      if (picks.length) return picks;
    } catch {
      // fall through to bestsellers
    }
    try {
      return pick((await api.get<{ items: Product[] }>("/bestsellers")).items);
    } catch {
      return [] as Product[];
    }
  }, [boughtKey]);
  const suggestions = suggestState.data ?? [];

  if (orderState.loading && !order) return <Skeleton rows={4} />;
  if (orderState.error) {
    return <ErrorState error={orderState.error} onRetry={orderState.reload} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="text-center py-10 px-6">
        <span
          className="w-14 h-14 rounded-full flex items-center justify-center text-white mx-auto"
          style={{ background: "var(--color-accent-mint)" }}
        >
          <Check size={26} strokeWidth={3} />
        </span>
        <h1 className="font-display text-[28px] tracking-tight font-semibold mt-4">
          Order confirmed
        </h1>
        <p className="text-[14px] text-muted mt-2">
          Thanks for your order. We've sent a confirmation email
          {order?.address.name ? ` to ${order.address.name}` : ""}.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 rounded-[12px] soft-surface">
          <Package size={16} className="text-subtle" />
          <div className="text-left">
            <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">
              Order number
            </p>
            <p className="text-[14.5px] font-semibold tabular-nums">{order?.id ?? id}</p>
          </div>
          {order && (
            <div className="text-left ml-3 border-l border-[var(--color-border)] pl-3">
              <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">
                Total
              </p>
              <p className="text-[14.5px] font-semibold tabular-nums">${order.total}</p>
            </div>
          )}
        </div>
        {order && order.items.length > 0 && (
          <ul className="mt-6 mx-auto max-w-sm text-left text-[13px] divide-y divide-[var(--color-border)]">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.name}`} className="py-2 flex justify-between gap-4">
                <span>
                  {item.name} <span className="text-subtle">× {item.qty}</span>
                </span>
                <span className="tabular-nums">${item.unitPrice * item.qty}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link to={`/account/orders/${order?.id ?? id}`} className="btn btn-primary btn-sm">
            View order <ArrowRight size={13} />
          </Link>
          <Link to="/shop" className="btn btn-ghost btn-sm">
            Continue shopping
          </Link>
        </div>
      </Card>

      <Card>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
          What happens next
        </p>
        <ul className="mt-3 space-y-3 text-[13.5px]">
          <li className="flex items-start gap-3">
            <Mail size={15} className="mt-0.5 text-subtle" />
            <span>
              An order confirmation is heading to your inbox with shipping details and tracking info.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Package size={15} className="mt-0.5 text-subtle" />
            <span>
              We'll pick and pack your items in the next business day. You'll get tracking when it ships.
            </span>
          </li>
        </ul>
      </Card>

      {suggestions.length > 0 && (
        <section>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Keep exploring
          </p>
          <h2 className="font-display text-[22px] tracking-tight font-semibold mt-1 mb-4">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
