import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useSession } from "../lib/session";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Product } from "../types";
import { cn } from "../lib/cn";

interface LocationState {
  from?: string;
}

const perks = [
  { icon: Wand2, label: "Ask in plain words — AI finds the piece" },
  { icon: MessageSquare, label: "Product questions answered before you buy" },
  { icon: Heart, label: "Picks and wishlist that follow you everywhere" },
];

/** Demo accounts, matching what the seed script creates. */
const DEMO_ACCOUNTS = [
  { name: "Alex Turner", email: "alex@example.com" },
  { name: "Maya Singh", email: "maya@example.com" },
  { name: "Jordan Miles", email: "jordan@example.com" },
];
const DEMO_PASSWORD = "demo1234";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useSession();
  // A lifestyle shot from the catalog beats a stock illustration.
  const cover = useApi(() => api.get<Product>("/products/P-1007"), []);
  const coverImage = cover.data?.image;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) {
    const from = (location.state as LocationState | null)?.from ?? "/account";
    return <Navigate to={from} replace />;
  }

  async function finish(nextEmail: string, nextPassword: string) {
    const result = await signIn(nextEmail, nextPassword);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const from = (location.state as LocationState | null)?.from ?? "/account";
    navigate(from, { replace: true });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    // The password is actually checked now — it used to be captured into state
    // and never read.
    if (!password) {
      setError("Enter your password");
      return;
    }
    setError(null);
    setBusy(true);
    await finish(email.trim(), password);
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
    <div className="max-w-[900px] mx-auto">
      <div className="grid md:grid-cols-2 rounded-[22px] overflow-hidden card-surface shadow-[var(--shadow-pop)]">
        {/* Editorial panel */}
        <aside className="relative hidden md:flex flex-col justify-end p-8 min-h-[520px] text-white">
          {coverImage && (
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, #0b1020 35%, transparent) 0%, color-mix(in oklab, #0b1020 82%, transparent) 68%, #0b1020 100%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur">
              <Sparkles size={11} /> AI-first shopping
            </span>
            <p className="font-display text-[26px] leading-[1.15] tracking-tight font-semibold mt-4">
              Describe it.
              <br />
              We'll find it.
            </p>

            {/* A glimpse of the thing we're selling. */}
            <div className="mt-5 rounded-[14px] border border-white/15 bg-white/10 backdrop-blur px-3.5 py-3">
              <p className="text-[12.5px] text-white/90">“a linen jacket for warm days”</p>
              <p className="text-[11.5px] text-white/60 mt-1.5 inline-flex items-center gap-1.5">
                <Sparkles size={11} /> 6 matches · summarized reviews · ready to ask
              </p>
            </div>
            <ul className="mt-5 space-y-2.5">
              {perks.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.label} className="flex items-center gap-2.5 text-[12.5px] text-white/80">
                    <Icon size={14} className="shrink-0" />
                    {p.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Form */}
        <div className="p-7 sm:p-9 flex flex-col justify-center">
          <h1 className="font-display text-[26px] tracking-tight font-semibold">Welcome back</h1>
          <p className="text-[13px] text-muted mt-1.5">
            Pick up your AI-assisted shopping — orders, saved items, and reviews.
          </p>

          <form onSubmit={submit} className="space-y-4 mt-6">
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
                  placeholder="you@example.com"
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
                  Demo mode — any password works, the email just has to be a known customer.
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

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                Or try a demo shopper
              </span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {DEMO_ACCOUNTS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  disabled={busy}
                  onClick={() => signInAs(c.email)}
                  className={cn(
                    "text-[12px] font-medium rounded-full pl-1.5 pr-3 py-1.5 border border-[var(--color-border)] inline-flex items-center gap-2 transition-all",
                    "hover:border-[var(--color-brand-400)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0",
                    email === c.email && "border-[var(--color-brand-500)]"
                  )}
                >
                  <span
                    className="w-6 h-6 rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
                    }}
                  >
                    {c.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[13px] text-muted mt-7">
            New here?{" "}
            <Link
              to="/sign-up"
              className="font-semibold text-[var(--color-brand-600)] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
