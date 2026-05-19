import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Hourglass,
  Mail,
  MapPin,
  Package,
  Printer,
  RefreshCcw,
  Truck,
} from "lucide-react";
import { customers, orders } from "../mockdata";
import type { OrderStatus } from "../types";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip, StatusChip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import NotFoundPage from "./NotFoundPage";
import { deriveLineItems, hashString } from "../lib/orderDetails";
import { cn } from "../lib/cn";

const stepOrder: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const stepMeta: Record<OrderStatus, { label: string; icon: typeof Hourglass; description: string }> = {
  pending: { label: "Order placed", icon: Hourglass, description: "Awaiting fulfillment" },
  processing: { label: "Processing", icon: Package, description: "Picking and packing" },
  shipped: { label: "Shipped", icon: Truck, description: "On the way to customer" },
  delivered: { label: "Delivered", icon: CheckCircle2, description: "Marked complete" },
};

const addressPool = [
  { line1: "121 Marine Drive", city: "Mumbai", region: "MH", postal: "400020", country: "India" },
  { line1: "48 Carmine Street", city: "New York", region: "NY", postal: "10014", country: "USA" },
  { line1: "9 Rue de Rivoli", city: "Paris", region: "ÎDF", postal: "75004", country: "France" },
  { line1: "18 Shoreditch High St", city: "London", region: "—", postal: "E1 6PJ", country: "UK" },
  { line1: "3-4 Aoyama 5-chōme", city: "Tokyo", region: "—", postal: "107-0062", country: "Japan" },
  { line1: "240 Smith Street", city: "Melbourne", region: "VIC", postal: "3066", country: "Australia" },
];

const paymentMethods = [
  { brand: "Visa", last4: "4242" },
  { brand: "Mastercard", last4: "1928" },
  { brand: "Amex", last4: "3055" },
  { brand: "UPI", last4: "@hdfc" },
];

function deriveAddress(name: string) {
  const seed = hashString(name);
  return addressPool[seed % addressPool.length];
}

function derivePayment(name: string) {
  const seed = hashString(name);
  return paymentMethods[(seed >> 3) % paymentMethods.length];
}

function shiftDate(iso: string, deltaDays: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useMemo(() => orders.find((o) => o.id === id), [id]);

  if (!order) return <NotFoundPage />;

  const { items, shipping, tax, subtotal, adjustment } = deriveLineItems(order.id, order.total);
  const address = deriveAddress(order.customerName);
  const payment = derivePayment(order.customerName);
  const customer = customers.find((c) => c.name === order.customerName);
  const currentStepIndex = stepOrder.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to orders
        </Link>
      </div>

      <PageHeader
        eyebrow={`Order · placed ${order.placedAt}`}
        title={
          <span className="inline-flex items-center gap-3 tabular-nums">
            {order.id} <StatusChip status={order.status} />
          </span>
        }
        description={`Total $${order.total} · ${items.length} item${items.length === 1 ? "" : "s"} · Paid with ${payment.brand} ${payment.last4}`}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm">
              <Printer size={14} /> Print
            </button>
            <button type="button" className="btn btn-ghost btn-sm">
              <RefreshCcw size={14} /> Refund
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Truck size={14} />
              {order.status === "delivered"
                ? "Reship"
                : order.status === "shipped"
                ? "Mark delivered"
                : order.status === "processing"
                ? "Mark shipped"
                : "Start processing"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 fade-up-stagger">
        <div className="space-y-6 min-w-0">
          <Card padded={false} className="overflow-hidden">
            <CardHeader
              eyebrow="Items"
              title="Line items"
              subtitle={`${items.length} product${items.length === 1 ? "" : "s"} in this order`}
              className="px-5 pt-5"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-b border-[var(--color-border)]">
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold text-right">Unit</th>
                    <th className="px-5 py-3 font-semibold text-right">Qty</th>
                    <th className="px-5 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.sku}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[12px] font-bold bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                            <Package size={14} />
                          </span>
                          <div>
                            <p className="font-semibold">{it.name}</p>
                            <p className="text-[11.5px] text-subtle">{it.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">${it.unitPrice}</td>
                      <td className="px-5 py-3 text-right tabular-nums">×{it.qty}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">
                        ${it.qty * it.unitPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <dt className="text-muted">Tax (8%)</dt>
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
                  <dt className="font-semibold">Order total</dt>
                  <dd className="font-semibold tabular-nums text-[15px]">${order.total}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Fulfillment" title="Timeline" subtitle="Current progress through the pipeline" />
            <ol className="relative pl-7">
              <span
                className="absolute left-3 top-2 bottom-2 w-px bg-[var(--color-border)]"
                aria-hidden
              />
              {stepOrder.map((step, i) => {
                const meta = stepMeta[step];
                const done = i <= currentStepIndex;
                const current = i === currentStepIndex;
                const stepDate =
                  i === 0
                    ? order.placedAt
                    : done
                    ? shiftDate(order.placedAt, i)
                    : null;
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
                      <p
                        className={cn(
                          "text-[13.5px] font-semibold",
                          !done && "text-muted"
                        )}
                      >
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
            <CardHeader eyebrow="Customer" title="Buyer" />
            <div className="flex items-center gap-3">
              <Avatar name={order.customerName} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold truncate">{order.customerName}</p>
                {customer ? (
                  <p className="text-[12px] text-subtle truncate">{customer.email}</p>
                ) : (
                  <p className="text-[12px] text-subtle">Guest checkout</p>
                )}
              </div>
            </div>
            {customer && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Lifetime orders</span>
                  <span className="font-semibold tabular-nums">{customer.orders}</span>
                </div>
                <Link
                  to={`/customers/${customer.id}`}
                  className="btn btn-soft btn-sm w-full justify-center"
                >
                  View customer
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader eyebrow="Shipping" title="Address" action={<MapPin size={14} className="text-subtle" />} />
            <address className="not-italic text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              <p className="font-semibold text-[var(--color-text)]">{order.customerName}</p>
              <p>{address.line1}</p>
              <p>
                {address.city}
                {address.region !== "—" ? `, ${address.region}` : ""} {address.postal}
              </p>
              <p>{address.country}</p>
            </address>
          </Card>

          <Card>
            <CardHeader eyebrow="Payment" title="Method" action={<CreditCard size={14} className="text-subtle" />} />
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px] font-semibold tracking-[0.04em]">
                {payment.brand}
              </span>
              <span className="text-[13px] tabular-nums">•••• {payment.last4}</span>
            </div>
            <p className="text-[11.5px] text-subtle mt-2">Captured on {order.placedAt}</p>
          </Card>

          <Card>
            <CardHeader eyebrow="Contact" title="Reach out" action={<Mail size={14} className="text-subtle" />} />
            <button type="button" className="btn btn-ghost btn-sm w-full justify-center">
              <Mail size={13} /> Email customer
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
