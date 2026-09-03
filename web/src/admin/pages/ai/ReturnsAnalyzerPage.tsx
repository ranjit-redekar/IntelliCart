import { PackageX } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

export default function ReturnsAnalyzerPage() {
  const { data: aiReturns, source, generatedAt, loading, error, reload } =
    useCopilot("returns-analyzer");


  if (!aiReturns) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Return Reason Analyzer"
      subtitle="Cluster return reasons per SKU and route findings to merchandising, vendor, or operations."
      icon={PackageX}
      tone="var(--color-accent-rose)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Top return drivers"
            subtitle="Per-SKU dominant reason · last 30 days"
            eyebrow="Returns AI"
            className="mb-0"
          />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiReturns.map((r) => (
            <div key={r.sku} className="soft-surface p-4 flex flex-col md:flex-row md:items-center gap-4">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-rose) 14%, transparent)", color: "var(--color-accent-rose)" }}
              >
                <PackageX size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{r.sku}</p>
                  <p className="text-[14.5px] font-semibold tracking-tight">{r.name}</p>
                  <Chip tone="danger">{r.rate}</Chip>
                </div>
                <p className="text-[13px] mt-1"><span className="text-subtle">Top reason:</span> {r.topReason}</p>
                <p className="text-[12.5px] text-muted mt-1">{r.action}</p>
              </div>
              <button type="button" className="btn btn-soft btn-sm">Route</button>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
