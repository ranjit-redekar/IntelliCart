import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Hourglass,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { orders, products } from "../mockdata";
import type { OrderStatus } from "../../../../shared/types";
import { Card } from "../components/ui/Card";
import { Chip, StatusChip } from "../components/ui/StatusChip";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { cn } from "../lib/cn";
import NotFoundPage from "./NotFoundPage";

const stepOrder: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const stepMeta: Record<
  OrderStatus,
  { label: string; icon: typeof Hourglass; description: string }
> = {
  pending: { label: "Order placed", icon: Hourglass, description: "Awaiting fulfillment" },
  processing: { label: "Processing", icon: Package, description: "Picking and packing" },
  shipped: { label: "Shipped", icon: Truck, description: "On the way to you" },
  delivered: { label: "Delivered", icon: CheckCircle2, description: "Order complete" },
};

const addressPool = [
  { line1: "121 Marine Drive", city: "Mumbai", region: "MH", postal: "400020", country: "India" },
  { line1: "48 Carmine Street", city: "New York", region: "NY", postal: "10014", country: "USA" },
  { line1: "9 Rue de Rivoli", city: "Paris", region: "ÎDF", postal: "75004", country: "France" },
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function deriveItems(orderId: string, total: number) {
  const seed = hashString(orderId);
  const count = (seed % 3) + 1;
  const items: { sku: string; name: string; qty: number; unitPrice: number }[] = [];
  for (let i = 0; i < count; i++) {
    const p = products[(seed + i * 17) % products.length];
    const qty = ((seed >> (i + 1)) % 2) + 1;
    items.push({ sku: p.id, name: p.name, qty, unitPrice: p.price });
  }
  const shipping = total >= 50 ? 0 : 8;
  const tax = Math.round(total * 0.08);
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const adjustment = total - shipping - tax - subtotal;
  return { items, shipping, tax, subtotal, adjustment };
}

function shiftDate(iso: string, deltaDays: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useMemo(() => orders.find((o) => o.id === id), [id]);
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  if (!order) return <NotFoundPage />;

  const { items, subtotal, shipping, tax, adjustment } = deriveItems(order.id, order.total);
  const address = addressPool[hashString(order.customerName) % addressPool.length];
  const stepIndex = stepOrder.indexOf(order.status);

  function reorder() {
    items.forEach((it) => add(it.sku, it.qty));
    toast(`${items.length} item${items.length === 1 ? "" : "s"} added to cart`, "success");
  }

  return (
    <div className="space-y-6">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={14} /> All orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Order
          </p>
          <h1 className="font-display text-[28px] tracking-tight font-semibold mt-1 tabular-nums inline-flex items-center gap-3">
            {order.id} <StatusChip status={order.status} />
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Placed {order.placedAt} · {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reorder} className="btn btn-ghost btn-sm">
            <RotateCcw size={14} /> Buy it again
          </button>
          <button
            type="button"
            onClick={() => {
              reorder();
              navigate("/cart");
            }}
            className="btn btn-primary btn-sm"
          >
            Reorder now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Items
              </p>
              <h2 className="text-[15px] font-semibold tracking-tight mt-0.5">In this order</h2>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {items.map((it) => (
                <li key={it.sku} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/products/${it.sku}`}
                      className="font-semibold hover:text-[var(--color-brand-600)] truncate block"
                    >
                      {it.name}
                    </Link>
                    <p className="text-[11.5px] text-subtle tabular-nums">{it.sku} · ${it.unitPrice} each</p>
                  </div>
                  <p className="text-[13px] tabular-nums">×{it.qty}</p>
                  <p className="text-[14px] font-semibold tabular-nums w-16 text-right">
                    ${it.qty * it.unitPrice}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--color-border)] p-5">
              <dl className="space-y-1.5 text-[13.5px] max-w-sm ml-auto">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">${subtotal}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="tabular-nums">{shipping === 0 ? "Free" : `$${shipping}`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Tax</dt>
                  <dd className="tabular-nums">${tax}</dd>
                </div>
                {adjustment !== 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{adjustment < 0 ? "Discount" : "Adjustment"}</dt>
                    <dd
                      className={cn(
                        "tabular-nums",
                        adjustment < 0 && "text-[var(--color-accent-mint)]"
                      )}
                    >
                      {adjustment < 0 ? "-" : "+"}${Math.abs(adjustment)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[var(--color-border)] mt-2">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-semibold tabular-nums text-[15px]">${order.total}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Tracking
            </p>
            <h2 className="text-[15px] font-semibold tracking-tight mt-0.5">Where it is now</h2>
            <ol className="relative pl-7 mt-4">
              <span
                className="absolute left-3 top-2 bottom-2 w-px bg-[var(--color-border)]"
                aria-hidden
              />
              {stepOrder.map((step, i) => {
                const meta = stepMeta[step];
                const done = i <= stepIndex;
                const current = i === stepIndex;
                const stepDate = i === 0 ? order.placedAt : done ? shiftDate(order.placedAt, i) : null;
                const Icon = meta.icon;
                return (
                  <li key={step} className="relative pb-5 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-[var(--color-surface)] transition-colors",
                        done
                          ? "bg-[var(--color-brand-500)] text-white"
                          : "bg-[var(--color-surface-2)] text-subtle"
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                    </span>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[13.5px] font-semibold", !done && "text-muted")}>
                        {meta.label}
                      </p>
                      {current && <Chip tone="info">current</Chip>}
                    </div>
                    <p className="text-[12px] text-subtle mt-0.5">
                      {meta.description}
                      {stepDate && <span className="tabular-nums"> · {stepDate}</span>}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <aside className="space-y-6 min-w-0">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-subtle" />
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Shipping to
              </p>
            </div>
            <address className="not-italic text-[13px] leading-relaxed text-muted">
              <span className="font-semibold text-[var(--color-text)]">{order.customerName}</span>
              <br />
              {address.line1}
              <br />
              {address.city}, {address.region} {address.postal}
              <br />
              {address.country}
            </address>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={14} className="text-subtle" />
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Payment
              </p>
            </div>
            <p className="text-[13px]">
              Visa <span className="tabular-nums">•••• 4242</span>
            </p>
            <p className="text-[11.5px] text-subtle mt-1">Captured {order.placedAt}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
