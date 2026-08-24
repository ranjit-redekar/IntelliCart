import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { feedback, orders, products } from "../mockdata";
import { Card } from "./ui/Card";
import { cn } from "../lib/cn";

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

export default function AiInsights() {
  const insights: Insight[] = useMemo(() => {
    const out: Insight[] = [];

    // Anomaly: low stock SKUs
    const lowStock = products.filter((p) => p.stock < 40);
    if (lowStock.length > 0) {
      const worst = lowStock.sort((a, b) => a.stock - b.stock)[0];
      out.push({
        id: "low-stock",
        tone: "danger",
        icon: AlertTriangle,
        title: `${lowStock.length} SKUs below threshold`,
        body: `Lowest: ${worst.name} at ${worst.stock} units. Reorder soon to avoid stockouts.`,
        cta: "Review inventory",
        href: "/products",
      });
    }

    // Opportunity: unanswered/flagged feedback
    const awaiting = feedback.filter((f) => f.status === "new" || f.status === "flagged");
    if (awaiting.length > 0) {
      const negative = awaiting.filter((f) => f.sentiment === "negative").length;
      out.push({
        id: "feedback",
        tone: "info",
        title: `${awaiting.length} reviews need a reply`,
        body:
          negative > 0
            ? `${negative} negative — AI-drafted replies are ready to send.`
            : "AI-drafted replies are ready to send.",
        icon: MessageSquare,
        cta: "Open inbox",
        href: "/feedback",
      });
    }

    // Trend: top mover
    const topProduct = [...products].sort((a, b) => b.rating - a.rating)[0];
    if (topProduct) {
      out.push({
        id: "trending",
        tone: "success",
        icon: TrendingUp,
        title: `Trending: ${topProduct.name}`,
        body: `Rating ${topProduct.rating}★ — consider a homepage feature or bundle to capitalize.`,
        cta: "Open product",
        href: `/products/${topProduct.id}`,
      });
    }

    // Fallback if nothing flagged: highlight pending orders
    if (out.length === 0) {
      const pending = orders.filter((o) => o.status === "pending").length;
      out.push({
        id: "all-good",
        tone: "success",
        icon: Sparkles,
        title: "All clear",
        body: pending > 0 ? `${pending} pending orders ready to process.` : "No anomalies detected.",
        cta: "View orders",
        href: "/orders",
      });
    }

    return out.slice(0, 3);
  }, []);

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
