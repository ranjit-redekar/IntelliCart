import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

export default function CartPage() {
  const { expanded, subtotal, shipping, tax, total, count, update, remove, clear } = useCart();
  const toast = useToast();
  // shipping/tax/total are priced server-side — the client displays, it does
  // not compute. Three different and inconsistent formulas used to exist.

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
          Bag
        </p>
        <h1 className="font-display text-[28px] md:text-[34px] tracking-tight font-semibold mt-1">
          Your cart
        </h1>
        <p className="text-[13.5px] text-muted mt-1">
          {count === 0 ? "Empty" : `${count} ${count === 1 ? "item" : "items"}`}
        </p>
      </div>

      {expanded.length === 0 ? (
        <Card className="text-center py-16">
          <ShoppingBag size={28} className="mx-auto text-subtle mb-3" />
          <p className="font-semibold text-[15px]">Your cart is empty</p>
          <p className="text-[13px] text-muted mt-1">Start exploring to add pieces you love.</p>
          <Link to="/shop" className="btn btn-primary btn-sm mt-5 inline-flex">
            Shop now <ArrowRight size={13} />
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-[var(--color-border)]">
              {expanded.map((line) => {
                const accent = categoryAccent[line.categoryId] ?? "var(--color-brand-500)";
                const initials = line.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <li key={line.productId} className="p-4 flex items-start gap-4">
                    <Link
                      to={`/products/${line.productId}`}
                      className="w-20 h-20 rounded-[12px] shrink-0 flex items-center justify-center text-[20px] font-bold overflow-hidden"
                      style={{
                        background: `color-mix(in oklab, ${accent} 18%, var(--color-surface-2))`,
                        color: accent,
                      }}
                      aria-label={line.name}
                    >
                      {line.image ? (
                        <img src={line.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${line.productId}`}
                        className="text-[14px] font-semibold hover:text-[var(--color-brand-600)] truncate block"
                      >
                        {line.name}
                      </Link>
                      <p className="text-[12px] text-subtle mt-0.5">
                        {line.category} · ${line.price} each
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="inline-flex items-center border border-[var(--color-border)] rounded-[10px] overflow-hidden">
                          <button
                            type="button"
                            className="px-2 py-1 hover:bg-[var(--color-surface-2)]"
                            onClick={() => update(line.productId, line.qty - 1)}
                            aria-label="Decrease"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2.5 text-[12.5px] font-semibold tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            className="px-2 py-1 hover:bg-[var(--color-surface-2)]"
                            onClick={() => update(line.productId, line.qty + 1)}
                            aria-label="Increase"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            remove(line.productId);
                            toast(`${line.name} removed from cart`);
                          }}
                          className="btn btn-icon btn-sm btn-ghost text-subtle hover:text-[var(--color-accent-rose)]"
                          aria-label="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[14.5px] font-semibold tabular-nums">${line.lineTotal}</p>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-[var(--color-border)] p-4 flex items-center justify-between">
              <button
                type="button"
                onClick={clear}
                className="text-[12px] text-muted hover:text-[var(--color-accent-rose)]"
              >
                Clear cart
              </button>
              <Link to="/shop" className="text-[12px] font-semibold text-[var(--color-brand-600)] hover:underline">
                Continue shopping →
              </Link>
            </div>
          </Card>

          <div>
            <Card>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Summary
              </p>
              <dl className="mt-3 space-y-2 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">${subtotal}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="tabular-nums">
                    {shipping === 0 ? "Free" : `$${shipping}`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Tax (8%)</dt>
                  <dd className="tabular-nums">${tax}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--color-border)] mt-2">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-semibold tabular-nums text-[16px]">${total}</dd>
                </div>
              </dl>
              <Link to="/checkout" className="btn btn-primary w-full justify-center mt-4">
                Checkout <ArrowRight size={13} />
              </Link>
              <p className="text-[11.5px] text-subtle text-center mt-3">
                Free shipping over $50 · 30-day returns
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
