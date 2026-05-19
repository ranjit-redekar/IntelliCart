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
  /** Show numbered page buttons when there are 8 or fewer pages. */
  showNumbers?: boolean;
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
  showNumbers = true,
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
        "flex items-center justify-between gap-3 px-4 py-2.5 text-[12px]",
        className
      )}
    >
      <div className="flex items-center gap-3 text-muted min-w-0">
        <span className="whitespace-nowrap">
          <span className="font-semibold text-[var(--color-text)] tabular-nums">{from}–{to}</span>{" "}
          of <span className="font-semibold text-[var(--color-text)] tabular-nums">{total}</span>
        </span>
        {onPageSizeChange && (
          <label className="hidden sm:inline-flex items-center gap-1.5 text-subtle">
            <span>·</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent border-0 outline-none text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--color-brand-400)] rounded px-1"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className={cn(
            "w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors",
            safePage <= 1 && "opacity-30 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <ChevronLeft size={13} />
        </button>

        {showNumbers && totalPages <= 8 ? (
          pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="px-1 text-[11.5px] text-subtle select-none"
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
                  "min-w-[26px] h-7 px-1.5 rounded-md text-[12px] font-semibold tabular-nums transition-colors",
                  p === safePage
                    ? "bg-[var(--color-text)] text-[var(--color-surface)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                {p}
              </button>
            )
          )
        ) : (
          <span className="px-2 text-[12px] tabular-nums text-muted">
            Page <span className="font-semibold text-[var(--color-text)]">{safePage}</span> of{" "}
            <span className="font-semibold text-[var(--color-text)]">{totalPages}</span>
          </span>
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className={cn(
            "w-7 h-7 inline-flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors",
            safePage >= totalPages && "opacity-30 cursor-not-allowed hover:bg-transparent"
          )}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
