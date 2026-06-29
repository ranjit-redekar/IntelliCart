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

const entries: Entry[] = [
  { id: "e1", actor: "Ranjit Redekar", email: "ranjit@intellicart.shop", category: "settings", action: "Updated store profile", target: "IntelliCart Commerce", ip: "203.0.113.42", when: "Just now", severity: "info" },
  { id: "e2", actor: "Priya Sharma", email: "priya@intellicart.shop", category: "team", action: "Changed role", target: "Arjun Mehta → Manager", ip: "203.0.113.51", when: "12 min ago", severity: "warn" },
  { id: "e3", actor: "Arjun Mehta", email: "arjun@intellicart.shop", category: "product", action: "Updated price", target: "Smart Watch ($199 → $189)", ip: "198.51.100.7", when: "27 min ago", severity: "info" },
  { id: "e4", actor: "Lea Park", email: "lea@intellicart.shop", category: "order", action: "Refunded order", target: "ORD-8902 (₹89)", ip: "198.51.100.7", when: "1 hour ago", severity: "warn" },
  { id: "e5", actor: "Ranjit Redekar", email: "ranjit@intellicart.shop", category: "key", action: "Revoked API key", target: "sk_test_5c91… (Sandbox)", ip: "203.0.113.42", when: "3 hours ago", severity: "critical" },
  { id: "e6", actor: "Priya Sharma", email: "priya@intellicart.shop", category: "payment", action: "Connected gateway", target: "Razorpay", ip: "203.0.113.51", when: "Yesterday", severity: "info" },
  { id: "e7", actor: "System", email: "system@intellicart.shop", category: "auth", action: "Failed sign-in attempt", target: "devon@intellicart.shop (×3)", ip: "192.0.2.99", when: "Yesterday", severity: "critical" },
  { id: "e8", actor: "Arjun Mehta", email: "arjun@intellicart.shop", category: "promo", action: "Launched campaign", target: "Weekend Boost", ip: "198.51.100.7", when: "2 days ago", severity: "info" },
];

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
    [cat, query]
  );

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
                <div className="min-w-0 flex-1">
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
