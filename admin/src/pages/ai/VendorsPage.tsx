import { Factory, Minus, TrendingDown, TrendingUp } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { aiVendors } from "../../mock-ai";

const trendIcon = (t: string) => {
  if (t === "improving") return <TrendingUp size={13} className="text-[var(--color-accent-mint)]" />;
  if (t === "declining") return <TrendingDown size={13} className="text-[var(--color-accent-rose)]" />;
  return <Minus size={13} className="text-subtle" />;
};

export default function VendorsPage() {
  return (
    <AiFeatureLayout
      title="Vendor Scorecard"
      subtitle="Per-supplier on-time, defect, and lead-time tracking — with reallocation suggestions."
      icon={Factory}
      tone="var(--color-accent-violet)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Supplier performance" subtitle="Rolling 90 days" eyebrow="Vendor AI" className="mb-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                <th className="text-left px-5 py-2 font-semibold">Vendor</th>
                <th className="text-left px-5 py-2 font-semibold">Category</th>
                <th className="text-right px-5 py-2 font-semibold">On-time</th>
                <th className="text-right px-5 py-2 font-semibold">Defect</th>
                <th className="text-right px-5 py-2 font-semibold">Lead</th>
                <th className="text-left px-5 py-2 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {aiVendors.map((v) => (
                <tr key={v.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-3">
                    <p className="font-medium">{v.name}</p>
                    <p className="text-[11.5px] text-subtle tabular-nums">{v.id}</p>
                  </td>
                  <td className="px-5 py-3"><Chip tone="neutral">{v.category}</Chip></td>
                  <td className="px-5 py-3 text-right tabular-nums">{v.onTime}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{v.defect}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{v.lead}</td>
                  <td className="px-5 py-3"><span className="inline-flex items-center gap-1 capitalize">{trendIcon(v.trend)} {v.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
