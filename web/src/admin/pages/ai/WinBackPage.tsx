import { HeartHandshake, Send } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Avatar } from "../../components/ui/Avatar";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

const riskTone = (r: number): "danger" | "pending" | "neutral" => (r >= 85 ? "danger" : r >= 70 ? "pending" : "neutral");

export default function WinBackPage() {
  const { data: aiWinBack, source, generatedAt, loading, error, reload } =
    useCopilot("win-back");


  if (!aiWinBack) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Churn & Win-back"
      subtitle="Customers whose purchase cadence is slipping — with personalized win-back drafts grounded in their history."
      icon={HeartHandshake}
      tone="var(--color-accent-rose)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="At-risk customers"
            subtitle="Ranked by churn-risk score · top 50"
            eyebrow="Retention AI"
            className="mb-0"
            action={<button type="button" className="btn btn-primary btn-sm">Send all drafts</button>}
          />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiWinBack.map((c) => (
            <div key={c.id} className="soft-surface p-4 flex flex-col md:flex-row md:items-center gap-4">
              <Avatar name={c.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold">{c.name}</p>
                  <Chip tone={riskTone(c.risk)}>Risk {c.risk}</Chip>
                  <span className="text-[12px] text-subtle">Last order {c.lastOrder} · baseline {c.baseline}</span>
                </div>
                <p className="text-[13px] mt-2 leading-relaxed">{c.draft}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="btn btn-soft btn-sm">Edit</button>
                <button type="button" className="btn btn-primary btn-sm">
                  <Send size={13} /> Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
