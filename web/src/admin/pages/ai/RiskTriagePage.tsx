import { Check, ShieldAlert, X } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

const scoreTone = (s: number): "danger" | "pending" | "neutral" => (s >= 80 ? "danger" : s >= 65 ? "pending" : "neutral");

export default function RiskTriagePage() {
  const { data: aiRiskOrders, source, generatedAt, loading, error, reload } =
    useCopilot("risk");


  if (!aiRiskOrders) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Fraud & Risk Triage"
      subtitle="Score risky orders with explainable signals — approve or hold in one click."
      icon={ShieldAlert}
      tone="var(--color-accent-rose)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            title="Flagged orders"
            subtitle="Awaiting review · ranked by risk score"
            eyebrow="Risk AI"
            className="mb-0"
          />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiRiskOrders.map((o) => (
            <div key={o.id} className="soft-surface p-4 flex flex-col md:flex-row md:items-center gap-4">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-rose) 14%, transparent)", color: "var(--color-accent-rose)" }}
              >
                <ShieldAlert size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold tabular-nums">{o.id}</p>
                  <span className="text-[13px]">· {o.customer}</span>
                  <Chip tone="neutral">{o.total}</Chip>
                  <Chip tone={scoreTone(o.score)}>Risk {o.score}</Chip>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.flags.map((f) => (
                    <span key={f} className="chip chip-pending text-[11.5px]">{f}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="btn btn-soft btn-sm">
                  <X size={13} /> Hold
                </button>
                <button type="button" className="btn btn-primary btn-sm">
                  <Check size={13} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
