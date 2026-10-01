import { useState } from "react";
import { AlertTriangle, Check, Database, Loader2, RefreshCw } from "lucide-react";
import SettingsLayout from "../../components/SettingsLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { api, ApiError } from "../../../lib/api";
import { useApi } from "../../../lib/useApi";
import { ErrorState, Skeleton } from "../../../lib/AsyncBoundary";
import { useSession } from "../../lib/session";
import { cn } from "../../lib/cn";

interface Dataset {
  key: string;
  label: string;
  rows: number;
  tables: string[];
  preserved: boolean;
}

interface DatasetOption {
  key: string;
  label: string;
  description: string;
  requires: string[];
}

interface DemoStatus {
  datasets: Dataset[];
  available: DatasetOption[];
  enabled: boolean;
  allowedForYou: boolean;
  environment: string;
  confirmPhrase: string;
  demoPassword: string | null;
  isEmpty: boolean;
  totalRows: number;
  counts: Record<string, number>;
}

interface SeedResponse {
  ok: true;
  tookMs: number;
  seeded: Record<string, number>;
  before: Record<string, number>;
  after: Record<string, number>;
  demoPassword: string | null;
}

export default function DemoDataPage() {
  const { user } = useSession();
  const status = useApi(() => api.get<DemoStatus>("/admin/demo/status"), []);
  const [confirm, setConfirm] = useState("");
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const s = status.data;
  const phrase = s?.confirmPhrase ?? "RESET DEMO DATA";
  const options = s?.available ?? [];
  // Default to everything; `null` means "not touched yet".
  const selection = picked ?? new Set(options.map((o) => o.key));
  const canRun =
    Boolean(s?.allowedForYou) && confirm.trim() === phrase && selection.size > 0 && !running;

  /** Ticking pulls in dependencies; unticking drops whatever needed it. */
  function toggle(key: string) {
    const next = new Set(selection);
    if (next.has(key)) {
      next.delete(key);
      for (const o of options) if (o.requires.includes(key)) next.delete(o.key);
    } else {
      next.add(key);
      const addDeps = (k: string) => {
        for (const dep of options.find((o) => o.key === k)?.requires ?? []) {
          if (!next.has(dep)) {
            next.add(dep);
            addDeps(dep);
          }
        }
      };
      addDeps(key);
    }
    setPicked(next);
  }

  async function reseed() {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.post<SeedResponse>("/admin/demo/seed", {
        confirm: confirm.trim(),
        datasets: [...selection],
      });
      setResult(r);
      setConfirm("");
      setPicked(null);
      status.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reseed the database.");
    } finally {
      setRunning(false);
    }
  }

  if (status.error) return <ErrorState error={status.error} onRetry={status.reload} />;

  return (
    <SettingsLayout
      title="Demo data"
      subtitle="Load the sample catalog, customers and orders into the database, or reset back to a known state."
      icon={Database}
    >
      {!s ? (
        <Skeleton rows={4} />
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader
              eyebrow="Current"
              title="What's in the database"
              subtitle={`${s.totalRows.toLocaleString()} rows across all tables · ${s.environment}`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {s.datasets.map((d) => (
                <div key={d.key} className="soft-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11.5px] text-subtle uppercase tracking-[0.08em]">{d.label}</p>
                    {d.preserved && <Chip tone="neutral">Kept</Chip>}
                  </div>
                  <p className="text-[20px] font-semibold tabular-nums mt-0.5">
                    {d.rows.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-subtle mt-0.5">
                    {d.tables.length} {d.tables.length === 1 ? "table" : "tables"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] text-muted">
              Reloading replaces everything above except <strong>Team &amp; keys</strong>, so you stay
              signed in.
            </p>
            {s.isEmpty && (
              <p className="mt-4 text-[13px] text-muted">
                The catalog is empty — nothing will render on the storefront until you load the
                sample data below.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              eyebrow="Reset"
              title="Load sample data"
              subtitle="Replaces the catalog, customers, orders, reviews and settings."
              action={
                s.enabled ? (
                  <Chip tone="pending">Destructive</Chip>
                ) : (
                  <Chip tone="neutral">Disabled here</Chip>
                )
              }
            />

            {s.allowedForYou && options.length > 0 && (
              <div className="soft-surface p-4 mb-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  What to load
                </p>
                <p className="text-[12.5px] text-muted mt-0.5">
                  Anything a choice depends on is ticked for you. Only what you select is replaced.
                </p>
                <div className="mt-3 space-y-1.5">
                  {options.map((option) => {
                    const on = selection.has(option.key);
                    const impliedBy = options.filter(
                      (o) => selection.has(o.key) && o.requires.includes(option.key),
                    );
                    return (
                      <label
                        key={option.key}
                        className={cn(
                          "flex items-start gap-3 rounded-[10px] px-3 py-2.5 cursor-pointer border transition-colors",
                          on
                            ? "border-[var(--color-brand-500)] bg-[color-mix(in_oklab,var(--color-brand-500)_7%,transparent)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={on}
                          onChange={() => toggle(option.key)}
                          disabled={running}
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium">{option.label}</span>
                          <span className="block text-[12px] text-muted">{option.description}</span>
                          {on && impliedBy.length > 0 && (
                            <span className="block text-[11.5px] text-subtle mt-0.5">
                              Needed by {impliedBy.map((o) => o.label).join(", ")}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[12px] text-subtle mt-3">
                  {selection.size} of {options.length} selected.
                </p>
              </div>
            )}

            <div
              className="rounded-[12px] border p-4 flex gap-3"
              style={{
                borderColor: "color-mix(in oklab, var(--color-accent-amber) 32%, var(--color-border))",
                background: "color-mix(in oklab, var(--color-accent-amber) 8%, transparent)",
              }}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-accent-amber)]" />
              <div className="text-[13px] leading-relaxed">
                <p className="font-semibold text-[var(--color-text)]">
                  This replaces {selection.size === options.length ? "everything" : "the selected data"}, permanently.
                </p>
                <p className="text-muted mt-1">
                  There is no undo. Admin accounts are kept, so you stay signed in. Carts and cached
                  data are cleared too. Replacing the catalog also clears the orders that point at it.
                </p>
              </div>
            </div>

            {!s.enabled ? (
              <p className="mt-4 text-[13px] text-muted">
                Seeding is turned off on this environment. Set <code>ALLOW_DEMO_SEED=true</code> to
                enable it — it defaults to off in production.
              </p>
            ) : !s.allowedForYou ? (
              <p className="mt-4 text-[13px] text-muted">
                Only an owner can reset demo data. You are signed in as{" "}
                <span className="font-semibold text-[var(--color-text)]">{user?.role}</span>.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[12.5px] font-medium">
                    Type <span className="font-mono font-semibold">{phrase}</span> to confirm
                  </span>
                  <input
                    className="input mt-1.5 font-mono"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder={phrase}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={running}
                  />
                </label>
                <button
                  type="button"
                  onClick={reseed}
                  disabled={!canRun}
                  className="btn btn-primary"
                  style={!canRun ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                >
                  {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {running ? "Loading sample data…" : "Load sample data"}
                </button>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 text-[13px] rounded-[10px] px-3 py-2.5"
                style={{
                  color: "var(--color-accent-rose)",
                  background: "color-mix(in oklab, var(--color-accent-rose) 10%, transparent)",
                }}
              >
                {error}
              </p>
            )}

            {result && (
              <div
                className="mt-4 rounded-[12px] p-4"
                style={{ background: "color-mix(in oklab, var(--color-accent-mint) 10%, transparent)" }}
              >
                <p className="text-[13.5px] font-semibold inline-flex items-center gap-2">
                  <Check size={15} className="text-[var(--color-success-text)]" />
                  Loaded in {(result.tookMs / 1000).toFixed(1)}s
                </p>
                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[12.5px]">
                  {Object.entries(result.seeded)
                    .filter(([key]) => key !== "skippedOrders")
                    .map(([key, n]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <dt className="text-muted capitalize">
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </dt>
                        <dd className="tabular-nums font-medium">{n}</dd>
                      </div>
                    ))}
                </dl>
                {result.demoPassword && (
                  <p className="mt-3 text-[12.5px] text-muted">
                    Every seeded account uses the password{" "}
                    <code className="font-semibold">{result.demoPassword}</code>.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </SettingsLayout>
  );
}
