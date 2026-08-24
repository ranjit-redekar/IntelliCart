import { Truck } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiLogistics } from "../../mock-ai";

const onTimeTone = (rate: string): "success" | "pending" | "danger" => {
  const n = parseFloat(rate);
  if (n >= 90) return "success";
  if (n >= 80) return "pending";
  return "danger";
};

export default function LogisticsPage() {
  return (
    <AiFeatureLayout
      title="Logistics Agent"
      subtitle="Per-lane on-time performance and carrier reallocation suggestions."
      icon={Truck}
      tone="var(--color-accent-amber)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Lane performance" subtitle="Rolling 30 days" eyebrow="Logistics AI" className="mb-0" />
        </div>
        <div className="px-5 pb-5 space-y-3">
          {aiLogistics.map((l) => (
            <div key={l.lane} className="soft-surface p-4 flex flex-col md:flex-row md:items-center gap-4">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-accent-amber) 14%, transparent)", color: "var(--color-accent-amber)" }}
              >
                <Truck size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold">{l.lane}</p>
                  <Chip tone="neutral">{l.carrier}</Chip>
                  <Chip tone={onTimeTone(l.onTime)}>{l.onTime} on-time</Chip>
                </div>
                <p className="text-[12.5px] text-muted mt-1">{l.suggestion} · avg {l.avgDays}d</p>
              </div>
              <button type="button" className="btn btn-soft btn-sm">Review</button>
            </div>
          ))}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
