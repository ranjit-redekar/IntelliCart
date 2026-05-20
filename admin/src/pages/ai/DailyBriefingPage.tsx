import { CheckCircle2, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { aiDailyBriefing } from "../../mock-ai";

const toneMap: Record<string, string> = {
  mint: "var(--color-accent-mint)",
  violet: "var(--color-accent-violet)",
  rose: "var(--color-accent-rose)",
  amber: "var(--color-accent-amber)",
};

export default function DailyBriefingPage() {
  return (
    <AiFeatureLayout
      title="Daily Briefing"
      subtitle="A one-paragraph executive summary every morning — what changed, what to watch, what to do."
      icon={Newspaper}
      tone="var(--color-brand-500)"
    >
      <Card>
        <CardHeader
          title="This morning's brief"
          subtitle={aiDailyBriefing.date}
          eyebrow="Executive summary"
          action={
            <button type="button" className="btn btn-soft btn-sm">
              <RefreshCw size={13} /> Regenerate
            </button>
          }
        />
        <p className="text-[14px] leading-relaxed">{aiDailyBriefing.summary}</p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiDailyBriefing.highlights.map((h) => {
          const tone = toneMap[h.tone] ?? "var(--color-brand-500)";
          return (
            <Card key={h.label}>
              <p className="text-[11.5px] uppercase tracking-[0.1em] text-subtle font-semibold">{h.label}</p>
              <p className="text-[18px] font-semibold tracking-tight mt-2">{h.value}</p>
              <p className="text-[12.5px] font-semibold mt-1" style={{ color: tone }}>{h.change}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Today's agenda"
          subtitle="Suggested by the model · ordered by impact"
          eyebrow={<span className="inline-flex items-center gap-1"><Sparkles size={11} /> AI</span>}
        />
        <ul className="space-y-2.5">
          {aiDailyBriefing.agenda.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[color-mix(in_oklab,var(--color-accent-mint)_14%,transparent)] text-[var(--color-accent-mint)] shrink-0 mt-0.5">
                <CheckCircle2 size={13} />
              </span>
              <p className="text-[13.5px]">{item}</p>
            </li>
          ))}
        </ul>
      </Card>
    </AiFeatureLayout>
  );
}
