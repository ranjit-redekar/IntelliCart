import { useState } from "react";
import { Clock, MapPin, Package, Plus, Save, Truck } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";

interface Zone {
  id: string;
  name: string;
  countries: string;
  carriers: string[];
  free: number;
  sla: string;
  tone: string;
}

const zones: Zone[] = [
  { id: "z1", name: "India · Metro", countries: "Mumbai, Delhi, Bengaluru, +5", carriers: ["Delhivery", "Shadowfax"], free: 999, sla: "1-2 days", tone: "var(--color-brand-500)" },
  { id: "z2", name: "India · Rest", countries: "All other PIN codes", carriers: ["Delhivery", "Bluedart"], free: 1499, sla: "3-5 days", tone: "var(--color-accent-violet)" },
  { id: "z3", name: "International · Asia", countries: "Japan, Singapore, UAE", carriers: ["DHL Express"], free: 7500, sla: "5-7 days", tone: "var(--color-accent-sky)" },
  { id: "z4", name: "International · West", countries: "US, UK, EU", carriers: ["FedEx", "DHL"], free: 12000, sla: "7-10 days", tone: "var(--color-accent-mint)" },
];

const taxClasses = [
  { id: "t1", name: "Standard goods", rate: 18, applied: "All categories by default", tone: "var(--color-brand-500)" },
  { id: "t2", name: "Apparel", rate: 12, applied: "Fashion category", tone: "var(--color-accent-violet)" },
  { id: "t3", name: "Electronics", rate: 18, applied: "Electronics category", tone: "var(--color-accent-sky)" },
  { id: "t4", name: "Reduced", rate: 5, applied: "Essentials and books", tone: "var(--color-accent-mint)" },
];

export default function ShippingTaxPage() {
  const [includeTax, setIncludeTax] = useState(true);
  const [autoTax, setAutoTax] = useState(true);

  return (
    <SettingsLayout
      title="Shipping & tax"
      subtitle="Delivery zones, carrier coverage, fulfillment SLAs, and tax classes — keep checkout calculations crisp."
      icon={Truck}
      tone="var(--color-accent-violet)"
      actions={
        <button type="button" className="btn btn-primary btn-sm">
          <Save size={13} /> Save changes
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
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-accent-mint)]">
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
          <button type="button" className="btn btn-soft btn-sm">
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
              {zones.map((z) => (
                <tr
                  key={z.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                        style={{ background: `color-mix(in oklab, ${z.tone} 14%, transparent)`, color: z.tone }}
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
                    <button type="button" className="btn btn-ghost btn-sm">
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
            <button type="button" className="btn btn-soft btn-sm">
              <Plus size={13} /> Add class
            </button>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {taxClasses.map((t) => (
              <li key={t.id} className="px-5 py-3.5 flex items-center gap-4">
                <span
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center font-bold tabular-nums"
                  style={{ background: `color-mix(in oklab, ${t.tone} 14%, transparent)`, color: t.tone }}
                >
                  {t.rate}%
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{t.name}</p>
                  <p className="text-[12.5px] text-muted">{t.applied}</p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm">
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
                aria-checked={includeTax}
                data-on={includeTax}
                onClick={() => setIncludeTax((v) => !v)}
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
                aria-checked={autoTax}
                data-on={autoTax}
                onClick={() => setAutoTax((v) => !v)}
                className="switch"
              />
            </li>
          </ul>
        </Card>
      </div>
    </SettingsLayout>
  );
}
