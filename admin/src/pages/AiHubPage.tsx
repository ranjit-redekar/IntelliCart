import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Boxes,
  ChartLine,
  CircleDollarSign,
  ClipboardCheck,
  Factory,
  FileText,
  Flame,
  Gauge,
  Globe2,
  HeartHandshake,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Newspaper,
  Package2,
  PackageX,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Card } from "../components/ui/Card";

type Feature = { name: string; to: string; desc: string; icon: LucideIcon; tone: string };

const sections: { id: string; label: string; eyebrow: string; features: Feature[] }[] = [
  {
    id: "analytics",
    label: "Analytics & Insights",
    eyebrow: "Understand what's happening",
    features: [
      { name: "Sales Copilot", to: "/ai-hub/sales-copilot", desc: "Business Q&A with actionable recommendations.", icon: Bot, tone: "var(--color-brand-500)" },
      { name: "Trend Spotter", to: "/ai-hub/trend-spotter", desc: "Rising, cooling, and emerging products with drivers.", icon: TrendingUp, tone: "var(--color-accent-mint)" },
      { name: "Daily Briefing", to: "/ai-hub/daily-briefing", desc: "One-paragraph executive summary every morning.", icon: Newspaper, tone: "var(--color-brand-500)" },
      { name: "Forecasting", to: "/ai-hub/forecasting", desc: "Demand forecasting and stock risk indicators.", icon: ChartLine, tone: "var(--color-accent-violet)" },
      { name: "Anomaly Alerts", to: "/ai-hub/anomaly-alerts", desc: "Metric anomaly detection and reasons.", icon: Activity, tone: "var(--color-accent-rose)" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    eyebrow: "Run the store",
    features: [
      { name: "Inventory & Reorder", to: "/ai-hub/inventory-agent", desc: "Stockout risk and dead-stock recommendations.", icon: Boxes, tone: "var(--color-accent-amber)" },
      { name: "Pricing Agent", to: "/ai-hub/pricing", desc: "Elasticity-aware per-SKU price recommendations.", icon: CircleDollarSign, tone: "var(--color-brand-600)" },
      { name: "Return Analyzer", to: "/ai-hub/returns-analyzer", desc: "Cluster return reasons and route findings.", icon: PackageX, tone: "var(--color-accent-rose)" },
      { name: "Vendor Scorecard", to: "/ai-hub/vendors", desc: "Supplier on-time, defect, and lead-time trends.", icon: Factory, tone: "var(--color-accent-violet)" },
      { name: "Logistics Agent", to: "/ai-hub/logistics", desc: "Per-lane on-time and carrier suggestions.", icon: Truck, tone: "var(--color-accent-amber)" },
      { name: "Fraud & Risk Triage", to: "/ai-hub/risk", desc: "Score risky orders with explainable flags.", icon: ShieldAlert, tone: "var(--color-accent-rose)" },
    ],
  },
  {
    id: "customer",
    label: "Customer & Growth",
    eyebrow: "Engage and retain",
    features: [
      { name: "Customer Segments", to: "/ai-hub/segments", desc: "Auto-clustered cohorts with actions per segment.", icon: Users, tone: "var(--color-accent-violet)" },
      { name: "Churn & Win-back", to: "/ai-hub/win-back", desc: "At-risk customers with personalized drafts.", icon: HeartHandshake, tone: "var(--color-accent-rose)" },
      { name: "Bundle Miner", to: "/ai-hub/bundles", desc: "High-lift bundles from co-purchase patterns.", icon: Package2, tone: "var(--color-accent-sky)" },
      { name: "Cart Recovery", to: "/ai-hub/cart-recovery", desc: "Why carts get abandoned and how to recover.", icon: ShoppingBag, tone: "var(--color-accent-amber)" },
      { name: "Promotion Optimizer", to: "/ai-hub/promotion-optimizer", desc: "Campaign suggestions with estimated uplift.", icon: Tag, tone: "var(--color-accent-amber)" },
      { name: "Campaign Generator", to: "/ai-hub/campaigns", desc: "Email, push, banner copy per segment.", icon: Megaphone, tone: "var(--color-brand-500)" },
      { name: "Support Assistant", to: "/ai-hub/support-assistant", desc: "AI support reply drafting for tickets.", icon: MessageSquare, tone: "var(--color-accent-mint)" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog & Content",
    eyebrow: "Polish the product surface",
    features: [
      { name: "Product Content Studio", to: "/ai-hub/content-studio", desc: "Generate product copy and SEO variants.", icon: FileText, tone: "var(--color-accent-violet)" },
      { name: "Smart Search", to: "/ai-hub/smart-search", desc: "Natural language admin search workflows.", icon: Search, tone: "var(--color-accent-sky)" },
      { name: "Catalog Auditor", to: "/ai-hub/catalog-audit", desc: "Scan listings for missing fields and weak titles.", icon: ClipboardCheck, tone: "var(--color-accent-sky)" },
      { name: "Localization Agent", to: "/ai-hub/localization-agent", desc: "Bulk-translate listings and adapt formatting.", icon: Globe2, tone: "var(--color-accent-sky)" },
      { name: "Review Summarizer", to: "/ai-hub/review-summarizer", desc: "Pros/cons extraction from product reviews.", icon: Sparkles, tone: "var(--color-brand-600)" },
      { name: "Product Health Score", to: "/ai-hub/product-health", desc: "Composite SKU score with a fix-list.", icon: Gauge, tone: "var(--color-accent-mint)" },
    ],
  },
];

const totalCount = sections.reduce((n, s) => n + s.features.length, 0);

export default function AiHubPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="space-y-8">
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
            {totalCount} specialized copilots that draft, decide, and explain. Open any feature to explore the full mock workflow.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="chip chip-success">{totalCount} features live</span>
            <span className="chip chip-info">Powered by mock signals</span>
            <span className="chip chip-pending"><Flame size={11} className="inline -mt-0.5 mr-1" />3 new</span>
          </div>
        </div>
      </Card>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-4 fade-up scroll-mt-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{section.eyebrow}</p>
            <h3 className="text-[18px] font-semibold tracking-tight mt-1">{section.label}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-up-stagger">
            {section.features.map((f) => (
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
        </section>
      ))}
    </div>
  );
}
