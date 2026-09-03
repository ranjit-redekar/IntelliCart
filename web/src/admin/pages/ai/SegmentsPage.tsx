import { ArrowUpRight, Users } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

const toneFor = (id: string): string => {
  switch (id) {
    case "vip": return "var(--color-accent-violet)";
    case "loyal": return "var(--color-accent-mint)";
    case "at-risk": return "var(--color-accent-amber)";
    case "one-done": return "var(--color-accent-sky)";
    case "churned": return "var(--color-accent-rose)";
    case "dealers": return "var(--color-brand-600)";
    default: return "var(--color-brand-500)";
  }
};

export default function SegmentsPage() {
  const { data: aiSegments, source, generatedAt, loading, error, reload } =
    useCopilot("segments");


  if (!aiSegments) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Customer Segments"
      subtitle="Auto-clustered cohorts with revenue share, AOV, and recommended actions per segment."
      icon={Users}
      tone="var(--color-accent-violet)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card>
        <CardHeader title="Auto-discovered segments" subtitle="Refreshed daily · 6 cohorts" eyebrow="Segmentation AI" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiSegments.map((s) => {
            const tone = toneFor(s.id);
            return (
              <div key={s.id} className="soft-surface p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: tone }}
                  >
                    <Users size={16} />
                  </span>
                  <Chip tone="neutral">{s.revenueShare} rev</Chip>
                </div>
                <p className="text-[15px] font-semibold tracking-tight mt-3">{s.name}</p>
                <p className="text-[12.5px] text-muted mt-1 flex-1">{s.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[12px]">
                    <span><span className="text-subtle">Members:</span> <span className="font-semibold tabular-nums">{s.count}</span></span>
                    <span><span className="text-subtle">AOV:</span> <span className="font-semibold tabular-nums">{s.aov}</span></span>
                  </div>
                  <button type="button" className="btn btn-soft btn-sm">
                    Open <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
