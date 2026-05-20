import { Megaphone, Send } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiCampaigns } from "../../mock-ai";

export default function CampaignsPage() {
  return (
    <AiFeatureLayout
      title="Campaign Generator"
      subtitle="Draft email, push, and banner copy per segment or trend — hand off offer math to Promotion Optimizer."
      icon={Megaphone}
      tone="var(--color-brand-500)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Draft campaigns" subtitle="Targeted by segment · ready to schedule" eyebrow="Marketing AI" className="mb-0" />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiCampaigns.map((c) => (
            <div key={c.id} className="soft-surface p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{c.id}</p>
                    <Chip tone="info">{c.target}</Chip>
                    <Chip tone="neutral">{c.channel}</Chip>
                  </div>
                  <p className="text-[15px] font-semibold tracking-tight mt-2">{c.subject}</p>
                  <p className="text-[13px] text-muted mt-1 leading-relaxed">{c.body}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" className="btn btn-soft btn-sm">Edit</button>
                  <button type="button" className="btn btn-primary btn-sm">
                    <Send size={13} /> Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Generate a new campaign" subtitle="Pick a segment or trend; the model drafts copy" eyebrow={<span className="inline-flex items-center gap-1"><Megaphone size={11} /> AI</span>} />
        <div className="flex flex-wrap items-center gap-2">
          <input className="input h-10 flex-1 min-w-[200px]" placeholder="e.g. Re-engage at-risk VIPs around the Linen Field Jacket launch" />
          <button type="button" className="btn btn-primary">Generate drafts</button>
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
