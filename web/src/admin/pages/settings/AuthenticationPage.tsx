import { useEffect, useState, type FormEvent } from "react";
import { Code2, Eye, EyeOff, KeyRound, Lock, LogOut, Mail, MonitorSmartphone, Save, Shield, ShieldCheck, UserCheck } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Avatar } from "../../components/ui/Avatar";
import { useSettings } from "../../lib/useSettings";
import { useSession } from "../../lib/session";
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

      <PasswordCard onChanged={sessionState.reload} />
    </SettingsLayout>
  );
}

/** Matches POST /auth/password (and sign-up): at least 8 characters. */
const MIN_PASSWORD = 8;

function PasswordCard({ onChanged }: { onChanged: () => void }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const problem =
    next && next.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.`
    : confirm && confirm !== next ? "Passwords don't match."
    : null;

  const close = () => {
    setOpen(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setShow(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (problem || !current || !next || next !== confirm) return;
    setBusy(true);
    const ok = await reportWrite(
      api.post("/auth/password", { current, next }),
      "Password changed. Other devices were signed out.",
    );
    setBusy(false);
    if (ok) {
      close();
      onChanged();
    }
  };

  const type = show ? "text" : "password";
  return (
    <Card>
      <CardHeader title="Account password" subtitle="Changing it signs out your other devices" eyebrow="Password" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Avatar name={user?.name ?? "?"} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">{user?.name}</p>
          <p className="text-[12px] text-muted">{user?.email}</p>
        </div>
        {!open && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
            <KeyRound size={13} /> Change password
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3" aria-label="Change password">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-[12px] text-muted mb-1">Current password</span>
              <input className="input h-10" type={type} autoComplete="current-password" required autoFocus
                value={current} onChange={(e) => setCurrent(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[12px] text-muted mb-1">New password</span>
              <input className="input h-10" type={type} autoComplete="new-password" required minLength={MIN_PASSWORD}
                aria-describedby="admin-pw-problem" value={next} onChange={(e) => setNext(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[12px] text-muted mb-1">Confirm new password</span>
              <input className="input h-10" type={type} autoComplete="new-password" required
                aria-invalid={!!confirm && confirm !== next} aria-describedby="admin-pw-problem"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
          </div>
          <p id="admin-pw-problem" role="alert" className="text-[12px] text-[var(--color-accent-rose)] min-h-[1em]">
            {problem}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !!problem}>
              {busy ? "Saving…" : "Update password"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={close}>Cancel</button>
            <button type="button" className="btn btn-ghost btn-sm ml-auto" aria-pressed={show} onClick={() => setShow((v) => !v)}>
              {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? "Hide passwords" : "Show passwords"}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
