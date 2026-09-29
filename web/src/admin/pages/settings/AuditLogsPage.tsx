import { useMemo, useState } from "react";
import {
  CreditCard,
  Download,
  KeyRound,
  Package,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Avatar } from "../../components/ui/Avatar";
import { cn } from "../../lib/cn";
import { api, qs, type Page } from "../../../lib/api";
import { useApi } from "../../../lib/useApi";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";

type Severity = "info" | "warn" | "critical";

interface Entry {
  id: string;
  actor: string;
  email: string;
  category: "auth" | "team" | "product" | "order" | "payment" | "settings" | "key" | "promo";
  action: string;
  target: string;
  ip: string;
  when: string;
  severity: Severity;
}

interface AuditRow {
  id: number;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  at: string;
}

/** Map a stored entity onto the categories this screen filters by. */
const CATEGORY_FOR: Record<string, Entry["category"]> = {
  product: "product",
  order: "order",
  admin_user: "team",
  settings: "settings",
  feedback: "product",
  promotion: "promo",
  api_key: "key",
  payment: "payment",
  session: "auth",
};

function severityFor(action: string): Severity {
  if (/delete|revoke|remove/.test(action)) return "critical";
  if (/role|status|settings|archive/.test(action)) return "warn";
  return "info";
}

function relative(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} day${hrs < 48 ? "" : "s"} ago`;
}

const categoryMeta: Record<Entry["category"], { icon: LucideIcon; label: string; tone: string }> = {
  auth: { icon: ShieldCheck, label: "Auth", tone: "var(--color-accent-rose)" },
  team: { icon: Users, label: "Team", tone: "var(--color-brand-500)" },
  product: { icon: Package, label: "Product", tone: "var(--color-accent-violet)" },
  order: { icon: ShoppingBag, label: "Order", tone: "var(--color-accent-amber)" },
  payment: { icon: CreditCard, label: "Payment", tone: "var(--color-accent-mint)" },
  settings: { icon: SettingsIcon, label: "Settings", tone: "var(--color-accent-sky)" },
  key: { icon: KeyRound, label: "Key", tone: "var(--color-accent-rose)" },
  promo: { icon: Tag, label: "Promo", tone: "var(--color-accent-amber)" },
};

const severityTone: Record<Severity, "neutral" | "pending" | "danger"> = {
  info: "neutral",
  warn: "pending",
  critical: "danger",
};

const filters = [
  { id: "all" as const, label: "All", icon: SettingsIcon },
  { id: "auth" as const, label: "Auth", icon: ShieldCheck },
  { id: "team" as const, label: "Team", icon: UserCog },
  { id: "product" as const, label: "Product", icon: Package },
  { id: "order" as const, label: "Order", icon: ShoppingBag },
  { id: "payment" as const, label: "Payment", icon: CreditCard },
  { id: "key" as const, label: "Key", icon: KeyRound },
];

export default function AuditLogsPage() {
  // Written by the worker, which drains the Redis stream the API appends to.
  const state = useApi(
    () => api.get<Page<AuditRow>>(`/admin/audit${qs({ pageSize: 50 })}`),
    [],
  );


  const entries: Entry[] = (state.data?.items ?? []).map((r) => ({
    id: String(r.id),
    actor: r.actorEmail?.split("@")[0] ?? "system",
    email: r.actorEmail ?? "—",
    category: CATEGORY_FOR[r.entity] ?? "settings",
    action: r.action,
    target: r.entityId ?? r.entity,
    ip: "—",
    when: relative(r.at),
    severity: severityFor(r.action),
  }));

  const [cat, setCat] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(
    () =>
      entries.filter((e) => {
        const matchC = cat === "all" || e.category === cat;
        const q = query.toLowerCase();
        const matchQ = !q || e.actor.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q);
        return matchC && matchQ;
      }),
    // `entries` belongs here: without it the memo keeps the empty first render
    // and the table stays blank once the rows actually arrive.
    [entries, cat, query]
  );

  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return <Skeleton rows={5} />;

  return (
    <SettingsLayout
      title="Audit logs"
      subtitle="Every consequential action across the workspace — who, what, when, and from where."
      icon={ShieldCheck}
      tone="var(--color-accent-rose)"
      actions={
        <>
          <button type="button" className="btn btn-ghost btn-sm">
            <Download size={13} /> Export CSV
          </button>
          <button type="button" className="btn btn-ghost btn-sm">
            <Trash2 size={13} /> Retention
          </button>
        </>
      }
    >
      <Card padded={false} className="overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-[var(--color-border)]">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            <input
              className="input pl-9 h-9"
              placeholder="Search actor, action, or target…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCat(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-[8px] text-[12.5px] font-medium border whitespace-nowrap transition-colors",
                  cat === f.id
                    ? "bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-transparent"
                    : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
                )}
              >
                <f.icon size={12} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-[var(--color-border)]">
          {list.map((e) => {
            const meta = categoryMeta[e.category];
            return (
              <li
                key={e.id}
                className="px-5 py-3.5 flex flex-wrap items-start gap-3 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <span
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklab, ${meta.tone} 14%, transparent)`, color: meta.tone }}
                >
                  <meta.icon size={14} />
                </span>
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold">{e.action}</p>
                    <Chip tone={severityTone[e.severity]}>{e.severity}</Chip>
                  </div>
                  <p className="text-[12.5px] text-muted mt-0.5 truncate">{e.target}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Avatar name={e.actor} size={26} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium truncate">{e.actor}</p>
                    <p className="text-[11px] text-subtle truncate">{e.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 min-w-[140px]">
                  <p className="text-[12.5px] font-medium tabular-nums">{e.when}</p>
                  <p className="text-[11px] text-subtle tabular-nums">{e.ip}</p>
                </div>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="px-5 py-10 text-center text-muted text-[13px]">No events match those filters.</li>
          )}
        </ul>
      </Card>
    </SettingsLayout>
  );
}
