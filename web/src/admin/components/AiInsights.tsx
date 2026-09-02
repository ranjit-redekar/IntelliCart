import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card } from "./ui/Card";
import { cn } from "../lib/cn";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";

type Tone = "danger" | "info" | "success";

interface Insight {
  id: string;
  tone: Tone;
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  cta: string;
  href: string;
}

const toneStyles: Record<Tone, { bg: string; color: string }> = {
  danger: {
    bg: "color-mix(in oklab, var(--color-accent-rose) 12%, transparent)",
    color: "var(--color-accent-rose)",
  },
  info: {
    bg: "color-mix(in oklab, var(--color-accent-violet) 12%, transparent)",
    color: "var(--color-accent-violet)",
  },
  success: {
    bg: "color-mix(in oklab, var(--color-accent-mint) 12%, transparent)",
    color: "var(--color-accent-mint)",
  },
};

interface ServerInsight {
  id: string;
  tone: "danger" | "info" | "success";
  title: string;
  body: string;
  href: string;
}

/** Maps a server insight onto the icon and CTA this component renders. */
const ICONS = { danger: AlertTriangle, info: MessageSquare, success: TrendingUp } as const;
const CTAS: Record<string, string> = {
  danger: "Review inventory",
  info: "Open inbox",
  success: "Open product",
};

export default function AiInsights() {
  // Derived in SQL against the whole catalog. This used to scan the bundled
  // arrays, so it could only ever see the 24 fixture products.
  const state = useApi(() => api.get<{ items: ServerInsight[] }>("/admin/analytics/insights"), []);

  const insights: Insight[] = useMemo(() => {
    const items = state.data?.items ?? [];
    if (items.length === 0) {
      return [
        {
          id: "all-good",
          tone: "success" as const,
          icon: Sparkles,
          title: "All clear",
          body: "No anomalies detected across inventory or reviews.",
          cta: "View orders",
          href: "/orders",
        },
      ];
    }
    return items.slice(0, 3).map((i) => ({
      id: i.id,
      tone: i.tone,
      icon: ICONS[i.tone] ?? Sparkles,
      title: i.title,
      body: i.body,
      cta: CTAS[i.tone] ?? "Open",
      href: i.href,
    }));
  }, [state.data]);

  return (
    <Card padded={false} className="overflow-hidden fade-up">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
            }}
          >
            <Sparkles size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              IntelliCart AI
            </p>
            <h3 className="text-[15px] font-semibold tracking-tight">
              What needs your attention today
            </h3>
          </div>
        </div>
        <Link
          to="/ai-hub"
          className="text-[12px] font-semibold text-[var(--color-brand-600)] hover:underline shrink-0"
        >
          Open AI Hub →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[var(--color-border)]">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          const tones = toneStyles[ins.tone];
          return (
            <Link
              key={ins.id}
              to={ins.href}
              className={cn(
                "group px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]",
                i > 0 && "md:border-l border-[var(--color-border)]",
                i > 0 && "border-t md:border-t-0"
              )}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: tones.bg, color: tones.color }}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold tracking-tight">{ins.title}</p>
                  <p className="text-[12.5px] text-muted mt-1 leading-snug">{ins.body}</p>
                  <p className="text-[12px] font-semibold text-[var(--color-brand-600)] mt-2 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    {ins.cta} <ArrowRight size={12} />
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
