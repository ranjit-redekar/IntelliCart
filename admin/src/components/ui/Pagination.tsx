import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

function buildPages(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(totalPages - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 30, 50, 100, 500],
  className,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);
  const pages = buildPages(safePage, totalPages);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex items-center gap-3 text-[12.5px] text-muted">
        <span>
          Showing <span className="font-semibold text-[var(--color-text)] tabular-nums">{from}–{to}</span>{" "}
          of <span className="font-semibold text-[var(--color-text)] tabular-nums">{total}</span>
        </span>
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5">
            <span className="text-subtle">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="input h-7 !py-0 !px-2 text-[12.5px] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className={cn(
            "btn btn-icon btn-sm btn-ghost",
            safePage <= 1 && "opacity-40 cursor-not-allowed"
          )}
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-[12px] text-subtle select-none"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage ? "page" : undefined}
              className={cn(
                "min-w-[32px] h-8 px-2 rounded-[8px] text-[12.5px] font-semibold tabular-nums transition-colors",
                p === safePage
                  ? "bg-[var(--color-text)] text-[var(--color-surface)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className={cn(
            "btn btn-icon btn-sm btn-ghost",
            safePage >= totalPages && "opacity-40 cursor-not-allowed"
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
