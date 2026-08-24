import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldCheck, Store } from "lucide-react";
import { Card } from "../components/ui/Card";
import { adminDirectory, useSession } from "../lib/session";

interface LocationState {
  from?: string;
}

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user) {
    const from = (location.state as LocationState | null)?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const from = (location.state as LocationState | null)?.from ?? "/dashboard";
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <span
            className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white text-base font-bold shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
            }}
          >
            A
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-tight leading-none">IntelliCart</p>
            <p className="text-[11px] text-subtle">AI-first commerce admin</p>
          </div>
        </div>

        <Card className="!p-6">
          <h1 className="text-[20px] font-semibold tracking-tight">Sign in</h1>
          <p className="text-[12.5px] text-muted mt-1">
            Use your admin email to access the workspace.
          </p>

          <form onSubmit={submit} className="space-y-4 mt-5">
            <label className="block">
              <span className="text-[12.5px] font-semibold">Email</span>
              <div className="relative mt-1.5">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                  type="email"
                  className="input pl-9"
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
                <a className="text-[11.5px] font-semibold text-[var(--color-brand-600)] hover:underline" href="#">
                  Forgot?
                </a>
              </div>
              <div className="relative mt-1.5">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                  type="password"
                  className="input pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </label>
            {error && (
              <p className="text-[12px] text-[var(--color-accent-rose)]">{error}</p>
            )}
            <button type="submit" className="btn btn-primary w-full justify-center">
              Sign in <ArrowRight size={13} />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2 inline-flex items-center gap-1.5">
              <ShieldCheck size={11} /> Demo accounts
            </p>
            <ul className="text-[12px] text-muted space-y-1">
              {adminDirectory.map((u) => (
                <li key={u.email} className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setPassword("demo");
                    }}
                    className="text-left hover:text-[var(--color-text)] tabular-nums"
                  >
                    {u.email}
                  </button>
                  <span className="text-subtle text-[11px] capitalize">{u.role}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-subtle mt-2">
              Any password with 4+ characters works in demo mode.
            </p>
          </div>
        </Card>

        <p className="text-center text-[12.5px] text-muted mt-5">
          Not staff?{" "}
          <a
            href={import.meta.env.BASE_URL}
            className="font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-1"
          >
            <Store size={13} /> Go to the customer portal
          </a>
        </p>
      </div>
    </div>
  );
}
