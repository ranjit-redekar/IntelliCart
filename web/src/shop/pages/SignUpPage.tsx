import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Package,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import { useSession } from "../lib/session";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Product } from "../types";
import { cn } from "../lib/cn";

const perks = [
  { icon: Wand2, label: "An AI assistant on every screen" },
  { icon: Package, label: "Order tracking, answered in plain words" },
  { icon: MapPin, label: "Saved addresses, faster checkout" },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";
  const { user, signUp } = useSession();
  // Pairs with the sign-in cover — a different catalog shot, same treatment.
  const cover = useApi(() => api.get<Product>("/products/P-1022"), []);
  const coverImage = cover.data?.image;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError("Tell us your name");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look right");
    if (password.length < 8) return setError("Use at least 8 characters for your password");

    setError(null);
    setBusy(true);
    // The password is hashed and stored now, and a duplicate email is rejected
    // by a unique constraint rather than silently creating a shadow account.
    const result = await signUp(name.trim(), email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(from, { replace: true });
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
              Your shopping
              <br />
              copilot, from day one.
            </p>
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
          <h1 className="font-display text-[26px] tracking-tight font-semibold">Create account</h1>
          <p className="text-[13px] text-muted mt-1.5">
            A moment to join, then the AI does the legwork. No card needed for the demo.
          </p>

          <form onSubmit={submit} className="space-y-4 mt-6">
            <label className="block">
              <span className="text-[12.5px] font-semibold">Full name</span>
              <div className="relative mt-1.5">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                  className="input pl-9 h-11"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </label>

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
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[12.5px] font-semibold">Password</span>
              <div className="relative mt-1.5">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pl-9 pr-10 h-11"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              <span className="flex items-center gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      password.length > i * 4 + 3
                        ? "bg-[var(--color-accent-mint)]"
                        : "bg-[var(--color-surface-3)]"
                    )}
                  />
                ))}
              </span>
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
                  <Loader2 size={14} className="animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  Create account <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <p className="text-[11.5px] text-subtle mt-4">
            By joining you agree to our terms and privacy policy.
          </p>

          <p className="text-[13px] text-muted mt-6">
            Already have one?{" "}
            <Link
              to="/sign-in"
              state={location.state}
              className="font-semibold text-[var(--color-brand-600)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
