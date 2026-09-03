import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Database, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { Skeleton } from "../../lib/AsyncBoundary";
import { useSession } from "../lib/session";
import { cn } from "../lib/cn";

interface DatasetOption {
  key: string;
  label: string;
  description: string;
  requires: string[];
}

interface SetupStatus {
  needsSetup: boolean;
  canSeed: boolean;
  datasets: DatasetOption[];
}

/** Pre-ticked: a store with nothing in it is hard to evaluate. */
const DEFAULT_SELECTION = [
  "catalog", "customers", "orders", "reviews", "merchandising", "aiContent", "settings",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user, refresh } = useSession();
  const status = useApi(() => api.get<SetupStatus>("/auth/setup-status"), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set(DEFAULT_SELECTION));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Memoised so the lookup below is not rebuilt on every render.
  const options = useMemo(() => status.data?.datasets ?? [], [status.data]);
  const byKey = useMemo(() => new Map(options.map((o) => [o.key, o])), [options]);

  /** Ticking a dataset ticks whatever it needs; unticking clears dependants. */
  function toggle(key: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
        for (const option of options) {
          if (option.requires.includes(key)) next.delete(option.key);
        }
      } else {
        next.add(key);
        const addDeps = (k: string) => {
          for (const dep of byKey.get(k)?.requires ?? []) {
            if (!next.has(dep)) {
              next.add(dep);
              addDeps(dep);
            }
          }
        };
        addDeps(key);
      }
      return next;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
        datasets: [...picked],
      });
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.details ?? {});
      } else {
        setError("Could not create the account. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (user) return <Navigate to="/dashboard" replace />;
  if (status.loading && !status.data) return <Skeleton rows={6} />;
  // Someone already claimed this store — there is nothing to set up.
  if (status.data && !status.data.needsSetup) return <Navigate to="/sign-in" replace />;

  const fieldError = (key: string) => fieldErrors[key]?.[0];

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-[var(--color-bg)]">
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(145deg, #0b1020 0%, color-mix(in oklab, var(--color-brand-500) 34%, #0b1020) 100%)",
        }}
      >
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase opacity-80">
            <Sparkles size={13} /> First run
          </span>
          <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.02em] font-semibold mt-5 max-w-[420px]">
            Set up your workspace
          </h1>
          <p className="text-[14.5px] opacity-75 mt-3 max-w-[400px] leading-relaxed">
            Create the owner account. You can load a sample store at the same time, so every screen
            has something in it while you look around.
          </p>
        </div>
        <ul className="relative space-y-3 text-[13.5px] opacity-80">
          {["A catalog, customers and months of orders", "Reviews written against real purchases", "Every settings and AI screen populated"].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <Check size={15} className="mt-0.5 shrink-0" /> {line}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <form onSubmit={submit} className="w-full max-w-[520px] space-y-6">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Create account
            </p>
            <h2 className="font-display text-[26px] tracking-tight font-semibold mt-1">
              You're the first one here
            </h2>
            <p className="text-[13.5px] text-muted mt-1.5">
              This account becomes the owner and can invite everyone else.
            </p>
          </div>

          <div className="space-y-3.5">
            <label className="block">
              <span className="text-[12.5px] font-medium">Your name</span>
              <input
                className="input mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              {fieldError("name") && (
                <span className="text-[12px]" style={{ color: "var(--color-accent-rose)" }}>
                  {fieldError("name")}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-[12.5px] font-medium">Work email</span>
              <input
                type="email"
                className="input mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {fieldError("email") && (
                <span className="text-[12px]" style={{ color: "var(--color-accent-rose)" }}>
                  {fieldError("email")}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-[12.5px] font-medium">Password</span>
              <span className="relative block mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-[var(--color-text)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
              <span className="text-[11.5px] text-subtle mt-1 block">At least 8 characters.</span>
              {fieldError("password") && (
                <span className="text-[12px]" style={{ color: "var(--color-accent-rose)" }}>
                  {fieldError("password")}
                </span>
              )}
            </label>
          </div>

          {status.data?.canSeed && (
            <div className="card-surface p-4">
              <div className="flex items-start gap-2.5">
                <Database size={15} className="mt-0.5 text-[var(--color-brand-600)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">Load sample data</p>
                  <p className="text-[12.5px] text-muted mt-0.5">
                    Optional. Pick what you want — anything a choice depends on is ticked for you.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 space-y-1.5">
                {options.map((option) => {
                  const on = picked.has(option.key);
                  const impliedBy = options.filter(
                    (o) => picked.has(o.key) && o.requires.includes(option.key),
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
                        disabled={busy}
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
                {picked.size === 0
                  ? "Nothing selected — you'll start with an empty store."
                  : `${picked.size} of ${options.length} selected. You can reload or change this later in Settings → Demo data.`}
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="text-[13px] rounded-[10px] px-3 py-2.5"
              style={{
                color: "var(--color-accent-rose)",
                background: "color-mix(in oklab, var(--color-accent-rose) 10%, transparent)",
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full justify-center" disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            {busy
              ? picked.size
                ? "Creating account and loading data…"
                : "Creating account…"
              : "Create owner account"}
            {!busy && <ArrowRight size={14} />}
          </button>
        </form>
      </main>
    </div>
  );
}
