import { Bot, Send, TrendingUp, Wand2, Zap } from "lucide-react";
import AiFeatureLayout from "../../components/AiFeatureLayout";
import { Card, CardHeader } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { useCopilot } from "../../lib/useCopilot";
import { CopilotState } from "../../components/CopilotState";

const suggestions = [
  "Why did revenue drop on Tuesday?",
  "Top 3 SKUs at risk of stockout this week",
  "Compare returning vs new customer AOV",
];

const cards = [
  { title: "Likely cause", body: "Checkout friction on payment step 2.", tone: "var(--color-accent-amber)", icon: Zap },
  { title: "Priority action", body: "Enable express checkout for repeat users.", tone: "var(--color-brand-500)", icon: Wand2 },
  { title: "Expected lift", body: "+0.3% to +0.5% conversion uplift.", tone: "var(--color-accent-mint)", icon: TrendingUp },
];

export default function SalesCopilotPage() {
  const { data: aiCopilotChats, source, generatedAt, loading, error, reload } =
    useCopilot("sales-copilot");


  if (!aiCopilotChats) return <CopilotState loading={loading} error={error} onRetry={reload} />;

  return (
    <AiFeatureLayout
      title="Sales Copilot"
      subtitle="Ask business questions and get reasoned, actionable answers grounded in your store data."
      icon={Bot}
      tone="var(--color-brand-500)"
    >
      <CopilotState.Badge source={source} generatedAt={generatedAt} />
      <Card padded={false} className="overflow-hidden">
        <div className="p-5 pb-3">
          <CardHeader title="Conversation" subtitle="Insight Q&A · grounded in last 30 days" eyebrow="Live" className="mb-0" />
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[420px] overflow-y-auto">
          {aiCopilotChats.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div key={i} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                {isUser ? (
                  <Avatar name="Ranjit R" size={32} />
                ) : (
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))" }}
                  >
                    <Bot size={14} />
                  </span>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed border ${
                    isUser
                      ? "bg-[var(--color-brand-600)] text-white border-transparent rounded-tr-sm"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2 bg-[var(--color-surface-2)]">
          {suggestions.map((s) => (
            <button key={s} type="button" className="btn btn-soft btn-sm text-[12px]">
              {s}
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-[var(--color-border)] flex items-center gap-2">
          <input className="input h-10" placeholder="Ask anything about your store…" />
          <button type="button" className="btn btn-primary btn-icon">
            <Send size={15} />
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title} interactive>
            <span
              className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3"
              style={{ background: `color-mix(in oklab, ${c.tone} 14%, transparent)`, color: c.tone }}
            >
              <c.icon size={16} />
            </span>
            <h4 className="text-[14px] font-semibold">{c.title}</h4>
            <p className="text-[13px] text-muted mt-1">{c.body}</p>
          </Card>
        ))}
      </div>
    </AiFeatureLayout>
  );
}
