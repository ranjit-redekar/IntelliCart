import { Fragment, useEffect, useId, useState } from "react";
import { Clock, MapPin, Package, Plus, Save, Trash2, Truck } from "lucide-react";
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

interface TaxClass {
  id: string;
  name: string;
  rate: number;
  applied: string;
}

interface ShippingValue {
  freeOver: number;
  flatRate: number;
  taxRate: number;
  zones: Zone[];
  taxClasses: TaxClass[];
  includeTax: boolean;
  autoTax: boolean;
}

// Editors work on string drafts; numbers/lists are parsed on apply.
type Draft = Record<string, string>;
type Errors = Record<string, string>;
interface FieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  numeric?: boolean;
}

const ZONE_FIELDS: FieldSpec[] = [
  { key: "name", label: "Zone name", placeholder: "US · Metro" },
  { key: "countries", label: "Regions", placeholder: "Portland, Seattle, SF" },
  { key: "carriers", label: "Carriers (comma-separated)", placeholder: "UPS, FedEx" },
  { key: "free", label: "Free above (₹)", placeholder: "50", numeric: true },
  { key: "sla", label: "Delivery SLA", placeholder: "1-2 days" },
];
const TAX_FIELDS: FieldSpec[] = [
  { key: "name", label: "Class name", placeholder: "Apparel" },
  { key: "rate", label: "Rate (%)", placeholder: "8", numeric: true },
  { key: "applied", label: "Applies to", placeholder: "Fashion category" },
];

const zoneDraft = (z?: Zone): Draft =>
  z
    ? { name: z.name, countries: z.countries, carriers: z.carriers.join(", "), free: String(z.free), sla: z.sla }
    : { name: "", countries: "", carriers: "", free: "", sla: "" };
const taxDraft = (t?: TaxClass): Draft =>
  t ? { name: t.name, rate: String(t.rate), applied: t.applied } : { name: "", rate: "", applied: "" };

const splitList = (v: string) => [...new Set(v.split(",").map((x) => x.trim()).filter(Boolean))];

function validateZone(d: Draft, otherNames: string[]): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Zone name is required.";
  else if (otherNames.includes(d.name.trim().toLowerCase())) e.name = "A zone with this name already exists.";
  if (!d.countries.trim()) e.countries = "List the regions this zone covers.";
  if (!splitList(d.carriers).length) e.carriers = "Add at least one carrier.";
  const free = Number(d.free);
  if (d.free.trim() === "" || !Number.isFinite(free) || free < 0) e.free = "Enter an amount of 0 or more.";
  if (!d.sla.trim()) e.sla = "Delivery SLA is required.";
  return e;
}

function validateTax(d: Draft, otherNames: string[]): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Class name is required.";
  else if (otherNames.includes(d.name.trim().toLowerCase())) e.name = "A class with this name already exists.";
  const rate = Number(d.rate);
  if (d.rate.trim() === "" || !Number.isFinite(rate) || rate < 0 || rate > 100) e.rate = "Enter a rate between 0 and 100.";
  return e;
}

