import { Check, MessageSquare, Send, ThumbsUp } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiSupportDrafts } from "../../mock-ai";

export default function SupportAssistantPage() {
  return (
    <AiFeatureLayout
      title="Support Assistant"
      subtitle="Compose policy-aware reply drafts in seconds using full order context."
      icon={MessageSquare}
      tone="var(--color-accent-mint)"
    >
      <Card>
        <CardHeader title="Ticket drafts" subtitle="Ready to send · review before approving" eyebrow="Draft replies" />
        <div className="space-y-3">
          {aiSupportDrafts.map((t) => (
            <div key={t.ticket} className="soft-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11.5px] font-semibold text-subtle tabular-nums">{t.ticket}</span>
                <Chip tone="info">{t.intent}</Chip>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] p-3.5">
                {t.draft}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[12px] text-muted">
                  <ThumbsUp size={12} />
                  <span>Confidence: 92%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-ghost btn-sm">
                    <Check size={13} /> Edit
                  </button>
                  <button type="button" className="btn btn-primary btn-sm">
                    <Send size={13} /> Send reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
