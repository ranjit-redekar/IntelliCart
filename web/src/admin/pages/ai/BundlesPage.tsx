import { ArrowUpRight, Package2, Sparkles } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

export default function BundlesPage() {
  const { data: aiBundles, source, generatedAt, loading, error, reload } =
    useCopilot("bundles");


  if (!aiBundles) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Bundle & Cross-sell Miner"
      subtitle="Discover high-lift product bundles from co-purchase patterns — with auto-drafted landing copy."
      icon={Package2}
      tone="var(--color-accent-sky)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Proposed bundles"
            subtitle="Ranked by projected lift · co-purchase lift × attach rate"
            eyebrow={<span className="inline-flex items-center gap-1"><Sparkles size={11} /> AI</span>}
            className="mb-0"
          />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiBundles.map((b) => (
            <div key={b.id} className="soft-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in oklab, var(--color-accent-sky) 14%, transparent)", color: "var(--color-accent-sky)" }}
                >
                  <Package2 size={16} />
                </span>
                <span className="text-[16px] font-semibold tabular-nums text-[var(--color-success-text)]">{b.lift}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.items.map((item) => (
                  <Chip key={item} tone="neutral">{item}</Chip>
                ))}
              </div>
              <p className="text-[12.5px] text-muted mt-3 leading-relaxed">{b.rationale}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[12px]">
                  <span><span className="text-subtle">Attach:</span> <span className="font-semibold tabular-nums">{b.attach}</span></span>
                  <span><span className="text-subtle">Price:</span> <span className="font-semibold tabular-nums">{b.price}</span></span>
                </div>
                <button type="button" className="btn btn-soft btn-sm">
                  Publish <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
