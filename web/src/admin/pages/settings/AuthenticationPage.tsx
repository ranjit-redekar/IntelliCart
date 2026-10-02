import { useEffect, useState } from "react";
import { Code2, KeyRound, Lock, LogOut, Mail, MonitorSmartphone, Save, Shield, ShieldCheck, UserCheck } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Avatar } from "../../components/ui/Avatar";
import { useSettings } from "../../lib/useSettings";
import { api } from "../../../lib/api";
import { useApi } from "../../../lib/useApi";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { reportWrite, toast } from "../../../lib/toast";

interface AuthValue {
  twoFactor: boolean;
  enforceTwoFactor: boolean;
  magicLink: boolean;
  autoLogoutMinutes: number;
  passwordMinLength: number;
  autoLogout: boolean;
  providers: { id: string; name: string; connected: boolean }[];
}

interface LiveSession {
  id: string;
  createdAt: string;
  userAgent: string | null;
  ip: string | null;
  current: boolean;
}

const DEFAULTS = { autoLogout: true };
type Toggle = "twoFactor" | "enforceTwoFactor" | "magicLink" | "autoLogout";

const PROVIDER_ICONS: Record<string, typeof UserCheck> = {
  google: UserCheck,
  github: Code2,
  saml: ShieldCheck,
};
const PROVIDER_TONES: Record<string, string> = {
  google: "var(--color-accent-rose)",
  github: "var(--color-text)",
  saml: "var(--color-accent-violet)",
};

/** "MacBook Pro · Chrome" out of a user-agent string. */
function describeDevice(ua: string | null) {
  if (!ua) return "Unknown device";
  const os = /Macintosh/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows"
    : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android"
    : /Linux/.test(ua) ? "Linux" : "Unknown";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  return `${os} · ${browser}`;
}

