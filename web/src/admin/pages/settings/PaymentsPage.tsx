import { useEffect, useId, useState, type ReactNode } from "react";
import { CreditCard, Plus, RefreshCcw, Save, Shield, Trash2, Wallet, Zap } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useSettings } from "../../lib/useSettings";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { toast } from "../../../lib/toast";

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
  autoCapture: boolean;
  require3DS: boolean;
  allowSavedCards: boolean;
}

const CAPTURE_MODES = ["Automatic", "Manual"];

type Draft = Pick<Gateway, "name" | "brand" | "capture" | "fee">;
const EMPTY_DRAFT: Draft = { name: "", brand: "", capture: "Automatic", fee: "" };

const DEFAULTS = { autoCapture: true, require3DS: true, allowSavedCards: true };

const TONES = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
];

export default function PaymentsPage() {
  const settings = useSettings<PaymentsValue>("payments");

  useEffect(() => {
    if (settings.saved) toast("Settings saved", "success");
  }, [settings.saved]);
  useEffect(() => {
    if (settings.saveError) toast(settings.saveError);
  }, [settings.saveError]);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!settings.value) return <Skeleton rows={4} />;
  return <PaymentsForm value={settings.value} save={settings.save} saving={settings.saving} />;
}

interface FormProps {
  value: PaymentsValue;
  save: (value: Partial<PaymentsValue>) => Promise<void>;
  saving: boolean;
}

function PaymentsForm({ value, save, saving }: FormProps) {
  const initial = { ...DEFAULTS, ...value };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const toggle = (k: keyof typeof DEFAULTS) => setForm((f) => ({ ...f, [k]: !f[k] }));
  const { gateways, reconRows } = form;
  // null = closed, "new" = add form, otherwise the id of the gateway being configured
  const [editing, setEditing] = useState<string | null>(null);
  const setGateways = (fn: (g: Gateway[]) => Gateway[]) => setForm((f) => ({ ...f, gateways: fn(f.gateways) }));
  const patch = (id: string, p: Partial<Gateway>) => setGateways((gs) => gs.map((g) => (g.id === id ? { ...g, ...p } : g)));

  return (
    <SettingsLayout
      title="Payments"
      subtitle="Connect gateways, control capture rules, and reconcile every rupee that lands in your accounts."
      icon={CreditCard}
      tone="var(--color-accent-mint)"
      actions={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!dirty || saving}
          onClick={() => save(form)}
        >
          <Save size={13} /> {saving ? "Saving…" : "Save changes"}
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
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-success-text)]">
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
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-expanded={editing === "new"}
            onClick={() => setEditing(editing === "new" ? null : "new")}
          >
            <Plus size={13} /> Add gateway
          </button>
        </div>
        {editing === "new" && (
          <div className="px-5 pb-4">
            <GatewayEditor
              initial={EMPTY_DRAFT}
              full
              taken={gateways.map((g) => g.name.toLowerCase())}
              onCancel={() => setEditing(null)}
              onApply={(d) => {
                const base = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gateway";
                const ids = new Set(gateways.map((g) => g.id));
                let id = base;
                for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
                setGateways((gs) => [...gs, { id, ...d, status: "available" }]);
                setEditing(null);
              }}
            />
          </div>
        )}
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-expanded={editing === g.id}
                  onClick={() => setEditing(editing === g.id ? null : g.id)}
                >
                  Configure
                </button>
                {g.status === "available" && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Remove ${g.name}`}
                    title={`Remove ${g.name}`}
                    onClick={() => {
                      if (!window.confirm(`Remove ${g.name}? It disappears once you save.`)) return;
                      setGateways((gs) => gs.filter((x) => x.id !== g.id));
                      if (editing === g.id) setEditing(null);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  type="button"
                  className={g.status === "connected" ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
                  onClick={() => patch(g.id, { status: g.status === "connected" ? "available" : "connected" })}
                >
                  {g.status === "connected" ? "Disconnect" : "Connect"}
                </button>
              </div>
              {editing === g.id && (
                <GatewayEditor
                  initial={{ name: g.name, brand: g.brand, capture: g.capture, fee: g.fee }}
                  full={false}
                  taken={[]}
                  onCancel={() => setEditing(null)}
                  onApply={(d) => {
                    patch(g.id, { capture: d.capture, fee: d.fee });
                    setEditing(null);
                  }}
                />
              )}
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
                aria-checked={form.autoCapture}
                data-on={form.autoCapture}
                onClick={() => toggle("autoCapture")}
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
                aria-checked={form.require3DS}
                data-on={form.require3DS}
                onClick={() => toggle("require3DS")}
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
                aria-checked={form.allowSavedCards}
                data-on={form.allowSavedCards}
                onClick={() => toggle("allowSavedCards")}
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

type FieldA11y = { "aria-invalid": boolean; "aria-describedby"?: string };

function Field({ label, error, children }: { label: string; error?: string; children: (a11y: FieldA11y) => ReactNode }) {
  const id = useId();
  return (
    <label className="block">
      <span className="block text-[12px] text-muted mb-1">{label}</span>
      {children({ "aria-invalid": !!error, "aria-describedby": error ? id : undefined })}
      {error && (
        <span id={id} className="block text-[12px] text-[var(--color-accent-rose)] mt-1">
          {error}
        </span>
      )}
    </label>
  );
}

/** Inline add/configure form. `full` = new gateway (name + brand editable). */
function GatewayEditor({
  initial,
  full,
  taken,
  onApply,
  onCancel,
}: {
  initial: Draft;
  full: boolean;
  taken: string[];
  onApply: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState(initial);
  const [tried, setTried] = useState(false);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (full) {
    if (!d.name.trim()) errors.name = "Name is required.";
    else if (taken.includes(d.name.trim().toLowerCase())) errors.name = "A gateway with this name already exists.";
    if (!d.brand.trim()) errors.brand = "Brand code is required.";
    else if (d.brand.trim().length > 4) errors.brand = "Use at most 4 characters.";
  }
  if (!d.fee.trim()) errors.fee = "Fee is required.";
  const shown = tried ? errors : {};

  return (
    <form
      noValidate
      className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3 items-start"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (Object.keys(errors).length) return;
        onApply({ name: d.name.trim(), brand: d.brand.trim().toUpperCase(), capture: d.capture, fee: d.fee.trim() });
      }}
    >
      {full && (
        <>
          <Field label="Name" error={shown.name}>
            {(a) => <input {...a} className="input h-10" autoFocus value={d.name} onChange={set("name")} />}
          </Field>
          <Field label="Brand code" error={shown.brand}>
            {(a) => <input {...a} className="input h-10" maxLength={4} value={d.brand} onChange={set("brand")} />}
          </Field>
        </>
      )}
      <Field label="Capture mode">
        {(a) => (
          <select {...a} className="input h-10" autoFocus={!full} value={d.capture} onChange={set("capture")}>
            {[...new Set([...CAPTURE_MODES, d.capture])].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Fee" error={shown.fee}>
        {(a) => <input {...a} className="input h-10" placeholder="2.9% + 30¢" value={d.fee} onChange={set("fee")} />}
      </Field>
      <div className="sm:col-span-4 flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm">
          {full ? "Add gateway" : "Apply"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
