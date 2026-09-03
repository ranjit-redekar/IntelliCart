import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import { adminDirectory, useSession } from "../lib/session";
import { cn } from "../lib/cn";

interface LocationState {
  from?: string;
}

const highlights = [
  {
    icon: Sparkles,
    title: "Ask, and it acts",
    body: "Draft replies, spot anomalies, act in one keystroke.",
  },
  {
    icon: Boxes,
    title: "Inventory that warns you",
    body: "Low-stock and reorder signals before you run out.",
  },
  {
    icon: MessageSquare,
    title: "Reviews, answered",
    body: "Sentiment triage with ready-to-send responses.",
  },
];

const roleBlurb: Record<string, string> = {
  owner: "Full access",
  manager: "Orders & catalog",
  staff: "Read-only",
};

const DEMO_PASSWORD = "demo1234";

/** Static marketing copy on the sign-in panel — not live store data, and it
 *  should not require an authenticated request to render. */
const MARKETING_STATS = [
  { id: "m1", label: "Revenue tracked", value: "$48,290", trend: "+12.4%" },
  { id: "m2", label: "Orders processed", value: "1,284", trend: "+8.1%" },
  { id: "m3", label: "Active customers", value: "892", trend: "+6.2%" },
];

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) {
    const from = (location.state as LocationState | null)?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  async function finish(nextEmail: string, nextPassword: string) {
    const result = await signIn(nextEmail, nextPassword);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const from = (location.state as LocationState | null)?.from ?? "/dashboard";
    navigate(from, { replace: true });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    // A real round trip now — no artificial delay needed for the button state.
    await finish(email, password);
  }

  async function signInAs(demoEmail: string) {
    if (busy) return;
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setBusy(true);
    await finish(demoEmail, DEMO_PASSWORD);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[var(--color-bg)]">
      {/* Brand canvas — deliberately dark in both themes. */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(145deg, #0b1020 0%, color-mix(in oklab, var(--color-brand-500) 34%, #0b1020) 52%, color-mix(in oklab, var(--color-accent-violet) 42%, #0b1020) 100%)",
        }}
      >
        <span className="absolute inset-0 bg-grid opacity-[0.10]" aria-hidden />
        <span
          className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
          style={{
            background: "radial-gradient(circle, var(--color-accent-violet), transparent 65%)",
          }}
          aria-hidden
        />

        <div className="relative flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[15px] font-bold"
            style={{ background: "rgba(255,255,255,0.16)" }}
          >
            A
          </span>
          <div className="leading-tight">
            <p className="text-[14.5px] font-semibold tracking-tight">IntelliCart</p>
            <p className="text-[11px] text-white/60">Commerce Admin</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur mb-4">
            <Sparkles size={11} /> AI-first commerce
          </span>
          <h2 className="font-display text-[34px] leading-[1.1] tracking-[-0.02em] font-semibold">
            Your store,
            <br />
            with AI on every screen.
          </h2>
          <ul className="mt-8 space-y-5 fade-up-stagger">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <li key={h.title} className="flex items-start gap-3">
                  <span
                    className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold">{h.title}</p>
                    <p className="text-[12.5px] text-white/65 mt-0.5">{h.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          {MARKETING_STATS.map((m) => (
            <div
              key={m.id}
              className="rounded-[14px] px-3.5 py-3 border border-white/10"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <p className="text-[11px] text-white/55">{m.label}</p>
              <p className="text-[17px] font-semibold tracking-tight tabular-nums mt-0.5">
                {m.value}
              </p>
              <p className="text-[11px] text-[#7ee2b8] inline-flex items-center gap-1 mt-0.5">
                <TrendingUp size={10} /> {m.trend}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <span
              className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white text-[15px] font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
              }}
            >
              A
            </span>
            <div className="leading-tight">
              <p className="text-[14.5px] font-semibold tracking-tight">IntelliCart</p>
              <p className="text-[11px] text-subtle">Commerce Admin</p>
            </div>
          </div>

          <h1 className="font-display text-[26px] tracking-tight font-semibold">Welcome back</h1>
          <p className="text-[13px] text-muted mt-1.5">
            Sign in to the workspace, or jump straight in with a demo role.
          </p>

          <form onSubmit={submit} className="space-y-4 mt-7">
            <label className="block">
              <span className="text-[12.5px] font-semibold">Email</span>
              <div className="relative mt-1.5">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                  type="email"
                  className="input pl-9 h-11"
                  placeholder="you@intellicart.shop"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold">Password</span>
                <button
                  type="button"
                  onClick={() => setHint((h) => !h)}
                  className="text-[11.5px] font-semibold text-[var(--color-brand-600)] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pl-9 pr-10 h-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[8px] text-subtle hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {hint && (
                <p className="fade-up text-[11.5px] text-muted mt-2">
                  Demo mode — any password with 4+ characters works.
                </p>
              )}
            </label>

            {error && (
              <p className="fade-up text-[12px] text-[var(--color-accent-rose)] flex items-start gap-1.5">
                <AlertCircle size={13} className="mt-px shrink-0" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full justify-center h-11 disabled:opacity-70"
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                Or continue as
              </span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {adminDirectory.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  disabled={busy}
                  onClick={() => signInAs(u.email)}
                  className={cn(
                    "rounded-[12px] border border-[var(--color-border)] px-2 py-2.5 text-center transition-all",
                    "hover:border-[var(--color-brand-400)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
                    "disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none",
                    email === u.email &&
                      "border-[var(--color-brand-500)] bg-[color-mix(in_oklab,var(--color-brand-500)_8%,transparent)]"
                  )}
                >
                  <span className="block text-[12.5px] font-semibold capitalize">{u.role}</span>
                  <span className="block text-[10.5px] text-subtle mt-0.5">{roleBlurb[u.role]}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[12.5px] text-muted mt-8">
            Not staff?{" "}
            <a
              href={import.meta.env.BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Go to the customer portal (opens in a new tab)"
              className="font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-1"
            >
              <Store size={13} /> Go to the customer portal
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
