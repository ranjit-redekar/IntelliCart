import { useState } from "react";
import { Building2, Globe, Image as ImageIcon, Mail, MapPin, Phone, Save } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { cn } from "../../lib/cn";

const timezones = ["UTC", "UTC+01:00 (London)", "UTC+05:30 (Mumbai)", "UTC+09:00 (Tokyo)", "UTC-05:00 (New York)"];
const weekStarts = ["Monday", "Sunday"];

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}
function Field({ label, hint, required, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-accent-rose)]">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11.5px] text-subtle mt-1">{hint}</p>}
    </label>
  );
}

export default function StoreProfilePage() {
  const [tz, setTz] = useState(timezones[2]);
  const [week, setWeek] = useState(weekStarts[0]);

  return (
    <SettingsLayout
      title="Store profile"
      subtitle="Brand identity, support channels, and the operating defaults that shape every customer touchpoint."
      icon={Building2}
      tone="var(--color-brand-500)"
      actions={
        <>
          <button type="button" className="btn btn-ghost btn-sm">
            Discard
          </button>
          <button type="button" className="btn btn-primary btn-sm">
            <Save size={13} /> Save changes
          </button>
        </>
      }
    >
      <Card>
        <CardHeader title="Brand identity" subtitle="How your store presents itself" eyebrow="Identity" />
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6">
          <div>
            <div
              className="relative aspect-square rounded-[18px] flex items-center justify-center text-white text-[36px] font-bold shadow-[var(--shadow-card)] overflow-hidden"
              style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))" }}
            >
              A
              <button
                type="button"
                className="absolute inset-x-2 bottom-2 btn btn-soft btn-sm justify-center text-[11.5px] !py-1"
              >
                <ImageIcon size={11} /> Replace
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Store name" required>
              <input className="input" defaultValue="IntelliCart Commerce" />
            </Field>
            <Field label="Legal name">
              <input className="input" defaultValue="IntelliCart Retail Pvt. Ltd." />
            </Field>
            <Field label="Tagline" hint="Used on the storefront hero and meta description">
              <input className="input" defaultValue="Quietly modern essentials." />
            </Field>
            <Field label="Storefront URL">
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-[10px] bg-[var(--color-surface-2)] border border-r-0 border-[var(--color-border)] text-[12px] text-subtle">
                  https://
                </span>
                <input className="input !rounded-l-none" defaultValue="intellicart.shop" />
              </div>
            </Field>
            <Field label="Description" hint="A short paragraph about your brand">
              <textarea
                rows={3}
                className="input resize-none"
                defaultValue="IntelliCart crafts everyday essentials with restraint, comfort, and a quiet sense of luxury."
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Support channels" subtitle="Where customers can reach you" eyebrow="Contact" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Support email" required>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" defaultValue="hello@intellicart.shop" />
            </div>
          </Field>
          <Field label="Phone">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" defaultValue="+91 98765 43210" />
            </div>
          </Field>
          <Field label="Website">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" defaultValue="https://intellicart.shop" />
            </div>
          </Field>
          <Field label="Business address">
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" defaultValue="121 Marine Drive, Mumbai, India" />
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Operating defaults" subtitle="Used for analytics, schedules, and exports" eyebrow="Operations" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Time zone">
            <select className="input" value={tz} onChange={(e) => setTz(e.target.value)}>
              {timezones.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Week starts on">
            <div className="flex items-center gap-2">
              {weekStarts.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeek(w)}
                  className={cn(
                    "px-3 h-10 rounded-[10px] text-[13px] font-medium border transition-colors flex-1",
                    week === w
                      ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-transparent"
                      : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Order ID prefix" hint="New orders use ORD-####">
            <input className="input" defaultValue="ORD-" />
          </Field>
          <Field label="Customer ID prefix">
            <input className="input" defaultValue="C-" />
          </Field>
        </div>
      </Card>
    </SettingsLayout>
  );
}