const newId = (prefix: string, ids: string[]) => {
  let n = ids.length + 1;
  while (ids.includes(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
};

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
  // Which row's inline editor is open: "new" or a row id, per list.
  const [zoneEdit, setZoneEdit] = useState<string | null>(null);
  const [taxEdit, setTaxEdit] = useState<string | null>(null);
  const otherNames = (rows: { id: string; name: string }[], id: string | null) =>
    rows.filter((r) => r.id !== id).map((r) => r.name.toLowerCase());

  const applyZone = (id: string | null, d: Draft) => {
    const zone = {
      name: d.name.trim(),
      countries: d.countries.trim(),
      carriers: splitList(d.carriers),
      free: Number(d.free),
      sla: d.sla.trim(),
    };
    setForm((f) => ({
      ...f,
      zones: id
        ? f.zones.map((z) => (z.id === id ? { ...z, ...zone } : z))
        : [...f.zones, { id: newId("z", f.zones.map((z) => z.id)), ...zone }],
    }));
    setZoneEdit(null);
  };
  const removeZone = (z: Zone) => {
    if (!window.confirm(`Remove the "${z.name}" zone? It disappears once you save.`)) return;
    setForm((f) => ({ ...f, zones: f.zones.filter((x) => x.id !== z.id) }));
    if (zoneEdit === z.id) setZoneEdit(null);
  };
  const applyTax = (id: string | null, d: Draft) => {
    const tc = { name: d.name.trim(), rate: Number(d.rate), applied: d.applied.trim() };
    setForm((f) => ({
      ...f,
      taxClasses: id
        ? f.taxClasses.map((t) => (t.id === id ? { ...t, ...tc } : t))
        : [...f.taxClasses, { id: newId("t", f.taxClasses.map((t) => t.id)), ...tc }],
    }));
    setTaxEdit(null);
  };
  const removeTax = (t: TaxClass) => {
    if (!window.confirm(`Remove the "${t.name}" tax class? It disappears once you save.`)) return;
    setForm((f) => ({ ...f, taxClasses: f.taxClasses.filter((x) => x.id !== t.id) }));
    if (taxEdit === t.id) setTaxEdit(null);
  };

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
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-expanded={zoneEdit === "new"}
            onClick={() => setZoneEdit(zoneEdit === "new" ? null : "new")}
          >
            <Plus size={13} /> Add zone
          </button>
        </div>
        {zoneEdit === "new" && (
          <div className="px-5 pb-4">
            <RowEditor
              fields={ZONE_FIELDS}
              initial={zoneDraft()}
              validate={(d) => validateZone(d, otherNames(zones, null))}
              submitLabel="Add zone"
              onApply={(d) => applyZone(null, d)}
              onCancel={() => setZoneEdit(null)}
            />
          </div>
        )}
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
                <Fragment key={z.id}>
                  <tr
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
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-expanded={zoneEdit === z.id}
                          onClick={() => setZoneEdit(zoneEdit === z.id ? null : z.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          aria-label={`Remove ${z.name}`}
                          title={`Remove ${z.name}`}
                          onClick={() => removeZone(z)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {zoneEdit === z.id && (
                    <tr className="border-b border-[var(--color-border)]">
                      <td colSpan={5} className="px-5 py-4 bg-[var(--color-surface-2)]">
                        <RowEditor
                          fields={ZONE_FIELDS}
                          initial={zoneDraft(z)}
                          validate={(d) => validateZone(d, otherNames(zones, z.id))}
                          submitLabel="Apply"
                          onApply={(d) => applyZone(z.id, d)}
                          onCancel={() => setZoneEdit(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padded={false} className="overflow-hidden lg:col-span-2">
          <div className="p-5 pb-3 flex items-end justify-between gap-3">
            <CardHeader title="Tax classes" subtitle="Per-category tax rates" eyebrow="Tax" className="mb-0" />
            <button
              type="button"
              className="btn btn-soft btn-sm"
              aria-expanded={taxEdit === "new"}
              onClick={() => setTaxEdit(taxEdit === "new" ? null : "new")}
            >
              <Plus size={13} /> Add class
            </button>
          </div>
          {taxEdit === "new" && (
            <div className="px-5 pb-4">
              <RowEditor
                fields={TAX_FIELDS}
                initial={taxDraft()}
                validate={(d) => validateTax(d, otherNames(taxClasses, null))}
                submitLabel="Add class"
                onApply={(d) => applyTax(null, d)}
                onCancel={() => setTaxEdit(null)}
              />
            </div>
          )}
          <ul className="divide-y divide-[var(--color-border)]">
            {taxClasses.map((t, ti) => (
              <li key={t.id} className="px-5 py-3.5 flex flex-wrap items-center gap-4">
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-expanded={taxEdit === t.id}
                    onClick={() => setTaxEdit(taxEdit === t.id ? null : t.id)}
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Remove ${t.name}`}
                    title={`Remove ${t.name}`}
                    onClick={() => removeTax(t)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {taxEdit === t.id && (
                  <div className="basis-full">
                    <RowEditor
                      fields={TAX_FIELDS}
                      initial={taxDraft(t)}
                      validate={(d) => validateTax(d, otherNames(taxClasses, t.id))}
                      submitLabel="Apply"
                      onApply={(d) => applyTax(t.id, d)}
                      onCancel={() => setTaxEdit(null)}
                    />
                  </div>
                )}
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

function RowEditor({
  fields,
  initial,
  validate,
  submitLabel,
  onApply,
  onCancel,
}: {
  fields: FieldSpec[];
  initial: Draft;
  validate: (d: Draft) => Errors;
  submitLabel: string;
  onApply: (d: Draft) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const [d, setD] = useState(initial);
  const [tried, setTried] = useState(false);
  const errors = validate(d);
  return (
    <form
      noValidate
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start text-left"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!Object.keys(errors).length) onApply(d);
      }}
    >
      {fields.map((f, i) => {
        const err = tried ? errors[f.key] : undefined;
        const errId = `${uid}-${f.key}`;
        return (
          <label key={f.key} className="block">
            <span className="block text-[12px] text-muted mb-1">{f.label}</span>
            <input
              className="input h-10"
              autoFocus={i === 0}
              inputMode={f.numeric ? "decimal" : undefined}
              placeholder={f.placeholder}
              value={d[f.key]}
              aria-invalid={!!err}
              aria-describedby={err ? errId : undefined}
              onChange={(e) => setD((x) => ({ ...x, [f.key]: e.target.value }))}
            />
            {err && (
              <span id={errId} className="block text-[12px] text-[var(--color-accent-rose)] mt-1">
                {err}
              </span>
            )}
          </label>
        );
      })}
      <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm">
          {submitLabel}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
