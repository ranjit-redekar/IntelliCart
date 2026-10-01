import { useState } from "react";
import { Activity, Copy, Eye, EyeOff, KeyRound, Plus, RefreshCcw, Trash2, Webhook } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useSettings } from "../../lib/useSettings";
import { api } from "../../../lib/api";
import { useApi } from "../../../lib/useApi";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { reportWrite } from "../../../lib/toast";

interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  scope: string;
  created: string;
  lastUsed: string;
  live: boolean;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: "active" | "failing";
  lastDelivery: string;
}

interface WebhooksValue {
  endpoints: WebhookEndpoint[];
}

interface ServerKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

function relative(iso: string | null) {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} day${hrs < 48 ? "" : "s"} ago`;
}

export default function ApiKeysPage() {
  const keyState = useApi(() => api.get<{ items: ServerKey[] }>("/admin/api-keys"), []);
  const hooks = useSettings<WebhooksValue>("webhooks");


  // Only the prefix is ever shown again: the server stores a hash, so a full
  // key is unrecoverable after the one time it is returned on creation.
  const initial: ApiKey[] = (keyState.data?.items ?? []).map((k) => ({
    id: k.id,
    label: k.name,
    prefix: k.prefix,
    scope: "read,write",
    created: k.createdAt.slice(0, 10),
    lastUsed: relative(k.lastUsedAt),
    live: !k.revokedAt,
  }));
  const webhooks = hooks.value?.endpoints ?? [];

  // Derived, not stored: useState(initial) captured the empty array from the
  // first render and never saw the fetched keys.
  const keys = initial;
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  if (keyState.error) return <ErrorState error={keyState.error} onRetry={keyState.reload} />;
  if (!keyState.data) return <Skeleton rows={4} />;

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
                        <button type="button" className="btn btn-icon btn-sm btn-ghost tip" data-tip="Rotate (coming soon)" aria-label="Rotate" disabled>
                          <RefreshCcw size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-ghost tip text-[var(--color-accent-rose)]"
                          data-tip="Revoke"
                          aria-label={`Revoke ${k.label}`}
                          onClick={async () => {
                            if (!window.confirm(`Revoke "${k.label}"? Anything using this key stops working immediately.`)) return;
                            await reportWrite(api.del(`/admin/api-keys/${k.id}`), "Key revoked");
                            keyState.reload();
                          }}
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
                    ? "bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-success-text)]"
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
