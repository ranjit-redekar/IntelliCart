import { ArrowDownRight, ArrowUpRight, Flame, Snowflake, TrendingUp } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Chip } from "../../components/ui/StatusChip";
import { Sparkline } from "../../components/ui/Sparkline";
import { aiTrendSpotter } from "../../mock-ai";

const windows = ["7d", "30d", "90d"] as const;
const segments = ["All", "New", "Repeat", "VIP"] as const;

export default function TrendSpotterPage() {
  return (
    <AiFeatureLayout
      title="Trend Spotter"
      subtitle="Identify rising, cooling, and emerging products with driver explanations and segment breakdowns."
      icon={TrendingUp}
      tone="var(--color-accent-mint)"
    >
      <Card>
        <CardHeader
          title="What the model is seeing"
          subtitle="Narrative · auto-generated from rolling sales aggregates"
          eyebrow="Insight"
          action={
            <div className="flex items-center gap-2">
              {windows.map((w, i) => (
                <button key={w} type="button" className={`btn btn-sm ${i === 1 ? "btn-primary" : "btn-soft"}`}>{w}</button>
              ))}
            </div>
          }
        />
        <p className="text-[13.5px] leading-relaxed text-[var(--color-text)]">{aiTrendSpotter.narrative}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {segments.map((s, i) => (
            <button key={s} type="button" className={`btn btn-sm ${i === 0 ? "btn-primary" : "btn-soft"}`}>{s}</button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padded={false}>
          <div className="p-5 pb-3">
            <CardHeader
              title="Heating up"
              subtitle="Largest accelerations · last 7 days"
              eyebrow={<span className="inline-flex items-center gap-1"><Flame size={11} className="text-[var(--color-accent-mint)]" /> Rising</span>}
              className="mb-0"
            />
          </div>
          <div className="px-5 pb-5 space-y-3">
            {aiTrendSpotter.heating.map((t) => (
              <div key={t.sku} className="soft-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{t.sku}</p>
                    <p className="text-[14.5px] font-semibold tracking-tight truncate">{t.name}</p>
                    <p className="text-[12.5px] text-muted mt-1">{t.driver}</p>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--color-accent-mint)] inline-flex items-center gap-1 shrink-0">
                    <ArrowUpRight size={14} /> {t.change}
                  </span>
                </div>
                <div className="mt-3 -mx-2">
                  <Sparkline data={[...t.series]} color="var(--color-accent-mint)" />
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button type="button" className="btn btn-soft btn-sm">Investigate</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          <div className="p-5 pb-3">
            <CardHeader
              title="Cooling down"
              subtitle="Largest decelerations · last 7 days"
              eyebrow={<span className="inline-flex items-center gap-1"><Snowflake size={11} className="text-[var(--color-accent-rose)]" /> Falling</span>}
              className="mb-0"
            />
          </div>
          <div className="px-5 pb-5 space-y-3">
            {aiTrendSpotter.cooling.map((t) => (
              <div key={t.sku} className="soft-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11.5px] text-subtle font-semibold tabular-nums">{t.sku}</p>
                    <p className="text-[14.5px] font-semibold tracking-tight truncate">{t.name}</p>
                    <p className="text-[12.5px] text-muted mt-1">{t.driver}</p>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--color-accent-rose)] inline-flex items-center gap-1 shrink-0">
                    <ArrowDownRight size={14} /> {t.change}
                  </span>
                </div>
                <div className="mt-3 -mx-2">
                  <Sparkline data={[...t.series]} color="var(--color-accent-rose)" />
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <Chip tone="pending">Watch</Chip>
                  <button type="button" className="btn btn-soft btn-sm">Take action</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AiFeatureLayout>
  );
}
