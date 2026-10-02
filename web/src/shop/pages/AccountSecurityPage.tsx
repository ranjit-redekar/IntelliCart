import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "../components/ui/Card";
import { useToast } from "../../lib/toast";
import { api, ApiError } from "../../lib/api";

/** Matches POST /auth/password (and sign-up): at least 8 characters. */
const MIN_PASSWORD = 8;

export default function AccountSecurityPage() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const problem =
    next && next.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.`
    : confirm && confirm !== next ? "Passwords don't match."
    : null;
  const error = problem ?? serverError;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (problem || next !== confirm) return;
    setBusy(true);
    setServerError(null);
    try {
      await api.post("/auth/password", { current, next });
      setCurrent("");
      setNext("");
      setConfirm("");
      setShow(false);
      toast("Password changed. Other devices were signed out.", "success");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const type = show ? "text" : "password";
  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    autoComplete: "current-password" | "new-password",
  ) => (
    <label className="block">
      <span className="block text-[12px] text-muted mb-1">{label}</span>
      <input
        className="input h-10"
        type={type}
        autoComplete={autoComplete}
        required
        minLength={autoComplete === "new-password" ? MIN_PASSWORD : undefined}
        aria-describedby="pw-error"
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setServerError(null);
        }}
      />
    </label>
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">Security</p>
        <h2 className="text-[18px] font-semibold tracking-tight">Change password</h2>
        <p className="text-[13px] text-muted mt-0.5">
          Changing your password signs you out on every other device.
        </p>
      </div>

      <Card as="section">
        <form onSubmit={submit} className="space-y-3 max-w-md" aria-label="Change password">
          {field("Current password", current, setCurrent, "current-password")}
          {field("New password", next, setNext, "new-password")}
          {field("Confirm new password", confirm, setConfirm, "new-password")}
          <p
            id="pw-error"
            role="alert"
            className="text-[12.5px] min-h-[1em]"
            style={{ color: "var(--color-accent-rose)" }}
          >
            {error}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={busy || !!problem} className="btn btn-primary btn-sm">
              {busy ? "Saving…" : "Update password"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-pressed={show}
              onClick={() => setShow((v) => !v)}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? "Hide passwords" : "Show passwords"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
