import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card } from "./ui/Card";
import { generateProductAnswer } from "../lib/ai";
import { cn } from "../lib/cn";

interface QA {
  id: string;
  question: string;
  answer: string;
}

interface Props {
  productName: string;
  category: string;
}

const suggestions = [
  "What's it made of?",
  "How does it compare to similar products?",
  "How should I care for it?",
  "What's the return policy?",
];

export default function AiProductQA({ productName, category }: Props) {
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [qas, setQas] = useState<QA[]>([]);

  async function ask(question: string) {
    const clean = question.trim();
    if (!clean || thinking) return;
    setDraft("");
    setThinking(true);
    const answer = await generateProductAnswer(clean, productName, category);
    setQas((c) => [{ id: `qa-${Date.now()}`, question: clean, answer }, ...c]);
    setThinking(false);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
            IntelliCart AI
          </p>
          <h3 className="text-[15px] font-semibold tracking-tight mt-0.5">
            Ask about this product
          </h3>
          <p className="text-[12.5px] text-muted mt-0.5">
            Get an instant answer based on the spec sheet and customer reviews.
          </p>
        </div>
        <span
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
          }}
        >
          <Sparkles size={16} />
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Anything about the ${productName}…`}
          className="input h-10 flex-1"
        />
        <button
          type="submit"
          aria-label="Ask question"
          disabled={!draft.trim() || thinking}
          className={cn(
            "btn btn-primary btn-sm",
            (!draft.trim() || thinking) && "opacity-60 cursor-not-allowed"
          )}
        >
          <Send size={13} />
        </button>
      </form>

      {qas.length === 0 && !thinking && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="text-[11.5px] font-medium rounded-full border border-[var(--color-border)] px-2.5 py-1 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {thinking && (
        <div className="flex items-center gap-2 text-[12.5px] text-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] animate-pulse" />
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] animate-pulse"
            style={{ animationDelay: "120ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] animate-pulse"
            style={{ animationDelay: "240ms" }}
          />
          <span>Thinking</span>
        </div>
      )}

      {qas.length > 0 && (
        <div className="space-y-3">
          {qas.map((qa) => (
            <div key={qa.id} className="soft-surface p-3.5">
              <p className="text-[12px] font-semibold text-subtle">You asked</p>
              <p className="text-[13.5px] mt-0.5">{qa.question}</p>
              <p className="text-[12px] font-semibold text-[var(--color-accent-violet)] mt-3 inline-flex items-center gap-1">
                <Sparkles size={11} /> IntelliCart AI
              </p>
              <p className="text-[13.5px] mt-1 leading-relaxed text-[var(--color-text-muted)]">
                {qa.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
