import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useCart } from "../lib/cart";
import { useSession } from "../lib/session";
import { cn } from "../lib/cn";
import { api, ApiError } from "../../lib/api";

type Step = "shipping" | "payment" | "review";

const steps: { id: Step; label: string }[] = [
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { expanded, subtotal, shipping, tax, total, refresh } = useCart();
  const [step, setStep] = useState<Step>("shipping");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("121 Marine Drive");
  const [city, setCity] = useState("Mumbai");
  const [postal, setPostal] = useState("400020");
  const [country, setCountry] = useState("India");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");

  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  // One idempotency key per checkout attempt, generated when the page mounts.
  // A double-click or a retry after a dropped response returns the original
  // order instead of charging twice.
  const [idempotencyKey] = useState(
    () => `co-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  );

  if (expanded.length === 0) {
    return (
      <Card className="text-center py-16">
        <p className="font-semibold text-[15px]">Your cart is empty</p>
        <p className="text-[13px] text-muted mt-1">Add an item before checking out.</p>
        <Link to="/shop" className="btn btn-primary btn-sm mt-5 inline-flex">
          Shop now
        </Link>
      </Card>
    );
  }

  function next() {
    if (step === "shipping") setStep("payment");
    else if (step === "payment") setStep("review");
  }

  interface PlacedOrder {
    id: string;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (placing) return;
    setPlacing(true);
    setOrderError(null);
    try {
      // The order id comes back from the database. It used to be invented in
      // the browser and passed through router state, so a refresh lost it.
      const order = await api.post<PlacedOrder>(
        "/checkout",
        {
          name,
          line1: address,
          city,
          postal,
          country: country || "US",
          paymentMethod: "card",
        },
        { "Idempotency-Key": idempotencyKey },
      );
      await refresh();
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/sign-in", { state: { from: "/checkout" } });
        return;
      }
      // 409 is the useful one: something sold out while they were filling the
      // form. Say so and send them back to the cart to adjust.
      setOrderError(
        err instanceof ApiError ? err.message : "Could not place your order. Try again.",
      );
      await refresh();
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={14} /> Back to cart
      </Link>
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
          Checkout
        </p>
        <h1 className="font-display text-[28px] md:text-[34px] tracking-tight font-semibold mt-1">
          Complete your order
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const active = s.id === step;
          const done = steps.findIndex((x) => x.id === step) > i;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold",
                  done
                    ? "bg-[var(--color-accent-mint)] text-white"
                    : active
                    ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)]"
                    : "bg-[var(--color-surface-2)] text-subtle"
                )}
              >
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[12.5px] font-semibold",
                  !active && !done && "text-subtle"
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6 min-w-0">
          {step === "shipping" && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={15} className="text-subtle" />
                <h2 className="text-[15px] font-semibold">Shipping address</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Full name" required>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
                <Field label="Email" required>
                  <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Field>
                <Field label="Address" className="md:col-span-2" required>
                  <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </Field>
                <Field label="City" required>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
                </Field>
                <Field label="Postal code" required>
                  <input className="input" value={postal} onChange={(e) => setPostal(e.target.value)} required />
                </Field>
                <Field label="Country" required>
                  <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} required />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={next}
                  disabled={!name || !email || !address || !city || !postal}
                  className="btn btn-primary"
                >
                  Continue to payment
                </button>
              </div>
            </Card>
          )}

          {step === "payment" && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={15} className="text-subtle" />
                <h2 className="text-[15px] font-semibold">Payment</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Name on card" className="md:col-span-2" required>
                  <input className="input" value={cardName} onChange={(e) => setCardName(e.target.value)} required />
                </Field>
                <Field label="Card number" className="md:col-span-2" required>
                  <input
                    className="input tabular-nums"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Expiry" required>
                  <input className="input tabular-nums" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
                </Field>
                <Field label="CVV" required>
                  <input className="input tabular-nums" value={cvv} onChange={(e) => setCvv(e.target.value)} required />
                </Field>
              </div>
              <p className="mt-3 text-[11.5px] text-subtle inline-flex items-center gap-1.5">
                <ShieldCheck size={12} /> Demo only — no real payment is processed.
              </p>
              <div className="mt-5 flex items-center justify-between">
                <button type="button" onClick={() => setStep("shipping")} className="btn btn-ghost">
                  Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={!cardName || !cardNumber || !expiry || !cvv}
                  className="btn btn-primary"
                >
                  Review order
                </button>
              </div>
            </Card>
          )}

          {step === "review" && (
            <Card className="space-y-5">
              <h2 className="text-[15px] font-semibold">Review your order</h2>
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  Shipping to
                </p>
                <address className="not-italic text-[13px] mt-1.5 leading-relaxed text-muted">
                  <span className="text-[var(--color-text)] font-semibold">{name}</span>
                  <br />
                  {address}, {city}
                  <br />
                  {postal}, {country}
                </address>
              </div>
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  Paying with
                </p>
                <p className="text-[13px] mt-1.5 tabular-nums">
                  •••• {cardNumber.replace(/\s/g, "").slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  Items
                </p>
                <ul className="mt-2 text-[13px] divide-y divide-[var(--color-border)]">
                  {expanded.map((l) => (
                    <li key={l.productId} className="py-2 flex justify-between">
                      <span>
                        {l.name} <span className="text-subtle">× {l.qty}</span>
                      </span>
                      <span className="tabular-nums">${l.lineTotal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {orderError && (
                <p
                  role="alert"
                  className="text-[13px] rounded-[10px] px-3 py-2.5"
                  style={{
                    color: "var(--color-accent-rose)",
                    background: "color-mix(in oklab, var(--color-accent-rose) 10%, transparent)",
                  }}
                >
                  {orderError}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setStep("payment")} className="btn btn-ghost">
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={placing}>
                  {placing ? "Placing order…" : `Place order · $${total}`}
                </button>
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Order summary
            </p>
            <ul className="mt-3 space-y-1.5 text-[13px]">
              {expanded.map((l) => (
                <li key={l.productId} className="flex justify-between">
                  <span className="truncate pr-2">
                    {l.name} <span className="text-subtle">× {l.qty}</span>
                  </span>
                  <span className="tabular-nums">${l.lineTotal}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 text-[13px] border-t border-[var(--color-border)] pt-3">
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
              <div className="flex justify-between pt-2 border-t border-[var(--color-border)] mt-1">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums text-[15px]">${total}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[12.5px] font-semibold flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-accent-rose)]">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
