import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Sparkles } from "lucide-react";

const examples = [
  "A gift under $100 for someone minimal",
  "Top-rated home goods",
  "What's on sale right now?",
  "Cozy fashion for fall",
];

export default function AiHeroPrompt() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) return;
    // Route the prompt into Shop's smart search, which interprets natural language.
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <section
      className="relative rounded-[28px] overflow-hidden px-6 py-10 md:px-12 md:py-14"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--color-brand-500) 14%, var(--color-surface)), color-mix(in oklab, var(--color-accent-violet) 12%, var(--color-surface)))",
      }}
    >
      <span className="absolute inset-0 bg-grid opacity-30" aria-hidden />

      <div className="relative max-w-3xl mx-auto text-center">
        <span
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-5"
          style={{
            background:
              "color-mix(in oklab, var(--color-surface) 92%, transparent)",
            color: "var(--color-accent-violet)",
          }}
        >
          <Sparkles size={11} /> AI-first shopping
        </span>

        <h1 className="font-display text-[32px] md:text-[48px] leading-[1.05] tracking-[-0.02em] font-semibold">
          Tell us what you're looking for.
        </h1>
        <p className="text-[14px] md:text-[16px] text-[var(--color-text-muted)] mt-3 max-w-xl mx-auto">
          Describe it in plain words — IntelliCart's AI finds the right piece, summarizes reviews,
          and answers your questions before you click "add to cart".
        </p>

        <form
          onSubmit={submit}
          className="mt-7 mx-auto max-w-2xl flex items-center gap-2 card-surface !p-1.5 rounded-[14px] shadow-[var(--shadow-pop)]"
        >
          <span className="pl-3 text-[var(--color-text-subtle)]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A linen jacket for warm-but-not-too-warm days…"
            className="flex-1 bg-transparent border-0 outline-none text-[14.5px] py-2 placeholder:text-[var(--color-text-subtle)]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="btn btn-primary btn-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Ask AI <ArrowRight size={13} />
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => navigate(`/shop?q=${encodeURIComponent(ex)}`)}
              className="text-[12px] font-medium rounded-full px-3 py-1.5 border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_75%,transparent)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
