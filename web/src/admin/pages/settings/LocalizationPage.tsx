import { useEffect, useId, useState } from "react";
import { Check, Globe, Plus, Save } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { cn } from "../../lib/cn";
import { useSettings } from "../../lib/useSettings";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { toast } from "../../../lib/toast";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}
interface LocalizationValue {
  primaryCurrency: string;
  enabledCurrencies: string[];
  enabledLanguages: string[];
  currencies: Currency[];
  languages: { code: string; name: string; flag: string; primary: boolean }[];
  regions: Region[];
}
interface Region {
  code: string;
  name: string;
  customers: number;
}

// Editors work on string drafts; numbers are parsed on apply.
type Draft = Record<string, string>;
type Errors = Record<string, string>;
interface FieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  upper?: boolean;
  maxLength?: number;
  numeric?: boolean;
}

const CURRENCY_FIELDS: FieldSpec[] = [
  { key: "code", label: "ISO code", placeholder: "EUR", upper: true, maxLength: 3 },
  { key: "symbol", label: "Symbol", placeholder: "€", maxLength: 4 },
  { key: "name", label: "Name", placeholder: "Euro" },
  { key: "rate", label: "Rate vs INR", placeholder: "0.011", numeric: true },
];
// ponytail: customer counts are reporting data, so Configure edits only the region's identity.
const REGION_FIELDS: FieldSpec[] = [
  { key: "code", label: "Code", placeholder: "IN", upper: true, maxLength: 3 },
  { key: "name", label: "Name", placeholder: "India" },
];

function validateCurrency(d: Draft, taken: string[]): Errors {
  const e: Errors = {};
  if (!/^[A-Z]{3}$/.test(d.code)) e.code = "Use a 3-letter ISO code, e.g. EUR.";
  else if (taken.includes(d.code)) e.code = `${d.code} is already in the list.`;
  if (!d.symbol.trim()) e.symbol = "Symbol is required.";
  if (!d.name.trim()) e.name = "Name is required.";
  const rate = Number(d.rate);
  if (d.rate.trim() === "" || !Number.isFinite(rate) || rate <= 0) e.rate = "Enter a rate greater than 0.";
  return e;
}

function validateRegion(d: Draft, taken: string[]): Errors {
  const e: Errors = {};
  if (!/^[A-Z]{2,3}$/.test(d.code)) e.code = "Use 2–3 letters, e.g. IN.";
  else if (taken.includes(d.code)) e.code = `${d.code} is already used by another region.`;
  if (!d.name.trim()) e.name = "Name is required.";
  return e;
}

// Accent colours are presentation, so they stay here; the data is in the DB.
const REGION_TONES = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
];

const toggle = (list: string[], code: string) =>
  list.includes(code) ? list.filter((c) => c !== code) : [...list, code];

export default function LocalizationPage() {
  const settings = useSettings<LocalizationValue>("localization");

  useEffect(() => {
    if (settings.saved) toast("Settings saved", "success");
  }, [settings.saved]);
  useEffect(() => {
    if (settings.saveError) toast(settings.saveError);
  }, [settings.saveError]);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!settings.value) return <Skeleton rows={4} />;
  return <LocalizationForm value={settings.value} save={settings.save} saving={settings.saving} />;
}

interface FormProps {
  value: LocalizationValue;
  save: (value: Partial<LocalizationValue>) => Promise<void>;
  saving: boolean;
}

