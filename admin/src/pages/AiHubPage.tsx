import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Bot,
  ChartLine,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { Card } from "../components/ui/Card";

const features = [
  { name: "Sales Copilot", to: "/ai-hub/sales-copilot", desc: "Business Q&A with actionable recommendations.", icon: Bot, tone: "var(--color-brand-500)" },
  { name: "Product Content Studio", to: "/ai-hub/content-studio", desc: "Generate product copy and SEO variants.", icon: FileText, tone: "var(--color-accent-violet)" },
  { name: "Smart Search", to: "/ai-hub/smart-search", desc: "Natural language admin search workflows.", icon: Search, tone: "var(--color-accent-sky)" },
  { name: "Support Assistant", to: "/ai-hub/support-assistant", desc: "AI support reply drafting for tickets.", icon: MessageSquare, tone: "var(--color-accent-mint)" },
  { name: "Promotion Optimizer", to: "/ai-hub/promotion-optimizer", desc: "Campaign suggestions with estimated uplift.", icon: Tag, tone: "var(--color-accent-amber)" },
  { name: "Anomaly Alerts", to: "/ai-hub/anomaly-alerts", desc: "Metric anomaly detection and reasons.", icon: Activity, tone: "var(--color-accent-rose)" },
  { name: "Review Summarizer", to: "/ai-hub/review-summarizer", desc: "Pros/cons extraction from product reviews.", icon: Sparkles, tone: "var(--color-brand-600)" },
  { name: "Forecasting", to: "/ai-hub/forecasting", desc: "Demand forecasting and stock risk indicators.", icon: ChartLine, tone: "var(--color-accent-violet)" },
] as const;

export default function AiHubPage() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden fade-up !p-7">
        <span className="absolute inset-0 bg-aurora pointer-events-none" aria-hidden />
        <span className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <Sparkles size={12} className="text-[var(--color-brand-500)]" /> IntelliCart AI
          </span>
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] leading-tight mt-3">
            Run your store with a brain that never sleeps.
          </h2>
          <p className="text-[14px] text-muted mt-2">
            Eight specialized copilots that draft, decide, and explain. Open any feature to explore the full mock workflow.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="chip chip-success">8 features live</span>
            <span className="chip chip-info">Powered by mock signals</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-up-stagger">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="block focus:outline-none rounded-2xl">
            <Card interactive className="h-full group">
              <div className="flex items-start justify-between">
                <span
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center"
                  style={{ background: `color-mix(in oklab, ${f.tone} 14%, transparent)`, color: f.tone }}
                >
                  <f.icon size={18} />
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-subtle group-hover:text-[var(--color-text)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                />
              </div>
              <h3 className="text-[15.5px] font-semibold tracking-tight mt-4">{f.name}</h3>
              <p className="text-[13px] text-muted mt-1">{f.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
