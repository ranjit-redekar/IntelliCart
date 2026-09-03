import { useState } from "react";
import { Check, Globe, Plus, Save } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { cn } from "../../lib/cn";
import { useSettings } from "../../lib/useSettings";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";

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
  regions: { code: string; name: string; customers: number }[];
}

// Accent colours are presentation, so they stay here; the data is in the DB.
const REGION_TONES = [
  "var(--color-brand-500)",
  "var(--color-accent-violet)",
  "var(--color-accent-mint)",
  "var(--color-accent-amber)",
];

export default function LocalizationPage() {
  const settings = useSettings<LocalizationValue>("localization");
  const value = settings.value;

  const [primaryOverride, setPrimary] = useState<string | null>(null);
  const [enabledOverride, setEnabled] = useState<Set<string> | null>(null);
  const [langOverride, setEnabledLangs] = useState<Set<string> | null>(null);


  // Derived above the guard, so they must tolerate the not-yet-loaded state.
  const currencyData = value?.currencies ?? [];
  const languages = value?.languages ?? [];
  const regions = value?.regions ?? [];
  const primary = primaryOverride ?? value?.primaryCurrency ?? "";
  const enabled = enabledOverride ?? new Set(value?.enabledCurrencies ?? []);
  const enabledLangs = langOverride ?? new Set(value?.enabledLanguages ?? []);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!value) return <Skeleton rows={4} />;

  return (
    <SettingsLayout
      title="Localization"
      subtitle="Configure currencies, languages, and regions to deliver a native experience for every customer."
      icon={Globe}
      tone="var(--color-accent-sky)"
      actions={
        <button type="button" className="btn btn-primary btn-sm">
          <Save size={13} /> Save changes
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
          <button type="button" className="btn btn-soft btn-sm">
            <Plus size={13} /> Add currency
          </button>
        </div>
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
                          setEnabled((s) => {
                            const next = new Set(s);
                            if (next.has(c.code)) next.delete(c.code);
                            else next.add(c.code);
                            return next;
                          })
                        }
                        className="switch"
                        disabled={isPrimary}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPrimary(c.code);
                          setEnabled((s) => new Set(s).add(c.code));
                        }}
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
                      setEnabledLangs((s) => {
                        const next = new Set(s);
                        if (next.has(l.code)) next.delete(l.code);
                        else next.add(l.code);
                        return next;
                      })
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
              <li key={r.code} className="px-5 py-3.5 flex items-center gap-3">
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
                <button type="button" className="btn btn-ghost btn-sm">
                  Configure
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </SettingsLayout>
  );
}
