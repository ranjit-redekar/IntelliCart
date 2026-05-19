import { useState } from "react";
import { Activity, Copy, Eye, EyeOff, KeyRound, Plus, RefreshCcw, Trash2, Webhook } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";

interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  scope: string;
  created: string;
  lastUsed: string;
  live: boolean;
}

const initial: ApiKey[] = [
  { id: "k1", label: "Production · Storefront", prefix: "sk_live_8f3a", scope: "read,write", created: "2025-11-12", lastUsed: "2 min ago", live: true },
  { id: "k2", label: "Production · Webhooks", prefix: "sk_live_a1b2", scope: "read", created: "2025-09-08", lastUsed: "12 hours ago", live: true },
  { id: "k3", label: "Sandbox · Local dev", prefix: "sk_test_5c91", scope: "read,write", created: "2025-08-22", lastUsed: "Yesterday", live: false },
];

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: "active" | "failing";
  lastDelivery: string;
}

const webhooks: WebhookEndpoint[] = [
  { id: "w1", url: "https://api.intellicart.shop/v1/webhooks/orders", events: ["order.created", "order.fulfilled"], status: "active", lastDelivery: "1 min ago" },
  { id: "w2", url: "https://hooks.zapier.com/intellicart/customers", events: ["customer.created"], status: "active", lastDelivery: "27 min ago" },
  { id: "w3", url: "https://logs.internal.intellicart/ingest", events: ["product.updated", "stock.low"], status: "failing", lastDelivery: "4 hours ago" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(initial);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  return (
    <SettingsLayout
      title="API keys"
      subtitle="Service tokens and webhooks. Treat keys like passwords — rotate often and scope to least privilege."
      icon={KeyRound}
      tone="var(--color-accent-amber)"
      actions={
        <button type="button" className="btn btn-primary btn-sm">
          <Plus size={13} /> Create key
        </button>
      }
    >
      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3">
          <CardHeader title="Secret keys" subtitle="Used by your servers — never expose to a browser" eyebrow="Server" className="mb-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle border-y border-[var(--color-border)]">
                <th className="px-5 py-2.5 font-semibold">Label</th>
                <th className="px-5 py-2.5 font-semibold">Key</th>
                <th className="px-5 py-2.5 font-semibold">Scope</th>
                <th className="px-5 py-2.5 font-semibold">Last used</th>
                <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const visible = reveal[k.id];
                const display = visible ? `${k.prefix}9b6cd1e02478ab8f2730` : `${k.prefix}${"•".repeat(20)}`;
                return (
                  <tr
                    key={k.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{k.label}</span>
                        {k.live ? <Chip tone="success">Live</Chip> : <Chip tone="neutral">Test</Chip>}
                      </div>
                      <p className="text-[11.5px] text-subtle mt-0.5">Created {k.created}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-1 font-mono text-[12px] tabular-nums">
                        <span className="truncate max-w-[220px]">{display}</span>
                        <button
                          type="button"
                          aria-label={visible ? "Hide" : "Reveal"}
                          onClick={() => setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))}
                          className="text-subtle hover:text-[var(--color-text)] transition-colors"
                        >
                          {visible ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button type="button" aria-label="Copy" className="text-subtle hover:text-[var(--color-text)] transition-colors">
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scope.split(",").map((s) => (
                          <Chip key={s} tone="neutral">
                            {s}
                          </Chip>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{k.lastUsed}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" className="btn btn-icon btn-sm btn-ghost tip" data-tip="Rotate" aria-label="Rotate">
                          <RefreshCcw size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-ghost tip text-[var(--color-accent-rose)]"
                          data-tip="Revoke"
                          aria-label="Revoke"
                          onClick={() => setKeys((all) => all.filter((x) => x.id !== k.id))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    No API keys yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3 flex items-end justify-between gap-3">
          <CardHeader title="Webhooks" subtitle="Outgoing event subscriptions" eyebrow="Events" className="mb-0" />
          <button type="button" className="btn btn-soft btn-sm">
            <Plus size={13} /> Add endpoint
          </button>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {webhooks.map((w) => (
            <li key={w.id} className="px-5 py-3.5 flex items-center gap-3">
              <span
                className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
                  w.status === "active"
                    ? "bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-accent-mint)]"
                    : "bg-[color-mix(in_oklab,var(--color-accent-rose)_14%,transparent)] text-[var(--color-accent-rose)]"
                }`}
              >
                <Webhook size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold truncate font-mono">{w.url}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {w.events.map((e) => (
                    <Chip key={e} tone="neutral">
                      {e}
                    </Chip>
                  ))}
                  <span className="text-[11.5px] text-subtle">· {w.lastDelivery}</span>
                </div>
              </div>
              {w.status === "active" ? <Chip tone="success">Active</Chip> : <Chip tone="danger">Failing</Chip>}
              <button type="button" className="btn btn-icon btn-sm btn-ghost tip" data-tip="Logs" aria-label="Logs">
                <Activity size={13} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </SettingsLayout>
  );
}
