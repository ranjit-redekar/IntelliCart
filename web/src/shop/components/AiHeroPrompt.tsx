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
    // ponytail: a search bar, not a second hero — the slider below is the only full-height panel.
    <section className="relative rounded-[18px] overflow-hidden card-surface !p-0">
      <span
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, color-mix(in oklab, var(--color-brand-500) 10%, transparent), color-mix(in oklab, var(--color-accent-violet) 9%, transparent))",
        }}
        aria-hidden
      />

      <div className="relative px-3.5 py-3 md:px-5 md:py-3.5 flex flex-col lg:flex-row lg:items-center gap-3">
        <form onSubmit={submit} className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1.5 rounded-[10px] shrink-0"
            style={{
              background: "color-mix(in oklab, var(--color-accent-violet) 14%, var(--color-surface))",
              color: "var(--color-accent-violet)",
            }}
          >
            <Sparkles size={11} /> Ask AI
          </span>
          <span className="text-[var(--color-text-subtle)] shrink-0 sm:hidden">
            <Search size={15} />
          </span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you're after — “a linen jacket for warm days”"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[14px] py-1.5 placeholder:text-[var(--color-text-subtle)]"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="btn btn-primary btn-sm shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search <ArrowRight size={13} />
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto lg:overflow-visible lg:shrink-0">
          {examples.slice(0, 3).map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => navigate(`/shop?q=${encodeURIComponent(ex)}`)}
              className="text-[11.5px] font-medium rounded-full px-2.5 py-1 whitespace-nowrap border border-[var(--color-border)] text-muted hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
