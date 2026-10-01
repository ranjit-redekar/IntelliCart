import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import { cn } from "../lib/cn";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from: Date;
  to: Date;
}

interface Props {
  value: DateRange;
  onChange: (next: DateRange) => void;
  className?: string;
}

// Anchor for relative ranges. Aligns with the mock data window so demos look right.
// Swap with `new Date()` when wiring to a real backend.
const ANCHOR_TODAY = new Date("2026-05-19T12:00:00");

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function fromISO(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

const presets: { id: Exclude<DateRangePreset, "custom">; label: string; hint?: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
];

export function getPresetRange(preset: Exclude<DateRangePreset, "custom">): DateRange {
  const today = ANCHOR_TODAY;
  switch (preset) {
    case "today":
      return { preset, from: startOfDay(today), to: endOfDay(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { preset, from: startOfDay(y), to: endOfDay(y) };
    }
    case "last7": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { preset, from: startOfDay(start), to: endOfDay(today) };
    }
    case "last30": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { preset, from: startOfDay(start), to: endOfDay(today) };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { preset, from: startOfDay(start), to: endOfDay(today) };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { preset, from: startOfDay(start), to: endOfDay(end) };
    }
  }
}

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatShort(d: Date) {
  return `${monthShort[d.getMonth()]} ${d.getDate()}`;
}
function formatRange(range: DateRange) {
  if (range.preset === "today") return "Today";
  if (range.preset === "yesterday") return "Yesterday";
  const sameMonth = range.from.getMonth() === range.to.getMonth() && range.from.getFullYear() === range.to.getFullYear();
  if (sameMonth) {
    return `${monthShort[range.from.getMonth()]} ${range.from.getDate()} – ${range.to.getDate()}`;
  }
  return `${formatShort(range.from)} – ${formatShort(range.to)}`;
}
function presetLabel(preset: DateRangePreset) {
  if (preset === "custom") return "Custom";
  return presets.find((p) => p.id === preset)?.label ?? "";
}

export function DateRangePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(toISO(value.from));
  const [customTo, setCustomTo] = useState(toISO(value.to));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  // The popover is portaled to <body>, so move keyboard focus into it on open.
  useEffect(() => {
    if (open && popoverPos) popoverRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open, popoverPos]);

  // Position the popover under the trigger, right-aligned. Recompute on open + scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const t = triggerRef.current?.getBoundingClientRect();
      if (!t) return;
      const popoverWidth = 320;
      const gutter = 12;
      let left = t.right - popoverWidth;
      if (left < gutter) left = gutter;
      if (left + popoverWidth > window.innerWidth - gutter) {
        left = window.innerWidth - popoverWidth - gutter;
      }
      setPopoverPos({ top: t.bottom + 8, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    setCustomFrom(toISO(value.from));
    setCustomTo(toISO(value.to));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = useMemo(() => `${presetLabel(value.preset)} · ${formatRange(value)}`, [value]);

  function pickPreset(id: Exclude<DateRangePreset, "custom">) {
    onChange(getPresetRange(id));
    setOpen(false);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const from = startOfDay(fromISO(customFrom));
    const to = endOfDay(fromISO(customTo));
    if (from > to) return;
    onChange({ preset: "custom", from, to });
    setOpen(false);
  }

  const popover =
    open && popoverPos ? (
      <div
        ref={popoverRef}
        role="dialog"
        aria-label="Pick a date range"
        style={{
          position: "fixed",
          top: popoverPos.top,
          left: popoverPos.left,
          width: 320,
          zIndex: 60,
        }}
        className="card-surface rounded-[14px] shadow-[var(--shadow-pop)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Date range
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="btn btn-icon btn-sm btn-ghost"
          >
            <X size={13} />
          </button>
        </div>

        <ul className="p-1.5">
          {presets.map((p) => {
            const active = value.preset === p.id;
            const range = getPresetRange(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pickPreset(p.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[8px] text-left transition-colors",
                    active
                      ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  )}
                >
                  <span className="text-[13px] font-semibold">{p.label}</span>
                  <span className="text-[11.5px] text-subtle tabular-nums">
                    {formatRange(range)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Custom
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] text-subtle">From</span>
              <input
                type="date"
                className="input h-8 mt-1 text-[12.5px]"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-subtle">To</span>
              <input
                type="date"
                className="input h-8 mt-1 text-[12.5px]"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customFrom || !customTo || customFrom > customTo}
            className={cn(
              "btn btn-primary btn-sm w-full justify-center mt-1",
              (!customFrom || !customTo || customFrom > customTo) &&
                "opacity-60 cursor-not-allowed"
            )}
          >
            Apply custom range
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm gap-2 max-w-[260px]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar size={13} className="text-subtle shrink-0" />
        <span className="truncate text-[12.5px]">{label}</span>
        <ChevronDown
          size={12}
          className={cn(
            "text-subtle transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
