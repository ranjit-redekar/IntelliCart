import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown, Plus, Tag as TagIcon, X } from "lucide-react";
import { cn } from "../lib/cn";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  allowCreate?: boolean;
}

export default function TagMultiSelect({
  value,
  onChange,
  suggestions,
  placeholder = "Search or create a tag…",
  allowCreate = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      suggestions
        .filter((s) => !selectedSet.has(s.toLowerCase()))
        .filter((s) => !q || s.toLowerCase().includes(q)),
    [suggestions, selectedSet, q]
  );

  const canCreate =
    allowCreate &&
    q.length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === q) &&
    !selectedSet.has(q);

  const items: { id: string; label: string; create?: boolean }[] = [
    ...filtered.map((s) => ({ id: s, label: s })),
    ...(canCreate ? [{ id: `__create__${q}`, label: query.trim(), create: true }] : []),
  ];

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [q, open]);

  function add(tag: string) {
    const clean = tag.trim();
    if (!clean) return;
    if (selectedSet.has(clean.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...value, clean]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (items.length === 0 ? 0 : (h + 1) % items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (items.length === 0 ? 0 : (h - 1 + items.length) % items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = items[highlight];
      if (target) add(target.label);
      else if (allowCreate && query.trim()) add(query);
    } else if (e.key === "," && allowCreate && query.trim()) {
      e.preventDefault();
      add(query);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          "min-h-10 input !p-1.5 !h-auto flex flex-wrap items-center gap-1.5 cursor-text",
          open && "border-[var(--color-brand-400)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-brand-500)_18%,transparent)]"
        )}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 pl-2 pr-1 h-7 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[12px] font-medium"
          >
            <TagIcon size={11} className="text-subtle" />
            {t}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(t);
              }}
              className="ml-0.5 w-5 h-5 rounded-full inline-flex items-center justify-center text-subtle hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)]"
              aria-label={`Remove ${t}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-[13px] px-1.5 h-7 placeholder:text-[var(--color-text-subtle)]"
          placeholder={value.length === 0 ? placeholder : ""}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={open}
          aria-controls="tag-listbox"
          role="combobox"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
            if (!open) inputRef.current?.focus();
          }}
          className="btn btn-icon btn-sm btn-ghost shrink-0"
          aria-label={open ? "Close suggestions" : "Open suggestions"}
        >
          <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div
          id="tag-listbox"
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto card-surface rounded-[12px] shadow-[var(--shadow-pop)] p-1"
        >
          {items.length === 0 ? (
            <p className="px-3 py-2 text-[12.5px] text-subtle">
              {suggestions.length === 0 ? "No suggestions available" : "No matches"}
            </p>
          ) : (
            items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={highlight === i}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => add(item.label)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-left text-[13px] transition-colors",
                  highlight === i
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                {item.create ? (
                  <>
                    <Plus size={13} className="text-[var(--color-accent-violet)]" />
                    <span>
                      Create <span className="font-semibold text-[var(--color-text)]">"{item.label}"</span>
                    </span>
                  </>
                ) : (
                  <>
                    <TagIcon size={12} className="text-subtle" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {highlight === i && <Check size={13} className="text-subtle" />}
                  </>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
