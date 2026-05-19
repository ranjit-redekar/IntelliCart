import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowRight, Check, Mail, Package } from "lucide-react";
import { Card } from "../components/ui/Card";

interface ConfirmationState {
  name?: string;
  address?: string;
  city?: string;
  postal?: string;
  country?: string;
  total?: number;
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as ConfirmationState;

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
          {state.name ? ` to ${state.name}` : ""}.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 rounded-[12px] soft-surface">
          <Package size={16} className="text-subtle" />
          <div className="text-left">
            <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">
              Order number
            </p>
            <p className="text-[14.5px] font-semibold tabular-nums">{id}</p>
          </div>
          {state.total != null && (
            <div className="text-left ml-3 border-l border-[var(--color-border)] pl-3">
              <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em] font-semibold">
                Total
              </p>
              <p className="text-[14.5px] font-semibold tabular-nums">${state.total}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link to="/account/orders" className="btn btn-primary btn-sm">
            View orders <ArrowRight size={13} />
          </Link>
          <Link to="/shop" className="btn btn-ghost btn-sm">
            Keep shopping
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
    </div>
  );
}
