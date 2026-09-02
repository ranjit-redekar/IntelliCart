import { Link } from "react-router-dom";
import { MessageSquare, Star } from "lucide-react";
import { api, qs, type Page } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import type { Feedback } from "../../../../shared/types";
import { Card } from "../components/ui/Card";
import { useSession } from "../lib/session";
import { cn } from "../lib/cn";

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

export default function AccountReviewsPage() {
  const { user } = useSession();
  const state = useApi(
    () => api.get<Page<Feedback>>(`/account/reviews${qs({ pageSize: 50 })}`),
    [user?.id],
  );

  if (!user) return null;
  const reviews = state.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
          Reviews
        </p>
        <h2 className="text-[18px] font-semibold tracking-tight">Your contributions</h2>
        <p className="text-[13px] text-muted mt-1">
          {reviews.length === 0
            ? "You haven't reviewed anything yet."
            : `${reviews.length} review${reviews.length === 1 ? "" : "s"} · thank you for the feedback.`}
        </p>
      </div>

      {state.error ? (

        <ErrorState error={state.error} onRetry={state.reload} />

      ) : state.loading && reviews.length === 0 ? (

        <Skeleton rows={3} />

      ) : reviews.length === 0 ? (
        <Card className="text-center py-12">
          <MessageSquare size={26} className="mx-auto text-subtle" />
          <p className="font-semibold text-[14px] mt-2">No reviews yet</p>
          <p className="text-[12.5px] text-muted mt-1">
            Once your orders arrive, you'll be invited to leave a review here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold">{r.title}</p>
                  <Link
                    to={`/products/${r.productId}`}
                    className="text-[12px] text-subtle hover:text-[var(--color-text)]"
                  >
                    {r.productName} · <span className="tabular-nums">{r.createdAt}</span>
                  </Link>
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="text-[13px] text-muted leading-relaxed mt-3">{r.body}</p>
              {r.reply && (
                <div className="mt-3 soft-surface p-3 text-[12.5px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-mint)] mb-1">
                    IntelliCart replied
                  </p>
                  <p className="text-muted leading-relaxed">{r.reply}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