function relative(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} day${hrs < 48 ? "" : "s"} ago`;
}

export default function AuthenticationPage() {
  const settings = useSettings<AuthValue>("authentication");

  useEffect(() => {
    if (settings.saved) toast("Settings saved", "success");
  }, [settings.saved]);
  useEffect(() => {
    if (settings.saveError) toast(settings.saveError);
  }, [settings.saveError]);

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!settings.value) return <Skeleton rows={4} />;
  return <AuthenticationForm value={settings.value} save={settings.save} saving={settings.saving} />;
}

interface FormProps {
  value: AuthValue;
  save: (value: Partial<AuthValue>) => Promise<void>;
  saving: boolean;
}

function AuthenticationForm({ value, save, saving }: FormProps) {
  // Real sessions, from Redis. These are the ones "revoke" actually ends.
  const sessionState = useApi(() => api.get<{ items: LiveSession[] }>("/auth/sessions"), []);
  const [revoking, setRevoking] = useState<string | null>(null);
  const revoke = async (key: string, confirmText: string, write: () => Promise<unknown>, okText: string) => {
    if (!window.confirm(confirmText)) return;
    setRevoking(key);
    await reportWrite(write(), okText);
    setRevoking(null);
    sessionState.reload();
  };

  const initial = { ...DEFAULTS, ...value };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const toggle = (k: Toggle) => setForm((f) => ({ ...f, [k]: !f[k] }));

  const providers = form.providers.map((p) => ({
    ...p,
    icon: PROVIDER_ICONS[p.id] ?? ShieldCheck,
    tone: PROVIDER_TONES[p.id] ?? "var(--color-text)",
  }));
  const sessions = (sessionState.data?.items ?? []).map((s) => ({
    id: s.id,
    device: describeDevice(s.userAgent),
    location: s.ip ?? "Unknown",
    ip: s.ip ?? "—",
    lastActive: relative(s.createdAt),
    current: s.current,
  }));

  return (
    <SettingsLayout
      title="Authentication"
      subtitle="Sign-in methods, multi-factor protection, and active session control for your team."
      icon={Lock}
      tone="var(--color-accent-rose)"
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
      <Card>
        <CardHeader
          title="Multi-factor authentication"
          subtitle="A required second step keeps accounts safe even if a password leaks"
          eyebrow="Security"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="soft-surface p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-success-text)]">
              <ShieldCheck size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold">Authenticator app</p>
                {form.twoFactor && <Chip tone="success">Active</Chip>}
              </div>
              <p className="text-[12.5px] text-muted mt-0.5">TOTP codes via Authy, 1Password, or Google Authenticator.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.twoFactor}
              data-on={form.twoFactor}
              onClick={() => toggle("twoFactor")}
              className="switch"
            />
          </div>
          <div className="soft-surface p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-brand-500)_14%,transparent)] text-[var(--color-brand-600)]">
              <Shield size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">Require for all admins</p>
              <p className="text-[12.5px] text-muted mt-0.5">Members without 2FA cannot sign in.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.enforceTwoFactor}
              data-on={form.enforceTwoFactor}
              onClick={() => toggle("enforceTwoFactor")}
              className="switch"
            />
          </div>
          <div className="soft-surface p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-violet)_14%,transparent)] text-[var(--color-accent-violet)]">
              <Mail size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">Magic link sign-in</p>
              <p className="text-[12.5px] text-muted mt-0.5">Passwordless one-time email links.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.magicLink}
              data-on={form.magicLink}
              onClick={() => toggle("magicLink")}
              className="switch"
            />
          </div>
          <div className="soft-surface p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-amber)_14%,transparent)] text-[var(--color-accent-amber)]">
              <LogOut size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">Auto-logout after 30 days</p>
              <p className="text-[12.5px] text-muted mt-0.5">Inactive sessions are revoked.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.autoLogout}
              data-on={form.autoLogout}
              onClick={() => toggle("autoLogout")}
              className="switch"
            />
          </div>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3">
          <CardHeader title="Single sign-on" subtitle="Identity providers" eyebrow="SSO" className="mb-0" />
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {providers.map((p) => (
            <li key={p.id} className="px-5 py-3.5 flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                style={{ background: `color-mix(in oklab, ${p.tone} 14%, transparent)`, color: p.tone }}
              >
                <p.icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold">{p.name}</p>
                  {p.connected ? <Chip tone="success">Connected</Chip> : <Chip tone="neutral">Available</Chip>}
                </div>
                <p className="text-[12px] text-muted mt-0.5">
                  {p.connected ? "Members from this domain auto-join" : "Connect to enable workspace-wide SSO"}
                </p>
              </div>
              <button
                type="button"
                className={p.connected ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
                disabled
                title="Coming soon"
              >
                {p.connected ? "Configure" : "Connect"}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-end justify-between gap-3">
          <CardHeader title="Active sessions" subtitle="Devices currently signed in to your account" eyebrow="Sessions" className="mb-0" />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={revoking !== null || !sessions.some((s) => !s.current)}
            onClick={() =>
              revoke(
                "others",
                "Sign out of every other device? They will need to sign in again.",
                () => api.post("/auth/sessions/revoke-others"),
                "Signed out everywhere else",
              )
            }
          >
            <LogOut size={13} /> Sign out everywhere else
          </button>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {sessions.map((s) => (
            <li key={s.id} className="px-5 py-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                <MonitorSmartphone size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold truncate">{s.device}</p>
                  {s.current && <Chip tone="info">This device</Chip>}
                </div>
                <p className="text-[12px] text-muted truncate">
                  {s.location} · {s.ip} · {s.lastActive}
                </p>
              </div>
              {!s.current && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={revoking !== null}
                  aria-label={`Revoke session on ${s.device}`}
                  onClick={() =>
                    revoke(
                      s.id,
                      `Sign out ${s.device}?`,
                      () => api.del(`/auth/sessions/${encodeURIComponent(s.id)}`),
                      "Session revoked",
                    )
                  }
                >
                  {revoking === s.id ? "Revoking…" : "Revoke"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Account password" subtitle="Last changed 42 days ago" eyebrow="Password" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Avatar name="Ranjit R" size={42} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">Ranjit Redekar</p>
            <p className="text-[12px] text-muted">ranjit@intellicart.shop</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" disabled title="Coming soon">
            <KeyRound size={13} /> Change password
          </button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
