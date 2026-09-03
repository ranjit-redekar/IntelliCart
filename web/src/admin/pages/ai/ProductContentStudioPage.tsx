import { Copy, FileText, RefreshCcw, Sparkles } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

export default function ProductContentStudioPage() {
  const { data: aiContentDrafts, source, generatedAt, loading, error, reload } =
    useCopilot("content-studio");


  if (!aiContentDrafts) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Product Content Studio"
      subtitle="Generate titles, tone variants, bullet points, and SEO copy from SKU context in seconds."
      icon={FileText}
      tone="var(--color-accent-violet)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card>
        <CardHeader
          title="Draft variants"
          subtitle="Generated copy tuned to your brand voice"
          eyebrow="Copy AI"
          action={
            <button type="button" className="btn btn-soft btn-sm">
              <RefreshCcw size={13} /> Regenerate
            </button>
          }
        />
        <div className="space-y-3">
          {aiContentDrafts.map((row) => (
            <div
              key={row.sku}
              className="soft-surface p-4 hover:border-[var(--color-border-strong)] transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-subtle tabular-nums">{row.sku}</span>
                    <Chip tone="info">{row.tone}</Chip>
                  </div>
                  <p className="text-[15px] font-semibold mt-1.5 tracking-tight">{row.title}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" className="btn btn-icon btn-sm btn-ghost tip" data-tip="Copy">
                    <Copy size={13} />
                  </button>
                  <button type="button" className="btn btn-icon btn-sm btn-ghost tip" data-tip="Refresh">
                    <RefreshCcw size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[12.5px] text-muted mt-3 flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--color-accent-violet)]" /> SEO: <span>{row.seo}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
