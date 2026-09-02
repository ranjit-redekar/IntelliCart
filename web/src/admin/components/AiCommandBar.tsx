import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CornerDownLeft,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "../lib/cn";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";

interface Action {
  id: string;
  label: string;
  hint: string;
  icon: typeof LayoutDashboard;
  keywords: string[];
  run: () => void;
  badge?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AiCommandBar({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while open; auto-focus the input.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Live AI-derived stats
  // Redis counters, maintained incrementally rather than recomputed here.
  const counts = useApi(
    () => api.get<{ lowStock: number; pendingOrders: number; newFeedback: number }>(
      "/admin/analytics/counts",
    ),
    [],
  );
  const lowStockCount = counts.data?.lowStock ?? 0;
  const newFeedbackCount = counts.data?.newFeedback ?? 0;
  const pendingOrdersCount = counts.data?.pendingOrders ?? 0;

  const actions: Action[] = useMemo(
    () => [
      // Navigate
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        hint: "Overview · revenue · top products",
        icon: LayoutDashboard,
        keywords: ["dashboard", "home", "overview", "metrics"],
        run: () => navigate("/dashboard"),
      },
      {
        id: "nav-products",
        label: "Go to Products",
        hint: "Browse and edit your catalog",
        icon: Package,
        keywords: ["products", "catalog", "inventory", "items"],
        run: () => navigate("/products"),
      },
      {
        id: "nav-orders",
        label: "Go to Orders",
        hint: `${pendingOrdersCount} orders awaiting action`,
        icon: ShoppingBag,
        keywords: ["orders", "fulfillment", "shipping"],
        run: () => navigate("/orders"),
      },
      {
        id: "nav-customers",
        label: "Go to Customers",
        hint: "Customers · CRM",
        icon: Users,
        keywords: ["customers", "crm", "users"],
        run: () => navigate("/customers"),
      },
      {
        id: "nav-feedback",
        label: "Go to Feedback",
        hint: "Reviews and customer voice",
        icon: MessageSquare,
        keywords: ["feedback", "reviews", "ratings", "voice"],
        run: () => navigate("/feedback"),
        badge: newFeedbackCount > 0 ? `${newFeedbackCount} new` : undefined,
      },
      // Create
      {
        id: "create-product",
        label: "Create a new product",
        hint: "Open the new product form",
        icon: Plus,
        keywords: ["new", "create", "add", "product", "sku"],
        run: () => navigate("/products/new"),
      },
      // AI shortcuts
      {
        id: "ai-low-stock",
        label: "Show low-stock products",
        hint: `${lowStockCount} below threshold · jump to catalog filtered`,
        icon: AlertTriangle,
        keywords: ["low", "stock", "out", "restock", "inventory"],
        run: () => navigate("/products"),
        badge: lowStockCount > 0 ? String(lowStockCount) : undefined,
      },
      {
        id: "ai-pending",
        label: "Review pending orders",
        hint: `${pendingOrdersCount} awaiting action`,
        icon: ShoppingBag,
        keywords: ["pending", "orders", "fulfill", "action"],
        run: () => navigate("/orders"),
        badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
      },
      {
        id: "ai-feedback-reply",
        label: "Draft replies for new feedback",
        hint: "Open feedback inbox · AI-suggested replies ready",
        icon: Sparkles,
        keywords: ["reply", "feedback", "draft", "ai", "respond"],
        run: () => navigate("/feedback"),
      },
      {
        id: "ai-trends",
        label: "What's trending this week?",
        hint: "Top-rated products by recent rating · jump to Dashboard",
        icon: TrendingUp,
        keywords: ["trending", "popular", "best", "top", "this week"],
        run: () => navigate("/dashboard"),
      },
      {
        id: "ai-hub",
        label: "Open AI Hub",
        hint: "All 8 AI helpers · sales · content · search · support",
        icon: Sparkles,
        keywords: ["ai", "hub", "assistant", "tools"],
        run: () => navigate("/ai-hub"),
      },
    ],
    [navigate, lowStockCount, newFeedbackCount, pendingOrdersCount]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.hint.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.includes(q))
    );
  }, [actions, query]);

  // Keep highlight in range when filter changes.
  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (filtered.length === 0 ? 0 : (h + 1) % filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (filtered.length === 0 ? 0 : (h - 1 + filtered.length) % filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = filtered[highlight];
        if (target) {
          target.run();
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, highlight, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI command palette"
    >
      <button
        type="button"
        aria-label="Close command palette"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-[560px] card-surface rounded-[16px] shadow-[var(--shadow-pop)] overflow-hidden fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--color-border)]"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--color-accent-violet) 6%, var(--color-surface)), var(--color-surface))",
          }}
        >
          <span
            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-white shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
            }}
          >
            <Sparkles size={14} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or jump anywhere…"
            className="flex-1 bg-transparent border-0 outline-none text-[14px] placeholder:text-[var(--color-text-subtle)]"
          />
          <kbd className="text-[10.5px] font-medium text-subtle bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search size={18} className="mx-auto text-subtle mb-2" />
              <p className="text-[13px] font-semibold">Nothing matches</p>
              <p className="text-[12px] text-muted mt-1">
                Try "low stock", "draft replies", or "trending".
              </p>
            </div>
          ) : (
            filtered.map((a, i) => {
              const Icon = a.icon;
              const isActive = i === highlight;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    a.run();
                    onClose();
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors",
                    isActive
                      ? "bg-[var(--color-surface-2)]"
                      : "hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0",
                      isActive
                        ? "bg-[color-mix(in_oklab,var(--color-brand-500)_18%,transparent)] text-[var(--color-brand-600)]"
                        : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                    )}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold tracking-tight truncate">{a.label}</p>
                    <p className="text-[11.5px] text-subtle truncate">{a.hint}</p>
                  </div>
                  {a.badge && (
                    <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-[color-mix(in_oklab,var(--color-accent-rose)_14%,transparent)] text-[var(--color-accent-rose)] shrink-0">
                      {a.badge}
                    </span>
                  )}
                  {isActive && (
                    <CornerDownLeft size={13} className="text-subtle shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={11} className="text-[var(--color-accent-violet)]" />
            IntelliCart AI · Powered by your catalog
          </span>
          <span className="inline-flex items-center gap-2">
            <kbd className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-1 py-0.5">↑↓</kbd>
            <kbd className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-1 py-0.5 inline-flex items-center">
              <CornerDownLeft size={9} />
            </kbd>
            to run
          </span>
        </div>
      </div>
    </div>
  );
}
