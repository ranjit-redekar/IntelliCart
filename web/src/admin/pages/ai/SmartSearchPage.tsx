import { ArrowRight, Search, Sparkles } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

export default function SmartSearchPage() {
  const { data: aiSearchSamples, source, generatedAt, loading, error, reload } =
    useCopilot("smart-search");


  if (!aiSearchSamples) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Smart Search"
      subtitle="Type intent in plain English. IntelliCart translates it into precise queries across products, orders, and customers."
      icon={Search}
      tone="var(--color-accent-sky)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <Sparkles size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-accent-sky)]" />
          <input
            className="input pl-10 pr-10 h-12 text-[14.5px]"
            placeholder="e.g. show delayed orders above $200 from last 3 days"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Suggested queries" subtitle="Try one of these to start" eyebrow="NL Query" />
          <ul className="space-y-2">
            {aiSearchSamples.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-3 text-left px-3.5 py-2.5 rounded-[10px] border border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)] dark:hover:bg-[color-mix(in_oklab,var(--color-brand-500)_12%,transparent)] transition-colors group"
                >
                  <span className="text-[13.5px] text-[var(--color-text)] truncate">{q}</span>
                  <ArrowRight
                    size={14}
                    className="text-subtle group-hover:text-[var(--color-brand-600)] group-hover:translate-x-0.5 transition-transform shrink-0"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Result snapshot" subtitle="Live preview of structured results" eyebrow="Output" />
          <div className="soft-surface p-4">
            <p className="text-[13.5px]">
              <span className="font-semibold">3 orders found</span> matching{" "}
              <span className="text-[var(--color-brand-600)] font-medium">delayed</span> status and order value{" "}
              <span className="text-[var(--color-brand-600)] font-medium">over $200</span>.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["ORD-8901", "ORD-8902", "ORD-8903"].map((id) => (
                <div key={id} className="text-center rounded-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] py-2.5">
                  <p className="text-[11px] text-subtle">Order</p>
                  <p className="text-[12.5px] font-semibold tabular-nums">{id}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AiFeatureLayout>
  );
}
