import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

export default function ReviewSummarizerPage() {
  const { data: aiReviewSummary, source, generatedAt, loading, error, reload } =
    useCopilot("review-summarizer");


  if (!aiReviewSummary) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Review Summarizer"
      subtitle="Compress thousands of customer reviews into clear strengths and recurring issues per SKU."
      icon={Sparkles}
      tone="var(--color-brand-600)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Review insights" subtitle="Voice of customer · auto-extracted" eyebrow="Insights" className="mb-0" />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiReviewSummary.map((r) => (
            <div key={r.product} className="soft-surface p-4">
              <p className="text-[15px] font-semibold tracking-tight">{r.product}</p>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-success-text)] shrink-0">
                    <ThumbsUp size={13} />
                  </span>
                  <div>
                    <p className="text-[11.5px] uppercase tracking-[0.08em] font-semibold text-subtle">Strengths</p>
                    <p className="text-[13px] mt-0.5">{r.pros}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-rose)_14%,transparent)] text-[var(--color-accent-rose)] shrink-0">
                    <ThumbsDown size={13} />
                  </span>
                  <div>
                    <p className="text-[11.5px] uppercase tracking-[0.08em] font-semibold text-subtle">Concerns</p>
                    <p className="text-[13px] mt-0.5">{r.cons}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
