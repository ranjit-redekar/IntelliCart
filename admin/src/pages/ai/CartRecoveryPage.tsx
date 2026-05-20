import { Mail, ShoppingBag } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiCartRecovery } from "../../mock-ai";

export default function CartRecoveryPage() {
  return (
    <AiFeatureLayout
      title="Cart Abandonment Analyst"
      subtitle="Cluster why carts are abandoned and run a multi-stage recovery sequence."
      icon={ShoppingBag}
      tone="var(--color-accent-amber)"
    >
      <Card>
        <CardHeader title="Abandonment clusters" subtitle="Last 30 days · grouped by inferred reason" eyebrow="Behavioral AI" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiCartRecovery.clusters.map((c) => (
            <div key={c.reason} className="soft-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[14.5px] font-semibold">{c.reason}</p>
                <Chip tone="info">{c.share}</Chip>
              </div>
              <p className="text-[12.5px] text-muted mt-2">{c.suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Recovery sequence" subtitle="Drafted by the model · ready to launch" eyebrow="Drafts" className="mb-0" />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiCartRecovery.drafts.map((d) => (
            <div key={d.stage} className="soft-surface p-4 flex flex-wrap items-center gap-4">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-amber) 14%, transparent)", color: "var(--color-accent-amber)" }}
              >
                <Mail size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold">{d.stage}</p>
                  <Chip tone="neutral">{d.channel}</Chip>
                </div>
                <p className="text-[13px] mt-1">{d.text}</p>
              </div>
              <button type="button" className="btn btn-soft btn-sm">Edit</button>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
