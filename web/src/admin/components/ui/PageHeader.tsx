import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 fade-up", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)] mb-1.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] leading-tight">{title}</h2>
        {description && (
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
