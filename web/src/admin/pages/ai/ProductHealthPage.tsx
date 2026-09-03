import { Gauge, MessageSquare, PackageX, Star } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

const scoreColor = (s: number): string => (s >= 85 ? "var(--color-accent-mint)" : s >= 70 ? "var(--color-accent-amber)" : "var(--color-accent-rose)");

export default function ProductHealthPage() {
  const { data: aiProductHealth, source, generatedAt, loading, error, reload } =
    useCopilot("product-health");


  if (!aiProductHealth) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Product Health Score"
      subtitle="Per-SKU score fusing reviews, returns, support, and conversion — with a ranked fix-list."
      icon={Gauge}
      tone="var(--color-accent-mint)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="SKU health" subtitle="Composite 0-100 score · sorted by signal strength" eyebrow="Quality AI" className="mb-0" />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiProductHealth.map((p) => {
            const color = scoreColor(p.score);
            return (
              <div key={p.sku} className="soft-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{p.sku}</p>
                    <p className="text-[14.5px] font-semibold tracking-tight">{p.name}</p>
                  </div>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-semibold tabular-nums shrink-0"
                    style={{ background: `color-mix(in oklab, ${color} 14%, transparent)`, color }}
                  >
                    {p.score}
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-[12.5px]">
                  <div className="flex items-start gap-2">
                    <Star size={13} className="mt-0.5 text-subtle shrink-0" />
                    <p><span className="text-subtle">Reviews:</span> {p.signals.reviews}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <PackageX size={13} className="mt-0.5 text-subtle shrink-0" />
                    <p><span className="text-subtle">Returns:</span> {p.signals.returns}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare size={13} className="mt-0.5 text-subtle shrink-0" />
                    <p><span className="text-subtle">Support:</span> {p.signals.support}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
