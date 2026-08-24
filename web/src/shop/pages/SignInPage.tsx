import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useSession } from "../lib/session";
import { customers } from "../mockdata";

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
    const from = (location.state as LocationState | null)?.from ?? "/account";
    return <Navigate to={from} replace />;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    const ok = signIn(email.trim());
    if (!ok) {
      setError(`No customer found with that email. Try ${customers[0].email}.`);
      return;
    }
    const from = (location.state as LocationState | null)?.from ?? "/account";
    navigate(from, { replace: true });
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-[28px] tracking-tight font-semibold">Sign in</h1>
        <p className="text-[13px] text-muted mt-1">Welcome back to IntelliCart.</p>
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
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
            <input
              type="password"
              className="input mt-1.5"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="text-[12px] text-[var(--color-accent-rose)]">{error}</p>
          )}
          <button type="submit" className="btn btn-primary w-full justify-center">
            Sign in <ArrowRight size={13} />
          </button>
        </form>
        <p className="text-[11.5px] text-subtle text-center mt-4 inline-flex items-center justify-center gap-1.5 w-full">
          <ShieldCheck size={11} /> Demo only — use any customer email from the mock list.
        </p>
      </Card>
      <p className="text-[13px] text-muted text-center mt-4">
        New here?{" "}
        <Link to="/sign-up" className="font-semibold text-[var(--color-brand-600)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
