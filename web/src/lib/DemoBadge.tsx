import { useState } from "react";
import { OFFLINE } from "./api";

/**
 * Says out loud that this build has no server behind it.
 *
 * A demo that looks exactly like the real thing but silently refuses to save
 * is worse than one that tells you up front.
 */
export function DemoBadge() {
  const [open, setOpen] = useState(false);
  if (!OFFLINE) return null;

  return (
    <div className="fixed bottom-3 left-3 z-50 max-w-[min(92vw,340px)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-semibold shadow-lg"
        style={{
          background: "var(--color-surface)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border-strong)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--color-accent-amber)" }}
          aria-hidden
        />
        Offline demo
      </button>

      {open && (
        <div
          className="mt-2 rounded-[12px] p-3.5 text-[12.5px] leading-relaxed shadow-xl"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <p className="font-semibold text-[var(--color-text)] mb-1">No server behind this build</p>
          <p>
            Browsing, search, the cart and checkout all work — answers come from a recorded
            snapshot of the real API. Saving changes in the admin does not, and says so when you
            try.
          </p>
          <p className="mt-2">
            Sign in with any password: <code>alex@example.com</code> or{" "}
            <code>admin@intellicart.shop</code>.
          </p>
        </div>
      )}
    </div>
  );
}
