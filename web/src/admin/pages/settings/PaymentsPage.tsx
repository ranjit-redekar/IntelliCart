import { useState } from "react";
import { CreditCard, Plus, RefreshCcw, Save, Shield, Wallet, Zap } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useSettings } from "../../lib/useSettings";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";

interface Gateway {
  id: string;
  name: string;
  brand: string;
  status: "connected" | "available";
  capture: string;
  fee: string;
}

interface PaymentsValue {
  payoutSchedule: string;
  statementDescriptor: string;
  gateways: Gateway[];
  reconRows: { id: string; date: string; amount: number; fee: number; method: string; status: "settled" | "pending" }[];
}

const TONES = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
];

export default function PaymentsPage() {
  const settings = useSettings<PaymentsValue>("payments");
  const gateways = settings.value?.gateways ?? [];
  const reconRows = settings.value?.reconRows ?? [];

  const [autoCapture, setAutoCapture] = useState(true);
  const [allow3DS, setAllow3DS] = useState(true);
  const [allowSaved, setAllowSaved] = useState(true);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!settings.value) return <Skeleton rows={4} />;

  return (
    <SettingsLayout
      title="Payments"
      subtitle="Connect gateways, control capture rules, and reconcile every rupee that lands in your accounts."
      icon={CreditCard}
      tone="var(--color-accent-mint)"
      actions={
        <button type="button" className="btn btn-primary btn-sm">
          <Save size={13} /> Save changes
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card interactive>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-brand-500)_14%,transparent)] text-[var(--color-brand-600)]">
              <Wallet size={16} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Captured this week</p>
              <p className="text-[22px] font-semibold tabular-nums">₹48,290</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-violet)_14%,transparent)] text-[var(--color-accent-violet)]">
              <RefreshCcw size={16} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Pending settlement</p>
              <p className="text-[22px] font-semibold tabular-nums">₹417</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-accent-mint)]">
              <Zap size={16} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Auth success rate</p>
              <p className="text-[22px] font-semibold tabular-nums">98.2%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-end justify-between gap-3">
          <CardHeader title="Gateways" subtitle="Connected and available providers" eyebrow="Providers" className="mb-0" />
          <button type="button" className="btn btn-soft btn-sm">
            <Plus size={13} /> Add gateway
          </button>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {gateways.map((g, gi) => (
            <li key={g.id} className="px-5 py-3.5 flex flex-wrap items-center gap-4">
              <span
                className="w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-[13px]"
                style={{ background: `color-mix(in oklab, ${TONES[gi % TONES.length]} 14%, transparent)`, color: TONES[gi % TONES.length] }}
              >
                {g.brand}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold">{g.name}</p>
                  {g.status === "connected" ? <Chip tone="success">Connected</Chip> : <Chip tone="neutral">Available</Chip>}
                </div>
                <p className="text-[12.5px] text-muted mt-0.5">
                  Capture: {g.capture} · Fee: {g.fee}
                </p>
              </div>
              <button
                type="button"
                className={g.status === "connected" ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
              >
                {g.status === "connected" ? "Configure" : "Connect"}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Capture policy" subtitle="When funds are taken" eyebrow="Rules" />
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Shield size={15} className="text-[var(--color-brand-500)] mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">Auto-capture on success</p>
                <p className="text-[12px] text-muted">Off = authorize only, capture later.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoCapture}
                data-on={autoCapture}
                onClick={() => setAutoCapture((v) => !v)}
                className="switch"
              />
            </li>
            <li className="flex items-start gap-3">
              <Shield size={15} className="text-[var(--color-brand-500)] mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">Require 3-D Secure</p>
                <p className="text-[12px] text-muted">Cuts fraud losses by ~38%.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allow3DS}
                data-on={allow3DS}
                onClick={() => setAllow3DS((v) => !v)}
                className="switch"
              />
            </li>
            <li className="flex items-start gap-3">
              <Shield size={15} className="text-[var(--color-brand-500)] mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">Allow saved cards</p>
                <p className="text-[12px] text-muted">Faster repeat checkout.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowSaved}
                data-on={allowSaved}
                onClick={() => setAllowSaved((v) => !v)}
                className="switch"
              />
            </li>
          </ul>
        </Card>

        <Card padded={false} className="overflow-hidden lg:col-span-2">
          <div className="p-5 pb-3">
            <CardHeader title="Recent reconciliation" subtitle="Settlements and pending captures" eyebrow="Ledger" className="mb-0" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-y border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-semibold">Txn</th>
                  <th className="px-5 py-2.5 font-semibold">Method</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Fee</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {reconRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold tabular-nums">{r.id}</td>
                    <td className="px-5 py-3 text-muted">{r.method}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">₹{r.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted">₹{r.fee}</td>
                    <td className="px-5 py-3">
                      {r.status === "settled" ? <Chip tone="success">Settled</Chip> : <Chip tone="pending">Pending</Chip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SettingsLayout>
  );
}
