import { useEffect, useState } from "react";
import { Clock, MapPin, Package, Plus, Save, Truck } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useSettings } from "../../lib/useSettings";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { toast } from "../../../lib/toast";

interface Zone {
  id: string;
  name: string;
  countries: string;
  carriers: string[];
  free: number;
  sla: string;
}

interface ShippingValue {
  freeOver: number;
  flatRate: number;
  taxRate: number;
  zones: Zone[];
  taxClasses: { id: string; name: string; rate: number; applied: string }[];
  includeTax: boolean;
  autoTax: boolean;
}

const DEFAULTS = { includeTax: true, autoTax: true };

// Accents are presentation; the rows come from the database.
const TONES = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-sky)",
  "var(--color-accent-mint)",
];

export default function ShippingTaxPage() {
  const settings = useSettings<ShippingValue>("shipping");

  useEffect(() => {
    if (settings.saved) toast("Settings saved", "success");
  }, [settings.saved]);
  useEffect(() => {
    if (settings.saveError) toast(settings.saveError);
  }, [settings.saveError]);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!settings.value) return <Skeleton rows={4} />;
  return <ShippingTaxForm value={settings.value} save={settings.save} saving={settings.saving} />;
}

interface FormProps {
  value: ShippingValue;
  save: (value: Partial<ShippingValue>) => Promise<void>;
  saving: boolean;
}

function ShippingTaxForm({ value, save, saving }: FormProps) {
  const initial = { ...DEFAULTS, ...value };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const toggle = (k: keyof typeof DEFAULTS) => setForm((f) => ({ ...f, [k]: !f[k] }));
  const { zones, taxClasses } = form;

  return (
    <SettingsLayout
      title="Shipping & tax"
      subtitle="Delivery zones, carrier coverage, fulfillment SLAs, and tax classes — keep checkout calculations crisp."
      icon={Truck}
      tone="var(--color-accent-violet)"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card interactive>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-brand-500)_14%,transparent)] text-[var(--color-brand-600)]">
              <MapPin size={16} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Delivery zones</p>
              <p className="text-[22px] font-semibold tabular-nums">{zones.length}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-violet)_14%,transparent)] text-[var(--color-accent-violet)]">
              <Package size={16} />
            </span>
            <div>
              <p className="text-[12px] text-muted">Avg. fulfillment</p>
              <p className="text-[22px] font-semibold tabular-nums">14h</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-success-text)]">
              <Clock size={16} />
            </span>
            <div>
              <p className="text-[12px] text-muted">On-time delivery</p>
              <p className="text-[22px] font-semibold tabular-nums">96.4%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-end justify-between gap-3">
          <CardHeader title="Delivery zones" subtitle="Pricing rules and SLAs per region" eyebrow="Shipping" className="mb-0" />
          <button type="button" className="btn btn-soft btn-sm" disabled title="Coming soon">
            <Plus size={13} /> Add zone
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-y border-[var(--color-border)]">
                <th className="px-5 py-2.5 font-semibold">Zone</th>
                <th className="px-5 py-2.5 font-semibold">Carriers</th>
                <th className="px-5 py-2.5 font-semibold">Free above</th>
                <th className="px-5 py-2.5 font-semibold">SLA</th>
                <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z, zi) => (
                <tr
                  key={z.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                        style={{ background: `color-mix(in oklab, ${TONES[zi % TONES.length]} 14%, transparent)`, color: TONES[zi % TONES.length] }}
                      >
                        <MapPin size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{z.name}</p>
                        <p className="text-[11.5px] text-subtle truncate max-w-xs">{z.countries}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {z.carriers.map((c) => (
                        <Chip key={c} tone="neutral">
                          {c}
                        </Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 tabular-nums font-medium">₹{z.free.toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted">{z.sla}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="btn btn-ghost btn-sm" disabled title="Coming soon">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padded={false} className="overflow-hidden lg:col-span-2">
          <div className="p-5 pb-3 flex items-end justify-between gap-3">
            <CardHeader title="Tax classes" subtitle="Per-category tax rates" eyebrow="Tax" className="mb-0" />
            <button type="button" className="btn btn-soft btn-sm" disabled title="Coming soon">
              <Plus size={13} /> Add class
            </button>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {taxClasses.map((t, ti) => (
              <li key={t.id} className="px-5 py-3.5 flex items-center gap-4">
                <span
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center font-bold tabular-nums"
                  style={{ background: `color-mix(in oklab, ${TONES[ti % TONES.length]} 14%, transparent)`, color: TONES[ti % TONES.length] }}
                >
                  {t.rate}%
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{t.name}</p>
                  <p className="text-[12.5px] text-muted">{t.applied}</p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" disabled title="Coming soon">
                  Configure
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Display rules" subtitle="Storefront tax behavior" eyebrow="Checkout" />
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">Show prices tax-inclusive</p>
                <p className="text-[12px] text-muted">Recommended for B2C in India and EU.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.includeTax}
                data-on={form.includeTax}
                onClick={() => toggle("includeTax")}
                className="switch"
              />
            </li>
            <li className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">Auto-calculate tax by region</p>
                <p className="text-[12px] text-muted">Use the buyer's shipping address.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.autoTax}
                data-on={form.autoTax}
                onClick={() => toggle("autoTax")}
                className="switch"
              />
            </li>
          </ul>
        </Card>
      </div>
    </SettingsLayout>
  );
}
