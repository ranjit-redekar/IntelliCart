import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, RefreshCcw, Sparkles, X } from "lucide-react";
import { useFocusTrap } from "../../lib/useFocusTrap";
import { Chip } from "./ui/StatusChip";
import { cn } from "../lib/cn";

type Tone = "premium" | "friendly" | "confident" | "playful";
type Length = "short" | "medium" | "long";

const tones: { id: Tone; label: string; hint: string }[] = [
  { id: "premium", label: "Premium", hint: "Restrained, considered, quietly luxurious" },
  { id: "friendly", label: "Friendly", hint: "Warm, conversational, approachable" },
  { id: "confident", label: "Confident", hint: "Direct, benefit-led, assertive" },
  { id: "playful", label: "Playful", hint: "Lively, witty, energetic" },
];

const lengths: { id: Length; label: string; target: number }[] = [
  { id: "short", label: "Short", target: 90 },
  { id: "medium", label: "Medium", target: 180 },
  { id: "long", label: "Long", target: 320 },
];

interface Variant {
  id: string;
  tone: Tone;
  text: string;
}

interface Props {
  open: boolean;
  productName: string;
  category: string;
  onClose: () => void;
  onInsert: (text: string) => void;
}

function joinKeywords(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildVariants(name: string, category: string, tone: Tone, length: Length, keywords: string[]): Variant[] {
  const subject = name.trim() || "this product";
  const cat = category.toLowerCase();
  const kw = keywords.length ? keywords.join(", ") : "";
  const target = lengths.find((l) => l.id === length)?.target ?? 180;

  const openers: Record<Tone, string[]> = {
    premium: [
      `Crafted with restraint, the ${subject} brings a quiet sense of luxury to everyday ${cat}.`,
      `The ${subject} is a study in considered design — measured proportions and materials chosen to age beautifully.`,
      `Refined down to the smallest detail, the ${subject} earns its place in your daily ${cat} routine.`,
    ],
    friendly: [
      `Meet the ${subject} — your new favorite for ${cat}, designed to feel right from day one.`,
      `The ${subject} is built for the way you actually live. Comfortable, easy, and quietly thoughtful.`,
      `We made the ${subject} for the small moments — the ones where ${cat} should just work.`,
    ],
    confident: [
      `The ${subject} delivers on the details that matter — built to outperform and outlast.`,
      `Engineered for performance, the ${subject} sets a new bar for everyday ${cat}.`,
      `No fluff, no compromises. The ${subject} is ${cat} done right.`,
    ],
    playful: [
      `Say hello to the ${subject} — the most fun your ${cat} has had all year.`,
      `The ${subject} is here to shake up your ${cat} routine, one tiny delight at a time.`,
      `Bright, bold, and a little bit clever — the ${subject} is ${cat} with a wink.`,
    ],
  };

  const middles: Record<Tone, string[]> = {
    premium: [
      "Every seam, surface, and finish is the result of patient iteration.",
      "Subtle proportions and tactile materials create a piece that feels inevitable.",
      "It rewards close inspection while disappearing comfortably into daily use.",
    ],
    friendly: [
      "We sweated the small stuff so you don't have to think twice about it.",
      "The kind of piece that just slots into your life and stays there.",
      "Designed with the help of customers who told us exactly what was missing.",
    ],
    confident: [
      "Independently tested, obsessively refined, and ready for real life.",
      "Built around the three things customers ranked most important.",
      "Every component is chosen for durability, not for the spec sheet.",
    ],
    playful: [
      "Small touches everywhere — the kind you'll notice on day three and grin.",
      "Designed to be useful first, charming second, and never boring.",
      "It does the job and looks like it's having a good time doing it.",
    ],
  };

  const closers: Record<Tone, string[]> = {
    premium: [
      "A quiet upgrade you'll feel every time you reach for it.",
      "Made to be lived with, not just looked at.",
      "Considered design that stays out of its own way.",
    ],
    friendly: [
      "We think you're going to love it. If not, send it back — easy as that.",
      "Free shipping, free returns, and a team that actually answers.",
      "Get yours and tell us what you make of it.",
    ],
    confident: [
      "Backed by a no-questions return window so you can put it through its paces.",
      "Order today and feel the difference within a week.",
      "Built for daily use. Priced to make sense.",
    ],
    playful: [
      "Treat yourself. You've earned it (probably).",
      "Add to cart, dance optional.",
      "One click away from a much better afternoon.",
    ],
  };

  function compose(seed: number): string {
    const open = openers[tone][seed % openers[tone].length];
    const middle = middles[tone][seed % middles[tone].length];
    const close = closers[tone][seed % closers[tone].length];
    const kwLine = kw ? ` Highlights: ${kw}.` : "";
    const base = `${open} ${middle}${kwLine} ${close}`;
    if (length === "short") {
      return `${open}${kwLine}`.trim();
    }
    if (length === "long") {
      const extra = ` Designed in collaboration with a small studio team, it leans into the details that survive the first season of use — and the next one. Whether it's your first piece of ${cat} or your tenth, it's the one you'll keep reaching for.`;
      return `${base}${extra}`.slice(0, Math.max(target + 40, base.length));
    }
    return base;
  }

  return [0, 1, 2].map((i) => ({
    id: `v${i + 1}`,
    tone,
    text: compose(i),
  }));
}

export default function AiDraftDialog({ open, productName, category, onClose, onInsert }: Props) {
  const [tone, setTone] = useState<Tone>("premium");
  const [length, setLength] = useState<Length>("medium");
  const [keywordsRaw, setKeywordsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const generateTimer = useRef<number | null>(null);

  const keywords = useMemo(() => joinKeywords(keywordsRaw), [keywordsRaw]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setVariants([]);
      setLoading(false);
      setCopiedId(null);
      if (generateTimer.current) {
        window.clearTimeout(generateTimer.current);
        generateTimer.current = null;
      }
    }
  }, [open]);

  function generate() {
    setLoading(true);
    setVariants([]);
    if (generateTimer.current) window.clearTimeout(generateTimer.current);
    generateTimer.current = window.setTimeout(() => {
      setVariants(buildVariants(productName, category, tone, length, keywords));
      setLoading(false);
    }, 700);
  }

  async function copy(v: Variant) {
    try {
      await navigator.clipboard.writeText(v.text);
      setCopiedId(v.id);
      window.setTimeout(() => setCopiedId((id) => (id === v.id ? null : id)), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!open) return null;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-draft-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fade-up_180ms_ease-out]"
      />
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col card-surface rounded-t-[20px] sm:rounded-[18px] shadow-[var(--shadow-pop)] overflow-hidden fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
              style={{
                background: "color-mix(in oklab, var(--color-accent-violet) 16%, transparent)",
                color: "var(--color-accent-violet)",
              }}
            >
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                IntelliCart AI
              </p>
              <h2 id="ai-draft-title" className="text-[18px] font-semibold tracking-tight leading-tight">
                Draft with AI
              </h2>
              <p className="text-[12.5px] text-muted mt-0.5 truncate">
                {productName.trim() ? (
                  <>
                    Generating for <span className="font-medium text-[var(--color-text)]">{productName}</span>
                    {category && <span className="text-subtle"> · {category}</span>}
                  </>
                ) : (
                  "Add a product name first for the best results"
                )}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-icon btn-sm btn-ghost shrink-0"
          >
            <X size={15} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          <div>
            <p className="text-[12.5px] font-semibold mb-2">Tone of voice</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "text-left rounded-[10px] border px-3 py-2 transition-colors",
                    tone === t.id
                      ? "border-[var(--color-brand-400)] bg-[color-mix(in_oklab,var(--color-brand-500)_8%,transparent)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                  )}
                  aria-pressed={tone === t.id}
                >
                  <span className="block text-[13px] font-semibold">{t.label}</span>
                  <span className="block text-[11px] text-subtle mt-0.5 leading-snug">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
            <div>
              <p className="text-[12.5px] font-semibold mb-2">Length</p>
              <div className="flex items-center p-0.5 soft-surface rounded-[10px]">
                {lengths.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLength(l.id)}
                    className={cn(
                      "flex-1 h-8 rounded-[8px] text-[12px] font-medium transition-colors",
                      length === l.id
                        ? "bg-[var(--color-surface)] shadow-[var(--shadow-soft)] text-[var(--color-text)]"
                        : "text-subtle hover:text-[var(--color-text)]"
                    )}
                    aria-pressed={length === l.id}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12.5px] font-semibold mb-2">Focus keywords <span className="text-subtle font-normal">· optional</span></p>
              <input
                type="text"
                className="input h-10"
                placeholder="e.g. linen, breathable, summer"
                value={keywordsRaw}
                onChange={(e) => setKeywordsRaw(e.target.value)}
              />
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {keywords.map((k) => (
                    <Chip key={k} tone="info">{k}</Chip>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11.5px] text-subtle">
              {variants.length > 0 ? `${variants.length} variants generated` : "Set your preferences, then generate"}
            </p>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className={cn("btn btn-primary btn-sm", loading && "opacity-70 cursor-wait")}
            >
              {variants.length > 0 ? (
                <>
                  <RefreshCcw size={13} className={cn(loading && "animate-spin")} />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles size={13} className={cn(loading && "animate-pulse")} />
                  {loading ? "Generating…" : "Generate 3 variants"}
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {loading && variants.length === 0 && (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="soft-surface p-4 space-y-2 animate-pulse">
                    <div className="h-3 w-24 rounded bg-[var(--color-surface-3)]" />
                    <div className="h-3 w-full rounded bg-[var(--color-surface-3)]" />
                    <div className="h-3 w-11/12 rounded bg-[var(--color-surface-3)]" />
                    <div className="h-3 w-2/3 rounded bg-[var(--color-surface-3)]" />
                  </div>
                ))}
              </>
            )}

            {!loading && variants.length === 0 && (
              <div className="soft-surface p-6 text-center">
                <Sparkles size={18} className="mx-auto text-[var(--color-accent-violet)]" />
                <p className="text-[13px] font-medium mt-2">No drafts yet</p>
                <p className="text-[12px] text-subtle mt-1">
                  Pick a tone and length, then hit Generate to see three options.
                </p>
              </div>
            )}

            {variants.map((v, i) => (
              <div
                key={v.id}
                className="soft-surface p-4 hover:border-[var(--color-border-strong)] transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-subtle">Variant {i + 1}</span>
                    <Chip tone="info">{tones.find((t) => t.id === v.tone)?.label}</Chip>
                    <span className="text-[11px] text-subtle tabular-nums">{v.text.length} chars</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copy(v)}
                      className="btn btn-icon btn-sm btn-ghost tip"
                      data-tip={copiedId === v.id ? "Copied" : "Copy"}
                      aria-label="Copy draft"
                    >
                      {copiedId === v.id ? (
                        <Check size={13} className="text-[var(--color-success-text)]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed text-[var(--color-text)]">{v.text}</p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onInsert(v.text);
                      onClose();
                    }}
                    className="btn btn-soft btn-sm"
                  >
                    <Check size={13} /> Use this draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[11.5px] text-subtle">
            Drafts are suggestions — review before publishing.
          </p>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
