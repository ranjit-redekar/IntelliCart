import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Crown,
  Eye,
  Globe,
  Headphones,
  KeyRound,
  Lock,
  Mail,
  MoreHorizontal,
  Search,
  Shield,
  ShieldCheck,
  Truck,
  UserCog,
  UserPlus,
  Database,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import { cn } from "../lib/cn";
import { api } from "../../lib/api";
import { reportWrite } from "../../lib/toast";
import { useApi } from "../../lib/useApi";

function ErrorStateBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card-surface p-6 flex flex-col items-start gap-3">
      <p className="text-[14px] font-semibold">Couldn't load the team</p>
      <p className="text-[13px] text-muted">{message}</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

const groups = [
  {
    title: "Workspace",
    items: [
      { icon: Building2, name: "Store profile", desc: "Brand identity, contact, and time zone.", to: "/settings/store-profile" },
      { icon: Globe, name: "Localization", desc: "Currencies, languages, and regions.", to: "/settings/localization" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { icon: Truck, name: "Shipping & tax", desc: "Delivery zones, SLAs, and tax classes.", to: "/settings/shipping-tax" },
      { icon: CreditCard, name: "Payments", desc: "Gateways, capture, and reconciliation.", to: "/settings/payments" },
    ],
  },
  {
    title: "Security",
    items: [
      { icon: Lock, name: "Authentication", desc: "Sign-in, sessions, and SSO.", to: "/settings/authentication" },
      { icon: KeyRound, name: "API keys", desc: "Service tokens and webhooks.", to: "/settings/api-keys" },
      { icon: ShieldCheck, name: "Audit logs", desc: "Trace every admin action.", to: "/settings/audit-logs" },
    ],
  },
  {
    title: "Data",
    items: [
      { icon: Database, name: "Demo data", desc: "Load the sample catalog, customers, and orders.", to: "/settings/demo-data" },
    ],
  },
] as const;

type RoleId = "owner" | "admin" | "manager" | "support" | "viewer";

interface RoleDef {
  id: RoleId;
  name: string;
  icon: typeof Crown;
  tone: string;
  description: string;
  permissions: string[];
}

const roles: RoleDef[] = [
  {
    id: "owner",
    name: "Owner",
    icon: Crown,
    tone: "var(--color-accent-amber)",
    description: "Full control. Can manage billing, delete the workspace, and transfer ownership.",
    permissions: ["billing", "members", "roles", "orders", "products", "customers", "settings", "ai", "audit"],
  },
  {
    id: "admin",
    name: "Admin",
    icon: Shield,
    tone: "var(--color-brand-600)",
    description: "Manage the store and team. Cannot delete the workspace or change billing.",
    permissions: ["members", "roles", "orders", "products", "customers", "settings", "ai", "audit"],
  },
  {
    id: "manager",
    name: "Manager",
    icon: UserCog,
    tone: "var(--color-accent-violet)",
    description: "Operate the catalog and fulfillment. Cannot change global settings.",
    permissions: ["orders", "products", "customers", "ai"],
  },
  {
    id: "support",
    name: "Support",
    icon: Headphones,
    tone: "var(--color-accent-mint)",
    description: "Respond to customers and orders. Read-only on products and analytics.",
    permissions: ["orders", "customers", "ai"],
  },
  {
    id: "viewer",
    name: "Viewer",
    icon: Eye,
    tone: "var(--color-text-subtle)",
    description: "Read-only access. Useful for analysts and stakeholders.",
    permissions: ["orders", "products", "customers"],
  },
];

const roleById = Object.fromEntries(roles.map((r) => [r.id, r])) as Record<RoleId, RoleDef>;

interface Member {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  lastActive: string;
  status: "active" | "invited";
}

interface ServerMember {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  createdAt: string;
}

interface ToggleItem {
  id: string;
  name: string;
  desc: string;
}

const toggleItems: ToggleItem[] = [
  { id: "orders", name: "Order updates", desc: "Alerts for new, refunded, or stalled orders." },
  { id: "low", name: "Low stock warnings", desc: "Nudge when SKUs dip below threshold." },
  { id: "weekly", name: "Weekly digest", desc: "Performance summary every Monday." },
  { id: "ai", name: "AI insights", desc: "Recommendations from the IntelliCart copilot." },
];

function RolePill({ role, onChange, disabled }: { role: RoleId; onChange: (r: RoleId) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const r = roleById[role];
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Open → focus the current role; arrows move between options; Escape closes.
  useEffect(() => {
    if (open) wrapRef.current?.querySelector<HTMLElement>('[aria-selected="true"], [role="option"]')?.focus();
  }, [open]);
  function onKeyDown(e: KeyboardEvent) {
    if (!open) return;
    const options = [...(wrapRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const i = options.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      options[(i + step + options.length) % options.length]?.focus();
    }
  }

  return (
    <div className="relative" ref={wrapRef} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-[10px] border transition-colors text-[12.5px] font-medium",
          "bg-[var(--color-surface)] border-[var(--color-border)]",
          disabled ? "opacity-70 cursor-not-allowed" : "hover:border-[var(--color-border-strong)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklab, ${r.tone} 16%, transparent)`, color: r.tone }}
        >
          <r.icon size={11} />
        </span>
        <span>{r.name}</span>
        {!disabled && <ChevronDown size={12} className="text-subtle" />}
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute right-0 z-40 mt-1.5 w-56 card-surface !p-1 max-h-72 overflow-y-auto"
          >
            {roles
              .filter((opt) => opt.id !== "owner")
              .map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt.id === role}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-start gap-2.5 px-2 py-2 rounded-[8px] hover:bg-[var(--color-surface-2)] text-left transition-colors"
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `color-mix(in oklab, ${opt.tone} 16%, transparent)`, color: opt.tone }}
                    >
                      <opt.icon size={12} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                        {opt.name}
                        {opt.id === role && <Check size={12} className="text-[var(--color-brand-600)]" />}
                      </span>
                      <span className="text-[11.5px] text-muted line-clamp-2 block mt-0.5">{opt.description}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    orders: true,
    low: true,
    weekly: false,
    ai: true,
  });
  // The team comes from admin_users. Role changes are enforced server-side —
  // the permission table here only decides what to render.
  const memberState = useApi(
    () => api.get<{ items: ServerMember[] }>("/admin/members"),
    [],
  );
  const members: Member[] = (memberState.data?.items ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    lastActive: new Date(m.createdAt).toLocaleDateString(),
    status: "active" as const,
  }));

  async function setMemberRole(id: string, role: RoleId) {
    const member = memberState.data?.items.find((m) => m.id === id);
    if (member?.role === role) return;
    if (!window.confirm(`Change ${member?.name ?? "this member"} to ${roleById[role].name}? Their access changes immediately.`)) return;
    // The server refuses to demote the last owner; the toast says why and the reload snaps back.
    await reportWrite(api.patch(`/admin/members/${id}`, { role }), "Role updated");
    memberState.reload();
  }
  const [memberFilter, setMemberFilter] = useState<"all" | RoleId>("all");
  const [memberQuery, setMemberQuery] = useState("");

  const filteredMembers = useMemo(
    () =>
      members.filter((m) => {
        const matchRole = memberFilter === "all" || m.role === memberFilter;
        const q = memberQuery.toLowerCase();
        const matchQ = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
        return matchRole && matchQ;
      }),
    [members, memberFilter, memberQuery]
  );

  const roleCounts = useMemo(() => {
    const counts: Record<RoleId, number> = { owner: 0, admin: 0, manager: 0, support: 0, viewer: 0 };
    for (const m of members) counts[m.role]++;
    return counts;
  }, [members]);


  if (memberState.error) {
    return <ErrorStateBanner message={memberState.error.message} onRetry={memberState.reload} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configuration" title="Settings" description="Tune your workspace, commerce stack, and security posture." />

      <Card className="relative overflow-hidden fade-up">
        <span className="absolute inset-0 bg-aurora opacity-70 pointer-events-none" aria-hidden />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div
            className="w-16 h-16 rounded-[16px] shrink-0 flex items-center justify-center text-white text-[22px] font-bold shadow-[var(--shadow-card)]"
            style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))" }}
          >
            A
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-semibold tracking-tight">IntelliCart Commerce</h3>
            <p className="text-[13px] text-muted mt-0.5">Workspace · founded 2024 · UTC+05:30</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={13} /> hello@intellicart.shop
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe size={13} /> intellicart.shop
              </span>
              <span className="chip chip-success">Plan: Growth</span>
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-sm self-start lg:self-auto">
            Edit profile
          </button>
        </div>
      </Card>

      {/* Team & Roles */}
      <Card padded={false} className="overflow-hidden fade-up">
        <div className="p-5 pb-3 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)] mb-1">
              Access control
            </p>
            <h3 className="text-[18px] font-semibold tracking-tight flex items-center gap-2">
              Team & roles
            </h3>
            <p className="text-[13px] text-muted mt-1">
              Assign roles to control who can see and change what across the workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost btn-sm">
              <Shield size={13} /> Manage permissions
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <UserPlus size={13} /> Invite member
            </button>
          </div>
        </div>

        <div className="px-5 pt-2 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setMemberFilter((f) => (f === r.id ? "all" : r.id))}
              className={cn(
                "soft-surface px-3 py-3 text-left hover:border-[var(--color-border-strong)] transition-colors",
                memberFilter === r.id && "border-[var(--color-brand-500)] ring-2 ring-[color-mix(in_oklab,var(--color-brand-500)_18%,transparent)]"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklab, ${r.tone} 16%, transparent)`, color: r.tone }}
                >
                  <r.icon size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight truncate">{r.name}</p>
                  <p className="text-[11px] text-subtle">{r.permissions.length} permissions</p>
                </div>
                <span className="text-[14px] font-semibold tabular-nums text-[var(--color-text)]">
                  {roleCounts[r.id]}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 pt-2 pb-4 flex flex-col md:flex-row md:items-center gap-3 border-t border-[var(--color-border)]">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            <input
              className="input pl-9 h-9"
              placeholder="Search members…"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
            />
          </div>
          {memberFilter !== "all" && (
            <button
              type="button"
              onClick={() => setMemberFilter("all")}
              className="text-[12px] font-medium text-muted hover:text-[var(--color-text)] transition-colors"
            >
              Clear filter · showing {roleById[memberFilter].name}
            </button>
          )}
          <p className="text-[12px] text-muted ml-auto">
            {filteredMembers.length} of {members.length} members
          </p>
        </div>

        <div className="overflow-x-auto border-t border-[var(--color-border)]">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-b border-[var(--color-border)]">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Last active</th>
                <th className="px-5 py-3 font-semibold w-12" />
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{m.name}</p>
                          {m.status === "invited" && <span className="chip chip-pending">Invited</span>}
                        </div>
                        <p className="text-[11.5px] text-subtle truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <RolePill
                      role={m.role}
                      disabled={m.role === "owner"}
                      onChange={(r) => void setMemberRole(m.id, r)}
                    />
                  </td>
                  <td className="px-5 py-3 text-muted whitespace-nowrap">{m.lastActive}</td>
                  <td className="px-5 py-3">
                    <button type="button" className="btn btn-icon btn-sm btn-ghost" aria-label="More">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted">
                    No members match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role definitions + permissions matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card padded={false} className="xl:col-span-2 overflow-hidden fade-up">
          <div className="p-5 pb-3">
            <CardHeader title="Role definitions" subtitle="What each role can do" eyebrow="Reference" className="mb-0" />
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {roles.map((r) => (
              <li key={r.id} className="px-5 py-3.5 flex items-start gap-3">
                <span
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklab, ${r.tone} 14%, transparent)`, color: r.tone }}
                >
                  <r.icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold">{r.name}</p>
                    <span className="text-[11px] text-subtle tabular-nums">{r.permissions.length} permissions</span>
                  </div>
                  <p className="text-[12.5px] text-muted mt-0.5">{r.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card padded={false} className="xl:col-span-3 overflow-hidden fade-up">
          <div className="p-5 pb-3">
            <CardHeader
              title="Permissions matrix"
              subtitle="Quick reference of capabilities per role"
              eyebrow="Capabilities"
              className="mb-0"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-subtle border-y border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-semibold">Capability</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-3 py-2.5 font-semibold text-center">
                      <span className="inline-flex items-center gap-1">
                        <r.icon size={11} style={{ color: r.tone }} />
                        {r.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "billing", label: "Billing & plan" },
                  { key: "members", label: "Manage members" },
                  { key: "roles", label: "Change roles" },
                  { key: "settings", label: "Workspace settings" },
                  { key: "products", label: "Products & catalog" },
                  { key: "orders", label: "Orders & fulfillment" },
                  { key: "customers", label: "Customer data" },
                  { key: "ai", label: "AI Hub" },
                  { key: "audit", label: "Audit logs" },
                ].map((cap) => (
                  <tr
                    key={cap.key}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-2.5 text-muted">{cap.label}</td>
                    {roles.map((r) => {
                      const allowed = r.permissions.includes(cap.key);
                      return (
                        <td key={r.id} className="px-3 py-2.5 text-center">
                          {allowed ? (
                            <span
                              className="inline-flex w-5 h-5 rounded-full items-center justify-center"
                              style={{ background: `color-mix(in oklab, ${r.tone} 18%, transparent)`, color: r.tone }}
                            >
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-block w-2 h-0.5 rounded-full bg-[var(--color-border-strong)]" aria-label="Not allowed" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {groups.map((g) => (
            <Card key={g.title} padded={false} className="overflow-hidden fade-up">
              <div className="px-5 pt-5 pb-2">
                <CardHeader title={g.title} className="mb-0" eyebrow="Section" />
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {g.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.to}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--color-surface-2)] transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-600)] group-hover:bg-[var(--color-brand-50)] dark:group-hover:bg-[color-mix(in_oklab,var(--color-brand-500)_18%,transparent)] transition-colors shrink-0">
                        <item.icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold">{item.name}</p>
                        <p className="text-[12.5px] text-muted truncate">{item.desc}</p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-subtle group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-transform shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card padded={false} className="overflow-hidden fade-up">
            <div className="px-5 pt-5 pb-2">
              <CardHeader title="Notifications" subtitle="Stay informed when it matters" eyebrow="Alerts" className="mb-0" />
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {toggleItems.map((t) => (
                <li key={t.id} className="px-5 py-3.5 flex items-start gap-4">
                  <Bell size={15} className="text-subtle mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{t.name}</p>
                    <p className="text-[12.5px] text-muted">{t.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={toggles[t.id]}
                    aria-label={t.name}
                    data-on={toggles[t.id]}
                    onClick={() => setToggles((s) => ({ ...s, [t.id]: !s[t.id] }))}
                    className={cn("switch")}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="fade-up">
            <CardHeader title="Danger zone" eyebrow="Caution" />
            <p className="text-[13px] text-muted">
              Operations here are irreversible. Make sure you have a recent export before continuing.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="btn btn-ghost btn-sm justify-between" disabled title="Coming soon">
                Export workspace data <ChevronRight size={14} />
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="btn btn-sm justify-between"
                style={{
                  background: "color-mix(in oklab, var(--color-accent-rose) 10%, transparent)",
                  color: "var(--color-accent-rose)",
                  borderColor: "color-mix(in oklab, var(--color-accent-rose) 30%, transparent)",
                  border: "1px solid",
                }}
              >
                Delete workspace <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
