import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Filter,
  Flag,
  MessageSquare,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { feedback } from "../mockdata";
import type { FeedbackStatus } from "../types";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import { Pagination } from "../components/ui/Pagination";
import { cn } from "../lib/cn";

const statusFilters: { id: FeedbackStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "replied", label: "Replied" },
  { id: "flagged", label: "Flagged" },
  { id: "archived", label: "Archived" },
];

const ratingFilters: { id: "all" | "positive" | "neutral" | "negative"; label: string }[] = [
  { id: "all", label: "All ratings" },
  { id: "positive", label: "4–5★" },
  { id: "neutral", label: "3★" },
  { id: "negative", label: "1–2★" },
];

const statusTone: Record<FeedbackStatus, "info" | "success" | "danger" | "neutral"> = {
  new: "info",
  replied: "success",
  flagged: "danger",
  archived: "neutral",
};

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= value
              ? "fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]"
              : "text-[var(--color-surface-3)]"
          )}
        />
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return feedback.filter((f) => {
      const matchesStatus = statusFilter === "all" || f.status === statusFilter;
      const matchesRating =
        ratingFilter === "all" ||
        (ratingFilter === "positive" && f.rating >= 4) ||
        (ratingFilter === "neutral" && f.rating === 3) ||
        (ratingFilter === "negative" && f.rating <= 2);
      const matchesQ =
        !query ||
        f.title.toLowerCase().includes(query.toLowerCase()) ||
        f.body.toLowerCase().includes(query.toLowerCase()) ||
        f.customerName.toLowerCase().includes(query.toLowerCase()) ||
        f.productName.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesRating && matchesQ;
    });
  }, [statusFilter, ratingFilter, query]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, ratingFilter, query, pageSize]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const total = feedback.length;
  const avgRating = (feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1);
  const awaiting = feedback.filter((f) => f.status === "new" || f.status === "flagged").length;
  const responseRate = Math.round(
    (feedback.filter((f) => f.status === "replied").length / total) * 100
  );
  const flagged = feedback.filter((f) => f.status === "flagged").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Voice of customer"
        title="Customer feedback"
        description={`${total} reviews across the catalog · ${awaiting} awaiting reply`}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm">
              <Filter size={14} /> Export
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Sparkles size={14} /> Summarize with AI
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up-stagger">
        <Card interactive>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
              style={{
                background: "color-mix(in oklab, var(--color-brand-500) 14%, transparent)",
                color: "var(--color-brand-600)",
              }}
            >
              <MessageSquare size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] text-muted">Reviews</p>
              <p className="text-[22px] font-semibold tabular-nums">{total}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Average rating</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-[22px] font-semibold tabular-nums">{avgRating}</p>
            <span className="mb-1">
              <Stars value={Math.round(Number(avgRating))} size={12} />
            </span>
          </div>
          <p className="text-[12px] text-subtle mt-1">Across all products</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Awaiting reply</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{awaiting}</p>
          {flagged > 0 && (
            <p className="text-[12px] text-[var(--color-accent-rose)] mt-1 inline-flex items-center gap-1">
              <Flag size={11} /> {flagged} flagged
            </p>
          )}
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Response rate</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{responseRate}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent-mint)]"
              style={{ width: `${responseRate}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 fade-up">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            className="input pl-9 h-10"
            placeholder="Search reviews, customers, products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1">
          {statusFilters.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              className={cn(
                "px-3 h-9 rounded-[10px] text-[13px] font-medium border whitespace-nowrap transition-colors",
                statusFilter === s.id
                  ? "bg-[var(--color-text)] text-[var(--color-surface)] border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap fade-up">
        {ratingFilters.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRatingFilter(r.id)}
            className={cn(
              "px-2.5 h-7 rounded-full text-[12px] font-medium border transition-colors",
              ratingFilter === r.id
                ? "border-[var(--color-brand-400)] bg-[color-mix(in_oklab,var(--color-brand-500)_10%,transparent)] text-[var(--color-brand-700)] dark:text-[var(--color-brand-200)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Card padded={false} className="overflow-hidden fade-up">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No feedback matches those filters.</p>
          </div>
        ) : (
          <ul>
            {paginated.map((f) => (
              <li
                key={f.id}
                onClick={() => navigate(`/feedback/${f.id}`)}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              >
                <div className="p-5 flex items-start gap-4">
                  <Avatar name={f.customerName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        to={`/feedback/${f.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[14px] font-semibold tracking-tight hover:text-[var(--color-brand-600)] truncate"
                      >
                        {f.title}
                      </Link>
                      <Stars value={f.rating} />
                      <Chip tone={statusTone[f.status]} className="capitalize">
                        {f.status}
                      </Chip>
                    </div>
                    <p className="text-[12.5px] text-subtle mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[var(--color-text-muted)]">{f.customerName}</span>
                      <span aria-hidden>·</span>
                      <Link
                        to={`/products/${f.productId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[var(--color-text)]"
                      >
                        {f.productName}
                      </Link>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{f.createdAt}</span>
                    </p>
                    <p className="text-[13px] text-[var(--color-text-muted)] mt-2 line-clamp-2 leading-relaxed">
                      {f.body}
                    </p>
                    {f.reply && (
                      <div className="mt-3 soft-surface p-3 text-[12.5px]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-mint)] mb-1">
                          Your reply
                        </p>
                        <p className="text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">{f.reply}</p>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/feedback/${f.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-icon btn-sm btn-ghost self-center"
                    aria-label="View feedback"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
