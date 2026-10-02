import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Send, Sparkles, Star, Trash2, X } from "lucide-react";
import { generateAssistantReply, type AssistantReply, type ChatTurn } from "../lib/ai";
import { cn } from "../lib/cn";

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

interface Message {
  id: string;
  role: "assistant" | "user";
  text?: string;
  reply?: AssistantReply;
}

const seed: Message = {
  id: "intro",
  role: "assistant",
  reply: {
    text: "Hi — I'm IntelliCart's shopping assistant. Ask me to find products, summarize reviews, or compare picks.",
    products: [],
    followups: [
      "Find me a gift under $100",
      "Show me top-rated home goods",
      "What's on sale right now?",
    ],
  },
};

// Chat survives navigation and reloads within the tab.
const STORAGE_KEY = "ai-assistant";
const MAX_MESSAGES = 30;

function loadStored(): { messages: Message[] } | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed || !Array.isArray(parsed.messages) || !parsed.messages.length) return null;
    return { messages: parsed.messages };
  } catch {
    return null; // corrupt or blocked storage: start fresh
  }
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadStored()?.messages ?? [seed]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: messages.slice(-MAX_MESSAGES) }),
      );
    } catch {
      // storage full or blocked — chat still works, just not persisted
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    // Last few real turns as context; the greeting and failed replies are not conversation.
    const history: ChatTurn[] = messages
      .filter((m) => m.id !== seed.id && !m.reply?.failed)
      .flatMap((m) => {
        const t = m.role === "user" ? m.text : m.reply?.text;
        return t ? [{ role: m.role, text: t.slice(0, 500) }] : [];
      })
      .slice(-6);
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: clean };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setThinking(true);
    // No artificial delay any more — this is a real round trip.
    const reply = await generateAssistantReply(clean, history);
    setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", reply }]);
    setThinking(false);
  }

  function reset() {
    setMessages([seed]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI shopping assistant"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full text-white shadow-[var(--shadow-pop)] flex items-center justify-center hover:scale-105 transition-transform"
        style={{
          background:
            "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
        }}
      >
        <Sparkles size={22} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-assist-title"
        >
          <button
            type="button"
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <aside
            className="relative ml-auto w-full sm:w-[420px] max-w-full h-full card-surface flex flex-col shadow-[var(--shadow-pop)] fade-up"
            style={{ borderRadius: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
                  }}
                >
                  <Sparkles size={16} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                    IntelliCart AI
                  </p>
                  <h2 id="ai-assist-title" className="text-[15px] font-semibold tracking-tight">
                    Shopping assistant
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Clear chat"
                  title="Clear chat"
                  className="btn btn-icon btn-sm btn-ghost"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="btn btn-icon btn-sm btn-ghost"
                >
                  <X size={15} />
                </button>
              </div>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onFollowup={send} />
              ))}
              {thinking && (
                <div className="flex items-center gap-2 text-[12.5px] text-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] animate-pulse" style={{ animationDelay: "120ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] animate-pulse" style={{ animationDelay: "240ms" }} />
                  <span>Thinking</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="border-t border-[var(--color-border)] p-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask anything…"
                className="input h-10 flex-1"
                autoFocus
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim() || thinking}
                className={cn(
                  "btn btn-primary btn-sm",
                  (!draft.trim() || thinking) && "opacity-60 cursor-not-allowed"
                )}
              >
                <Send size={13} />
              </button>
            </form>
            <p className="text-[11px] text-subtle text-center pb-3 px-5">
              IntelliCart AI · responses are demo-generated from the catalog.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}

function MessageBubble({
  message,
  onFollowup,
}: {
  message: Message;
  onFollowup: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] px-3.5 py-2 rounded-[16px] rounded-br-[6px] text-[13.5px] leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  const reply = message.reply;
  if (!reply) return null;
  return (
    <div className="space-y-2">
      <div className="max-w-[88%] soft-surface px-3.5 py-2.5 rounded-[16px] rounded-bl-[6px] text-[13.5px] leading-relaxed">
        {reply.text}
      </div>
      {reply.products.length > 0 && (
        <div className="space-y-2 pl-1">
          {reply.products.map((p) => {
            const accent = categoryAccent[p.categoryId] ?? "var(--color-brand-500)";
            const initials = p.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="flex items-center gap-3 p-2.5 rounded-[12px] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <span
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[13px] font-bold shrink-0 overflow-hidden"
                  style={{
                    background: `color-mix(in oklab, ${accent} 18%, var(--color-surface-2))`,
                    color: accent,
                  }}
                >
                  {p.image ? (
                    <img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{p.name}</p>
                  <p className="text-[11.5px] text-subtle inline-flex items-center gap-1">
                    <Star size={10} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
                    <span className="tabular-nums">{p.rating}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">${p.price}</span>
                  </p>
                </div>
                <ArrowRight size={14} className="text-subtle" />
              </Link>
            );
          })}
        </div>
      )}
      {reply.followups.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {reply.followups.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFollowup(f)}
              className="text-[11.5px] font-medium rounded-full border border-[var(--color-border)] px-2.5 py-1 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

