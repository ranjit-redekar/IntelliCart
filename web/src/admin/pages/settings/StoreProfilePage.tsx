import { useEffect, useRef, useState } from "react";
import { Building2, Globe, Image as ImageIcon, Mail, MapPin, Phone, Save } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { cn } from "../../lib/cn";
import { useSettings } from "../../lib/useSettings";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { toast } from "../../../lib/toast";
import { api } from "../../../lib/api";

interface StoreValue {
  storeName: string;
  legalName: string;
  tagline: string;
  domain: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  weekStart: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  addressLine: string;
  orderPrefix: string;
  customerPrefix: string;
  logoUrl?: string;
}

const LOGO_TYPES = "image/png,image/jpeg,image/webp,image/avif"; // what /admin/uploads/sign accepts
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Presign, then PUT the file straight to object storage. Returns its public URL. */
async function uploadImage(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await api.post<{ uploadUrl: string; publicUrl: string }>("/admin/uploads/sign", {
    contentType: file.type,
    contentLength: file.size,
  });
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
  if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
  return publicUrl;
}

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
  const settings = useSettings<StoreValue>("store");

  useEffect(() => {
    if (settings.saved) toast("Settings saved", "success");
  }, [settings.saved]);
  useEffect(() => {
    if (settings.saveError) toast(settings.saveError);
  }, [settings.saveError]);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!settings.value) return <Skeleton rows={5} />;
  return <StoreProfileForm value={settings.value} save={settings.save} saving={settings.saving} />;
}

interface FormProps {
  value: StoreValue;
  save: (value: Partial<StoreValue>) => Promise<void>;
  saving: boolean;
}

function StoreProfileForm({ value, save, saving }: FormProps) {
  const [v, setForm] = useState(value);
  const dirty = JSON.stringify(v) !== JSON.stringify(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof StoreValue) => (e: { target: { value: string } }) =>
    setForm((d) => ({ ...d, [k]: e.target.value }));

  async function onLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      toast("Logo must be 2 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const logoUrl = await uploadImage(file);
      setForm((d) => ({ ...d, logoUrl }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not upload logo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SettingsLayout
      title="Store profile"
      subtitle="Brand identity, support channels, and the operating defaults that shape every customer touchpoint."
      icon={Building2}
      tone="var(--color-brand-500)"
      actions={
        <>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty || saving} onClick={() => setForm(value)}>
            Discard
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!dirty || saving}
            onClick={() => save(v)}
          >
            <Save size={13} /> {saving ? "Saving…" : "Save changes"}
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
              {v.logoUrl ? (
                <img src={v.logoUrl} alt="Store logo" className="absolute inset-0 size-full object-cover bg-[var(--color-surface)]" />
              ) : (
                "A"
              )}
              <input ref={fileRef} type="file" accept={LOGO_TYPES} hidden onChange={onLogoPick} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute inset-x-2 bottom-2 btn btn-soft btn-sm justify-center text-[11.5px] !py-1"
              >
                <ImageIcon size={11} /> {uploading ? "Uploading…" : "Replace"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Store name" required>
              <input className="input" value={v.storeName} onChange={set("storeName")} />
            </Field>
            <Field label="Legal name">
              <input className="input" value={v.legalName} onChange={set("legalName")} />
            </Field>
            <Field label="Tagline" hint="Used on the storefront hero and meta description">
              <input className="input" value={v.tagline} onChange={set("tagline")} />
            </Field>
            <Field label="Storefront URL">
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-[10px] bg-[var(--color-surface-2)] border border-r-0 border-[var(--color-border)] text-[12px] text-subtle">
                  https://
                </span>
                <input className="input !rounded-l-none" value={v.domain} onChange={set("domain")} />
              </div>
            </Field>
            <Field label="Description" hint="A short paragraph about your brand">
              <textarea
                rows={3}
                className="input resize-none"
                value={v.description ?? ""} onChange={set("description")}
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
              <input className="input pl-9" value={v.contactEmail ?? ""} onChange={set("contactEmail")} />
            </div>
          </Field>
          <Field label="Phone">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" value={v.contactPhone ?? ""} onChange={set("contactPhone")} />
            </div>
          </Field>
          <Field label="Website">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" value={v.websiteUrl ?? ""} onChange={set("websiteUrl")} />
            </div>
          </Field>
          <Field label="Business address">
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input className="input pl-9" value={v.addressLine ?? ""} onChange={set("addressLine")} />
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Operating defaults" subtitle="Used for analytics, schedules, and exports" eyebrow="Operations" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Time zone">
            <select className="input" value={v.timezone} onChange={set("timezone")}>
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
                  onClick={() => setForm((d) => ({ ...d, weekStart: w }))}
                  className={cn(
                    "px-3 h-10 rounded-[10px] text-[13px] font-medium border transition-colors flex-1",
                    v.weekStart === w
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
            <input className="input" value={v.orderPrefix ?? ""} onChange={set("orderPrefix")} />
          </Field>
          <Field label="Customer ID prefix">
            <input className="input" value={v.customerPrefix ?? ""} onChange={set("customerPrefix")} />
          </Field>
        </div>
      </Card>
    </SettingsLayout>
  );
}
