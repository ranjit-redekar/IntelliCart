import { useState } from "react";
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
import type { OrderStatus } from "../types";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip, StatusChip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import NotFoundPage from "./NotFoundPage";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import { reportWrite } from "../../lib/toast";

interface AdminOrderDetail {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  placedAt: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: { productId: string | null; sku: string; name: string; qty: number; unitPrice: number }[];
  address: { name: string; line1: string; city: string; postal: string; country: string };
  timeline: { status: string; at: string; note: string | null }[];
  payment: { method: string; brand: string | null; last4: string | null; amount: number; status: string } | null;
}
import { cn } from "../lib/cn";

const stepOrder: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const stepMeta: Record<OrderStatus, { label: string; icon: typeof Hourglass; description: string }> = {
  pending: { label: "Order placed", icon: Hourglass, description: "Awaiting fulfillment" },
  processing: { label: "Processing", icon: Package, description: "Picking and packing" },
  shipped: { label: "Shipped", icon: Truck, description: "On the way to customer" },
  delivered: { label: "Delivered", icon: CheckCircle2, description: "Marked complete" },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useApi(() => api.get<AdminOrderDetail>(`/admin/orders/${id}`), [id]);
  const [advancing, setAdvancing] = useState(false);
  const [refunding, setRefunding] = useState<"idle" | "confirm" | "busy">("idle");
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [mail, setMail] = useState<{ subject: string; body: string; busy: boolean } | null>(null);

  if (state.loading && !state.data) return <Skeleton rows={5} />;
  if (state.error?.status === 404) return <NotFoundPage />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  const order = state.data;
  if (!order) return <NotFoundPage />;

  // All of this was invented at render time: line items from a hash of the
  // order id, address from a six-entry pool, payment brand from a four-entry
  // pool, and an `adjustment` plug figure to make the sums agree.
  const { items, shipping, tax, subtotal, address } = order;
  const payment = order.payment ?? { brand: "—", last4: "", method: "—", amount: order.total, status: "—" };
  const customer = { id: order.customerId, name: order.customerName };
  const currentStepIndex = stepOrder.indexOf(order.status);
  const nextStatus = stepOrder[currentStepIndex + 1];
  const refunded = order.payment?.status === "refunded";
  const refundNote = [...order.timeline].reverse().find((t) => t.note?.startsWith("Refunded"));

  async function advance() {
    if (!nextStatus) return;
    setAdvancing(true);
    await reportWrite(
      api.patch(`/admin/orders/${order!.id}/status`, { status: nextStatus }),
      `Order marked ${nextStatus}`,
    );
    setAdvancing(false);
    state.reload();
  }

  async function refund(e: React.FormEvent) {
    e.preventDefault();
    setRefunding("busy");
    const ok = await reportWrite(
      api.post(`/admin/orders/${order!.id}/refund`, { reason: reason.trim() || undefined, restock }),
      "Order refunded",
    );
    setRefunding(ok ? "idle" : "confirm");
    if (ok) state.reload();
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!mail) return;
    setMail({ ...mail, busy: true });
    const ok = await reportWrite(
      api.post(`/admin/orders/${order!.id}/email`, { subject: mail.subject, body: mail.body }),
      "Email queued",
    );
    setMail(ok ? null : { ...mail, busy: false });
    if (ok) state.reload();
  }

  const notes = order.timeline.filter((t) => t.note);

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
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
            <span className="break-all">{order.id}</span> <StatusChip status={order.status} />
            {refunded && <Chip tone="danger">Refunded</Chip>}
          </span>
        }
        description={`Total $${order.total} · ${items.length} item${items.length === 1 ? "" : "s"} · Paid with ${payment.brand} ${payment.last4}`}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={refunded || !order.payment || refunding !== "idle"}
              title={refunded ? "Already refunded" : !order.payment ? "No payment to refund" : undefined}
              onClick={() => setRefunding("confirm")}
            >
              <RefreshCcw size={14} /> {refunded ? "Refunded" : "Refund"}
            </button>
            {nextStatus && (
              <button type="button" className="btn btn-primary btn-sm" onClick={advance} disabled={advancing}>
                <Truck size={14} />
                {nextStatus === "delivered"
                  ? "Mark delivered"
                  : nextStatus === "shipped"
                  ? "Mark shipped"
                  : "Start processing"}
              </button>
            )}
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
                  <dt className="text-muted">Tax</dt>
                  <dd className="tabular-nums">${tax}</dd>
                </div>
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
                    ? (order.timeline.find((t) => t.status === step)?.at.slice(0, 10) ?? null)
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
            {notes.length > 0 && (
              <ul className="mt-4 pt-3 border-t border-[var(--color-border)] space-y-1.5 text-[12.5px]">
                {notes.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="tabular-nums text-subtle shrink-0">{t.at.slice(0, 10)}</span>
                    <span className="break-words min-w-0">{t.note}</span>
                  </li>
                ))}
              </ul>
            )}
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
                  <p className="text-[12px] text-subtle truncate">Customer {customer.id}</p>
                ) : (
                  <p className="text-[12px] text-subtle">Guest checkout</p>
                )}
              </div>
            </div>
            {customer && (
              <div className="mt-4 space-y-2">
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
                {" "}{address.postal}
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
              {order.payment && (
                <Chip tone={refunded ? "danger" : order.payment.status === "captured" ? "success" : "info"}>
                  {order.payment.status}
                </Chip>
              )}
            </div>
            {refunded ? (
              <p className="text-[11.5px] text-subtle mt-2">
                ${payment.amount} refunded{refundNote && ` on ${refundNote.at.slice(0, 10)} · ${refundNote.note}`}
              </p>
            ) : order.payment?.status === "authorized" ? (
              <p className="text-[11.5px] text-subtle mt-2">Authorized on {order.placedAt} · captured when shipped</p>
            ) : null}
            {refunding !== "idle" && !refunded && (
              <form onSubmit={refund} className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-3">
                <p className="text-[13px] font-semibold">Refund ${payment.amount} in full?</p>
                <label className="block text-[12px] text-muted">
                  Reason (optional)
                  <input
                    className="input mt-1 w-full"
                    value={reason}
                    maxLength={200}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                  />
                </label>
                <label className="flex items-center gap-2 text-[12.5px]">
                  <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
                  Return items to stock
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={refunding === "busy"}>
                    Confirm refund
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRefunding("idle")}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </Card>

          <Card>
            <CardHeader eyebrow="Contact" title="Reach out" action={<Mail size={14} className="text-subtle" />} />
            {mail ? (
              <form onSubmit={sendEmail} className="space-y-3" aria-label="Email customer">
                <label className="block text-[12px] text-muted">
                  Subject
                  <input
                    className="input mt-1 w-full"
                    value={mail.subject}
                    maxLength={150}
                    required
                    onChange={(e) => setMail({ ...mail, subject: e.target.value })}
                  />
                </label>
                <label className="block text-[12px] text-muted">
                  Message
                  <textarea
                    className="input mt-1 w-full min-h-[120px]"
                    value={mail.body}
                    maxLength={5000}
                    required
                    autoFocus
                    onChange={(e) => setMail({ ...mail, body: e.target.value })}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={mail.busy || !mail.subject.trim() || !mail.body.trim()}
                  >
                    Send
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMail(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm w-full justify-center"
                onClick={() => setMail({ subject: `About your order ${order.id}`, body: "", busy: false })}
              >
                <Mail size={13} /> Email customer
              </button>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
