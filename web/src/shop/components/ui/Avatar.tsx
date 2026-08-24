import { useMemo } from "react";
import { cn } from "../../lib/cn";

const palette = [
  ["#6366f1", "#8b5cf6"],
  ["#f43f5e", "#fb7185"],
  ["#10b981", "#22d3ee"],
  ["#f59e0b", "#f97316"],
  ["#0ea5e9", "#38bdf8"],
  ["#8b5cf6", "#ec4899"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const { initials, gradient } = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    const i = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
    const [a, b] = palette[hash(name) % palette.length];
    return { initials: i.toUpperCase() || "•", gradient: `linear-gradient(135deg, ${a}, ${b})` };
  }, [name]);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold tracking-tight select-none ring-2 ring-[var(--color-surface)] shrink-0",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.floor(size * 0.38)),
        background: gradient,
      }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
