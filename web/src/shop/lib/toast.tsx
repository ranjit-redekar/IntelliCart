import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface Toast {
  id: number;
  text: string;
  tone: "default" | "success";
}

const Ctx = createContext<((text: string, tone?: Toast["tone"]) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    // ponytail: fixed 2.4s dismissal, no pause-on-hover / no manual close.
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-up px-4 py-2.5 rounded-[12px] text-[13px] font-medium shadow-[var(--shadow-pop)] border border-[var(--color-border)]"
            style={{
              background: t.tone === "success" ? "var(--color-accent-mint)" : "var(--color-inverse-bg)",
              color: t.tone === "success" ? "#0b1a12" : "var(--color-inverse-text)",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
