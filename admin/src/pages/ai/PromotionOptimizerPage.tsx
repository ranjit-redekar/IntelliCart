import { ArrowUpRight, Rocket, Tag, TrendingUp } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiPromoIdeas } from "../../mock-ai";

export default function PromotionOptimizerPage() {
  return (
    <AiFeatureLayout
      title="Promotion Optimizer"
      subtitle="Model-driven campaign ideas with predicted lift, target segment, and ROI estimate."
      icon={Tag}
      tone="var(--color-accent-amber)"
    >
      <Card>
        <CardHeader title="Suggested campaigns" subtitle="Ranked by expected uplift" eyebrow="Campaign AI" />
        <div className="space-y-3">
          {aiPromoIdeas.map((p) => (
            <div
              key={p.campaign}
              className="soft-surface p-4 flex flex-wrap items-center gap-4 hover:border-[var(--color-border-strong)] transition-colors"
            >
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-amber) 14%, transparent)", color: "var(--color-accent-amber)" }}
              >
                <Rocket size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold">{p.campaign}</p>
                  <Chip tone="neutral">{p.segment}</Chip>
                </div>
                <p className="text-[13px] text-muted mt-1">{p.suggestion}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] text-subtle uppercase tracking-[0.08em]">Predicted uplift</p>
                  <p className="text-[18px] font-semibold tracking-tight tabular-nums flex items-center gap-1 text-[var(--color-accent-mint)]">
                    <TrendingUp size={14} /> {p.uplift}
                  </p>
                </div>
                <button type="button" className="btn btn-primary btn-sm">
                  Launch <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
