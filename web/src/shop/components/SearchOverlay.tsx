import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api, qs } from "../../lib/api";
import type { Product } from "../types";

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [results, setResults] = useState<Product[]>([]);

  // Debounced, and stale responses are dropped — typing fast must not leave
  // results for an earlier query on screen.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let live = true;
    const t = window.setTimeout(() => {
      api
        .get<{ items: Product[] }>(`/products${qs({ q, pageSize: 6 })}`)
        .then((r) => live && setResults(r.items))
        .catch(() => live && setResults([]));
    }, 180);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [query]);

  // Derived, not stored: an empty box shows nothing without a state write.
  const matches = query.trim() ? results : [];

  function go(to: string) {
    onClose();
    navigate(to);
  }

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Search products">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_55%,transparent)] backdrop-blur-sm"
      />
      <div className="relative max-w-[640px] mx-auto mt-[12vh] px-4 fade-up">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) go(`/shop?q=${encodeURIComponent(query.trim())}`);
          }}
          className="relative"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="input h-12 pl-11 pr-11 text-[14.5px] shadow-[var(--shadow-pop)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-icon btn-sm btn-ghost"
          >
            <X size={14} />
          </button>
        </form>

        {query.trim() && (
          <div className="mt-2 card-surface overflow-hidden shadow-[var(--shadow-pop)]">
            {matches.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted text-center">
                Nothing matches “{query.trim()}”.
              </p>
            ) : (
              <ul>
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => go(`/products/${p.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <img src={p.image} alt="" className="w-10 h-10 rounded-[9px] object-cover shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold truncate">{p.name}</span>
                        <span className="block text-[11.5px] text-subtle">{p.category}</span>
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums">${p.price}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => go(`/shop?q=${encodeURIComponent(query.trim())}`)}
              className="w-full border-t border-[var(--color-border)] px-4 py-2.5 text-[12.5px] font-semibold text-[var(--color-brand-600)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              See all results in Shop →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
