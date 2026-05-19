import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  Check,
  Flag,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
} from "lucide-react";
import { customers, feedback, products } from "../mockdata";
import type { FeedbackStatus } from "../types";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import NotFoundPage from "./NotFoundPage";
import { cn } from "../lib/cn";

const statusTone: Record<FeedbackStatus, "info" | "success" | "danger" | "neutral"> = {
  new: "info",
  replied: "success",
  flagged: "danger",
  archived: "neutral",
};

const sentimentTone: Record<string, "success" | "neutral" | "danger"> = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
};

function Stars({ value, size = 16 }: { value: number; size?: number }) {
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

const replyTemplates: { id: string; label: string; body: (name: string) => string }[] = [
  {
    id: "thanks",
    label: "Thank them",
    body: (name) =>
      `${name} — thank you so much for taking the time to share this. We genuinely appreciate it.`,
  },
  {
    id: "apology",
    label: "Apologize + fix",
    body: (name) =>
      `${name} — we're really sorry to hear this. A member of our support team will reach out within 24 hours to make it right.`,
  },
  {
    id: "feature",
    label: "Pass to team",
    body: (name) =>
      `${name} — great feedback. I've passed this on to the product team and they're already discussing it for the next iteration.`,
  },
];

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = useMemo(() => feedback.find((f) => f.id === id), [id]);
  const [draft, setDraft] = useState(item?.reply ?? "");
  const [status, setStatus] = useState<FeedbackStatus>(item?.status ?? "new");

  if (!item) return <NotFoundPage />;

  const product = products.find((p) => p.id === item.productId);
  const customer = customers.find((c) => c.id === item.customerId);

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <Link
          to="/feedback"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to feedback
        </Link>
      </div>

      <PageHeader
        eyebrow={`Review · ${item.id}`}
        title={
          <span className="inline-flex items-center gap-3">
            <span>{item.title}</span>
            <Chip tone={statusTone[status]} className="capitalize">
              {status}
            </Chip>
          </span>
        }
        description={
          <span className="inline-flex items-center gap-3 flex-wrap">
            <Stars value={item.rating} size={14} />
            <span className="text-muted tabular-nums">{item.createdAt}</span>
            <Chip tone={sentimentTone[item.sentiment]} className="capitalize">
              {item.sentiment}
            </Chip>
            <span className="inline-flex items-center gap-1 text-muted">
              <ThumbsUp size={12} /> {item.helpfulVotes} helpful
            </span>
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setStatus(status === "flagged" ? "new" : "flagged")}
              className={cn("btn btn-ghost btn-sm", status === "flagged" && "text-[var(--color-accent-rose)]")}
            >
              <Flag size={14} /> {status === "flagged" ? "Unflag" : "Flag"}
            </button>
            <button
              type="button"
              onClick={() => setStatus("archived")}
              className="btn btn-ghost btn-sm"
            >
              <Archive size={14} /> Archive
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 fade-up-stagger">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader eyebrow="Review" title="What the customer wrote" />
            <p className="text-[14px] leading-relaxed text-[var(--color-text)]">{item.body}</p>
            <div className="mt-4 flex items-center gap-3 text-[12px] text-subtle">
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp size={12} /> {item.helpfulVotes} customers found this helpful
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Response"
              title={item.reply ? "Reply sent" : "Draft a reply"}
              subtitle={
                item.reply
                  ? `Sent ${item.repliedAt} · Edit and resend if needed`
                  : "Your reply will appear publicly under this review"
              }
              action={<MessageSquare size={14} className="text-subtle" />}
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {replyTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDraft(t.body(item.customerName))}
                  className="text-[11.5px] font-medium rounded-full border border-[var(--color-border)] px-2.5 py-1 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDraft(
                    `${item.customerName} — thanks for the thoughtful review. ${
                      item.sentiment === "negative"
                        ? "We're sorry it didn't meet expectations and would love to make this right — a member of our team will follow up directly."
                        : item.sentiment === "neutral"
                        ? "We hear you on the rough edges and are working on improvements. Really appreciate the detail."
                        : "We're so glad it's working out for you."
                    }`
                  )
                }
                className="text-[11.5px] font-medium rounded-full border border-[var(--color-accent-violet)] text-[var(--color-accent-violet)] px-2.5 py-1 hover:bg-[color-mix(in_oklab,var(--color-accent-violet)_10%,transparent)] transition-colors inline-flex items-center gap-1"
              >
                <Sparkles size={11} /> AI draft
              </button>
            </div>
            <textarea
              rows={5}
              className="input resize-none"
              placeholder={`Reply to ${item.customerName}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-subtle">{draft.length} characters</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft("")}
                  className="btn btn-ghost btn-sm"
                  disabled={!draft.trim()}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("replied")}
                  className={cn(
                    "btn btn-primary btn-sm",
                    (!draft.trim() || status === "replied") && "opacity-60 cursor-not-allowed"
                  )}
                  disabled={!draft.trim() || status === "replied"}
                >
                  {status === "replied" ? (
                    <>
                      <Check size={13} /> Reply sent
                    </>
                  ) : (
                    <>
                      <Send size={13} /> {item.reply ? "Resend reply" : "Send reply"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 min-w-0">
          <Card>
            <CardHeader eyebrow="Customer" title="Reviewer" />
            <div className="flex items-center gap-3">
              <Avatar name={item.customerName} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold truncate">{item.customerName}</p>
                {customer ? (
                  <p className="text-[12px] text-subtle truncate">{customer.email}</p>
                ) : (
                  <p className="text-[12px] text-subtle">Guest reviewer</p>
                )}
              </div>
            </div>
            {customer && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">Lifetime orders</span>
                  <span className="font-semibold tabular-nums">{customer.orders}</span>
                </div>
                <Link
                  to={`/customers/${customer.id}`}
                  className="btn btn-soft btn-sm w-full justify-center"
                >
                  View customer
                </Link>
                <a
                  href={`mailto:${customer.email}`}
                  className="btn btn-ghost btn-sm w-full justify-center"
                >
                  <Mail size={13} /> Email directly
                </a>
              </div>
            )}
          </Card>

          {product && (
            <Card>
              <CardHeader eyebrow="Product" title="Reviewed item" />
              <div className="space-y-2">
                <p className="text-[14px] font-semibold">{product.name}</p>
                <p className="text-[12px] text-subtle tabular-nums">
                  {product.id} · ${product.price} · {product.rating}★ overall
                </p>
                <Link
                  to={`/products/${product.id}`}
                  className="btn btn-soft btn-sm w-full justify-center mt-2"
                >
                  View product
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              eyebrow="AI"
              title="Suggested action"
              action={<Sparkles size={14} className="text-[var(--color-accent-violet)]" />}
            />
            <p className="text-[13px] text-muted leading-relaxed">
              {item.sentiment === "negative"
                ? "Prioritize a personal reply within 24 hours. Customers in this rating band churn 3.1× more often when their first review goes unanswered."
                : item.sentiment === "neutral"
                ? "A specific, non-generic reply tends to convert neutral reviewers into repeat buyers — reference what they liked and what they flagged."
                : "A brief thank-you tends to be enough. Consider asking for a photo or testimonial — these convert at 18% in your VIP cohort."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
