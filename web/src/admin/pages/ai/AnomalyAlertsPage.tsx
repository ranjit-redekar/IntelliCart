import { Activity, AlertTriangle, ArrowUpRight } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

export default function AnomalyAlertsPage() {
  const { data: aiAnomalies, source, generatedAt, loading, error, reload } =
    useCopilot("anomaly-alerts");


  if (!aiAnomalies) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Anomaly Alerts"
      subtitle="Outlier detection across refunds, payment failures, and behavioral metrics — with root-cause reasoning."
      icon={Activity}
      tone="var(--color-accent-rose)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card>
        <CardHeader title="Detected anomalies" subtitle="Past 24 hours" eyebrow="Risk detection" />
        <div className="space-y-3">
          {aiAnomalies.map((a) => (
            <div
              key={a.metric}
              className="soft-surface p-4 flex flex-wrap items-center gap-4 hover:border-[var(--color-border-strong)] transition-colors"
            >
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 relative"
                style={{ background: "color-mix(in oklab, var(--color-accent-rose) 14%, transparent)", color: "var(--color-accent-rose)" }}
              >
                <AlertTriangle size={16} />
                <span
                  className="absolute inset-0 rounded-[12px] animate-[pulse-ring_1.6s_ease-out_infinite]"
                  aria-hidden
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold">{a.metric}</p>
                <p className="text-[13px] text-muted mt-0.5">{a.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] text-subtle uppercase tracking-[0.08em]">Change</p>
                  <p className="text-[18px] font-semibold tracking-tight tabular-nums text-[var(--color-accent-rose)] flex items-center gap-1">
                    <ArrowUpRight size={14} /> {a.change}
                  </p>
                </div>
                <button type="button" className="btn btn-soft btn-sm">
                  Investigate
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
