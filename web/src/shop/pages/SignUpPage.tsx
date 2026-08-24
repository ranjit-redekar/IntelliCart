import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useSession } from "../lib/session";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { user, signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Navigate to="/account" replace />;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    signUp(name.trim(), email.trim());
    navigate("/account", { replace: true });
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-[28px] tracking-tight font-semibold">Create account</h1>
        <p className="text-[13px] text-muted mt-1">
          Join IntelliCart — track orders, save addresses, and review what you buy.
        </p>
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-[12.5px] font-semibold">Full name</span>
            <div className="relative mt-1.5">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
              />
              <input
                className="input pl-9"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold">Email</span>
            <input
              type="email"
              className="input mt-1.5"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold">Password</span>
            <input
              type="password"
              className="input mt-1.5"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim() || !email.trim()}
            className="btn btn-primary w-full justify-center"
          >
            Create account <ArrowRight size={13} />
          </button>
        </form>
      </Card>
      <p className="text-[13px] text-muted text-center mt-4">
        Already have one?{" "}
        <Link to="/sign-in" className="font-semibold text-[var(--color-brand-600)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
