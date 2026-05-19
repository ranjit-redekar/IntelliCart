import { ArrowRight, Sparkles, X } from "lucide-react";
import type { Promotion, PromotionTheme } from "../types";
import { cn } from "../lib/cn";

const themeAccent: Record<PromotionTheme, string> = {
  brand: "var(--color-brand-500)",
  violet: "var(--color-accent-violet)",
  mint: "var(--color-accent-mint)",
  amber: "var(--color-accent-amber)",
  rose: "var(--color-accent-rose)",
};

interface Props {
  promotion: Promotion;
  surface?: "web" | "mobile";
  dismissible?: boolean;
}

export default function PromoBanner({ promotion, surface = "web", dismissible = true }: Props) {
  const accent = themeAccent[promotion.theme];

  if (surface === "mobile") {
    return (
      <div
        className="rounded-[20px] p-4 text-white shadow-[var(--shadow-card)] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, black))`,
        }}
      >
        <span className="absolute inset-0 bg-grid opacity-15" aria-hidden />
        <div className="relative flex items-start gap-3">
          <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-white/15 backdrop-blur">
            <Sparkles size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold tracking-tight leading-tight">
              {promotion.title}
            </p>
            <p className="text-[11.5px] mt-1 text-white/85 leading-snug">{promotion.message}</p>
            {promotion.ctaText && (
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 bg-white/90 text-[var(--color-text)] text-[12px] font-semibold rounded-full px-3 py-1.5"
              >
                {promotion.ctaText} <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-[14px] border p-4 overflow-hidden"
      )}
      style={{
        borderColor: `color-mix(in oklab, ${accent} 28%, var(--color-border))`,
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 10%, var(--color-surface)), var(--color-surface))`,
      }}
    >
      <span
        className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in oklab, ${accent} 18%, transparent)`,
          color: accent,
        }}
      >
        <Sparkles size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold tracking-tight">{promotion.title}</p>
        <p className="text-[12px] text-muted mt-0.5">{promotion.message}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {promotion.ctaText && (
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: accent,
              color: "white",
            }}
          >
            {promotion.ctaText} <ArrowRight size={13} />
          </button>
        )}
        {dismissible && (
          <button
            type="button"
            aria-label="Dismiss"
            className="btn btn-icon btn-sm btn-ghost"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
