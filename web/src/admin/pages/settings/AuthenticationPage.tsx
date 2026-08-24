import { useState } from "react";
import { Code2, KeyRound, Lock, LogOut, Mail, MonitorSmartphone, Save, Shield, ShieldCheck, UserCheck } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Avatar } from "../../components/ui/Avatar";

const sessions = [
  { id: "s1", device: "MacBook Pro · Chrome", location: "Mumbai, IN", ip: "203.0.113.42", lastActive: "Just now", current: true },
  { id: "s2", device: "iPhone 15 · Safari", location: "Mumbai, IN", ip: "203.0.113.42", lastActive: "2 hours ago", current: false },
  { id: "s3", device: "Windows · Edge", location: "Bengaluru, IN", ip: "198.51.100.7", lastActive: "Yesterday", current: false },
];

const providers = [
  { id: "google", name: "Google Workspace", icon: UserCheck, connected: true, tone: "var(--color-accent-rose)" },
  { id: "github", name: "GitHub", icon: Code2, connected: false, tone: "var(--color-text)" },
  { id: "saml", name: "SAML SSO", icon: ShieldCheck, connected: false, tone: "var(--color-accent-violet)" },
];

export default function AuthenticationPage() {
  const [twoFA, setTwoFA] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [autoLogout, setAutoLogout] = useState(true);
  const [magicLink, setMagicLink] = useState(true);

  return (
    <SettingsLayout
      title="Authentication"
      subtitle="Sign-in methods, multi-factor protection, and active session control for your team."
      icon={Lock}
      tone="var(--color-accent-rose)"
      actions={
        <button type="button" className="btn btn-primary btn-sm">
          <Save size={13} /> Save changes
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
            <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-accent-mint)]">
              <ShieldCheck size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold">Authenticator app</p>
                {twoFA && <Chip tone="success">Active</Chip>}
              </div>
              <p className="text-[12.5px] text-muted mt-0.5">TOTP codes via Authy, 1Password, or Google Authenticator.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={twoFA}
              data-on={twoFA}
              onClick={() => setTwoFA((v) => !v)}
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
              aria-checked={enforce2FA}
              data-on={enforce2FA}
              onClick={() => setEnforce2FA((v) => !v)}
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
              aria-checked={magicLink}
              data-on={magicLink}
              onClick={() => setMagicLink((v) => !v)}
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
              aria-checked={autoLogout}
              data-on={autoLogout}
              onClick={() => setAutoLogout((v) => !v)}
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
          <button type="button" className="btn btn-ghost btn-sm">
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
                <button type="button" className="btn btn-ghost btn-sm">
                  Revoke
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
          <button type="button" className="btn btn-ghost btn-sm">
            <KeyRound size={13} /> Change password
          </button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
