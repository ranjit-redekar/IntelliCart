import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

export interface Counts {
  lowStock: number;
  pendingOrders: number;
  newFeedback: number;
}

/** Header bell. AdminShell already fetches the counts for its nav badges, so they come in as a prop. */
export default function NotificationsMenu({ counts }: { counts?: Counts }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const items = [
    { n: counts?.lowStock ?? 0, to: "/products", label: (n: number) => `${n} ${n === 1 ? "product" : "products"} low on stock` },
    { n: counts?.pendingOrders ?? 0, to: "/orders?status=pending", label: (n: number) => `${n} pending ${n === 1 ? "order" : "orders"}` },
    { n: counts?.newFeedback ?? 0, to: "/feedback?status=new", label: (n: number) => `${n} new ${n === 1 ? "review" : "reviews"}` },
  ].filter((i) => i.n > 0);

  useEffect(() => {
    if (!open) return;
    // Focus the first item, or the panel itself when it only holds the empty state.
    (panelRef.current?.querySelector<HTMLElement>("a") ?? panelRef.current)?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-icon btn-sm btn-ghost relative"
        aria-label={items.length ? `Notifications (${items.length} new)` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Bell size={15} />
        {items.length > 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-brand-500)] ring-2 ring-[var(--color-surface)]"
          />
        )}
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          tabIndex={-1}
          role="region"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 z-50 w-64 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg p-1.5 outline-none"
        >
          {items.length === 0 ? (
            <p className="px-2.5 py-3 text-[12.5px] text-[var(--color-text-muted)]">You're all caught up</p>
          ) : (
            <ul>
              {items.map((i) => (
                <li key={i.to}>
                  <Link
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-[8px] px-2.5 py-2 text-[13px] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:bg-[var(--color-surface-2)]"
                  >
                    {i.label(i.n)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