function LocalizationForm({ value, save, saving }: FormProps) {
  const [form, setForm] = useState(value);
  const dirty = JSON.stringify(form) !== JSON.stringify(value);
  const { currencies: currencyData, languages, regions, primaryCurrency: primary } = form;
  const enabled = new Set(form.enabledCurrencies);
  const enabledLangs = new Set(form.enabledLanguages);
  const [addingCurrency, setAddingCurrency] = useState(false);
  // Index, not code: the code itself is editable.
  const [regionEdit, setRegionEdit] = useState<number | null>(null);

  return (
    <SettingsLayout
      title="Localization"
      subtitle="Configure currencies, languages, and regions to deliver a native experience for every customer."
      icon={Globe}
      tone="var(--color-accent-sky)"
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
      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-end justify-between gap-3">
          <CardHeader
            title="Currencies"
            subtitle={`${enabled.size} active · primary ${primary}`}
            eyebrow="Money"
            className="mb-0"
          />
          <button
            type="button"
            className="btn btn-soft btn-sm"
            aria-expanded={addingCurrency}
            onClick={() => setAddingCurrency((v) => !v)}
          >
            <Plus size={13} /> Add currency
          </button>
        </div>
        {addingCurrency && (
          <div className="px-5 pb-4">
            <RowEditor
              fields={CURRENCY_FIELDS}
              initial={{ code: "", symbol: "", name: "", rate: "" }}
              validate={(d) => validateCurrency(d, currencyData.map((c) => c.code))}
              submitLabel="Add currency"
              onCancel={() => setAddingCurrency(false)}
              onApply={(d) => {
                // Added disabled; the row's switch turns it on.
                const c: Currency = { code: d.code, symbol: d.symbol.trim(), name: d.name.trim(), rate: Number(d.rate) };
                setForm((f) => ({ ...f, currencies: [...f.currencies, c] }));
                setAddingCurrency(false);
              }}
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-y border-[var(--color-border)]">
                <th className="px-5 py-2.5 font-semibold">Currency</th>
                <th className="px-5 py-2.5 font-semibold">Code</th>
                <th className="px-5 py-2.5 font-semibold">Rate vs INR</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold text-right">Primary</th>
              </tr>
            </thead>
            <tbody>
              {currencyData.map((c) => {
                const isEnabled = enabled.has(c.code);
                const isPrimary = primary === c.code;
                return (
                  <tr
                    key={c.code}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-md bg-[var(--color-surface-2)] flex items-center justify-center font-semibold">
                          {c.symbol}
                        </span>
                        <p className="font-semibold">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums font-mono text-[12.5px] text-muted">{c.code}</td>
                    <td className="px-5 py-3 tabular-nums">{c.rate}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        data-on={isEnabled}
                        onClick={() =>
                          setForm((f) => ({ ...f, enabledCurrencies: toggle(f.enabledCurrencies, c.code) }))
                        }
                        className="switch"
                        disabled={isPrimary}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            primaryCurrency: c.code,
                            enabledCurrencies: f.enabledCurrencies.includes(c.code)
                              ? f.enabledCurrencies
                              : [...f.enabledCurrencies, c.code],
                          }))
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[12.5px] font-medium border transition-colors",
                          isPrimary
                            ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)] dark:bg-[color-mix(in_oklab,var(--color-brand-500)_18%,transparent)] dark:text-[var(--color-brand-200)] dark:border-transparent"
                            : "text-muted border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
                        )}
                      >
                        {isPrimary && <Check size={12} />} {isPrimary ? "Primary" : "Make primary"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padded={false} className="overflow-hidden">
          <div className="p-5 pb-3">
            <CardHeader title="Languages" subtitle="Storefront translations" eyebrow="Voice" className="mb-0" />
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {languages.map((l) => {
              const on = enabledLangs.has(l.code);
              return (
                <li key={l.code} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="text-[22px] leading-none">{l.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold">{l.name}</p>
                      {l.primary && <Chip tone="info">Primary</Chip>}
                    </div>
                    <p className="text-[11.5px] text-subtle">{l.code.toUpperCase()}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    data-on={on}
                    disabled={l.primary}
                    onClick={() =>
                      setForm((f) => ({ ...f, enabledLanguages: toggle(f.enabledLanguages, l.code) }))
                    }
                    className="switch"
                  />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card padded={false} className="overflow-hidden">
          <div className="p-5 pb-3">
            <CardHeader title="Regions served" subtitle="Where you sell today" eyebrow="Reach" className="mb-0" />
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {regions.map((r, ri) => (
              <li key={`${ri}-${r.code}`} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
                <span
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[11px] font-bold"
                  style={{ background: `color-mix(in oklab, ${REGION_TONES[ri % REGION_TONES.length]} 14%, transparent)`, color: REGION_TONES[ri % REGION_TONES.length] }}
                >
                  {r.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{r.name}</p>
                  <p className="text-[12px] text-muted tabular-nums">{r.customers.toLocaleString()} customers</p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-expanded={regionEdit === ri}
                  onClick={() => setRegionEdit(regionEdit === ri ? null : ri)}
                >
                  Configure
                </button>
                {regionEdit === ri && (
                  <div className="basis-full">
                    <RowEditor
                      fields={REGION_FIELDS}
                      initial={{ code: r.code, name: r.name }}
                      validate={(d) => validateRegion(d, regions.filter((_, i) => i !== ri).map((x) => x.code))}
                      submitLabel="Apply"
                      onCancel={() => setRegionEdit(null)}
                      onApply={(d) => {
                        setForm((f) => ({
                          ...f,
                          regions: f.regions.map((x, i) => (i === ri ? { ...x, code: d.code, name: d.name.trim() } : x)),
                        }));
                        setRegionEdit(null);
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start"
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
              maxLength={f.maxLength}
              inputMode={f.numeric ? "decimal" : undefined}
              placeholder={f.placeholder}
              value={d[f.key]}
              aria-invalid={!!err}
              aria-describedby={err ? errId : undefined}
              onChange={(e) => {
                const v = f.upper ? e.target.value.toUpperCase() : e.target.value;
                setD((x) => ({ ...x, [f.key]: v }));
              }}
            />
            {err && (
              <span id={errId} className="block text-[12px] text-[var(--color-accent-rose)] mt-1">
                {err}
              </span>
            )}
          </label>
        );
      })}
      <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
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
