import { ChartLine, Package, TrendingUp } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Sparkline } from "../../components/ui/Sparkline";
import { aiForecasts } from "../../mock-ai";

const series: Record<string, number[]> = {
  "P-1001": [120, 130, 142, 138, 156, 162, 170, 175, 178, 180],
  "P-1003": [56, 60, 58, 62, 65, 68, 70, 71, 72, 72],
};

export default function ForecastingPage() {
  return (
    <AiFeatureLayout
      title="Forecasting"
      subtitle="Demand and inventory forecasting by SKU with stockout risk indicators."
      icon={ChartLine}
      tone="var(--color-accent-violet)"
    >
      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Forecast board" subtitle="Next 30 days · per SKU" eyebrow="Demand AI" className="mb-0" />
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiForecasts.map((f) => {
            const cover = Math.round((f.stock / f.demandNext30Days) * 30);
            const isRisk = /risk/i.test(f.risk);
            return (
              <div key={f.sku} className="soft-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                      style={{ background: "color-mix(in oklab, var(--color-accent-violet) 14%, transparent)", color: "var(--color-accent-violet)" }}
                    >
                      <Package size={16} />
                    </span>
                    <div>
                      <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{f.sku}</p>
                      <p className="text-[15px] font-semibold tracking-tight">SKU forecast</p>
                    </div>
                  </div>
                  <Chip tone={isRisk ? "danger" : "pending"}>{f.risk}</Chip>
                </div>

                <div className="mt-4 -mx-2">
                  <Sparkline data={series[f.sku] ?? [20, 22, 28, 32, 30, 36]} color="var(--color-accent-violet)" />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] py-2">
                    <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Demand</p>
                    <p className="text-[14px] font-semibold tabular-nums flex items-center justify-center gap-0.5">
                      {f.demandNext30Days}
                      <TrendingUp size={12} className="text-[var(--color-accent-mint)]" />
                    </p>
                  </div>
                  <div className="rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] py-2">
                    <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Stock</p>
                    <p className="text-[14px] font-semibold tabular-nums">{f.stock}</p>
                  </div>
                  <div className="rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] py-2">
                    <p className="text-[10.5px] text-subtle uppercase tracking-[0.08em]">Cover</p>
                    <p className="text-[14px] font-semibold tabular-nums">{cover}d</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AiFeatureLayout>
  );
}
