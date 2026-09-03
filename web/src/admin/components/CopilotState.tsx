import type { ApiError } from "../../lib/api";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";
import { Card } from "./ui/Card";

/**
 * Loading and error states for an AI Hub screen, plus a badge saying where the
 * content came from.
 *
 * The badge is not decoration: "computed" means the numbers were derived from
 * live rows a moment ago, "seeded" means they are demo content sitting in the
 * database. A dashboard that cannot tell you which is which invites people to
 * act on figures nobody generated.
 */
export function CopilotState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: ApiError | undefined;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (loading) return <Skeleton rows={4} />;
  return (
    <Card className="text-center py-10">
      <p className="text-[14px] font-semibold">Nothing generated yet</p>
      <p className="text-[12.5px] text-muted mt-1">
        This copilot has no content for your store yet.
      </p>
    </Card>
  );
}

CopilotState.Badge = function CopilotBadge({
  source,
  generatedAt,
}: {
  source: "computed" | "seed" | "model" | undefined;
  generatedAt: string | undefined;
}) {
  if (!source) return null;
  const computed = source === "computed" || source === "model";
  const when = generatedAt ? new Date(generatedAt).toLocaleString() : null;
  return (
    <p
      className="inline-flex items-center gap-2 text-[11.5px] font-medium rounded-full px-2.5 py-1 mb-4"
      style={{
        color: computed ? "var(--color-accent-mint)" : "var(--color-text-muted)",
        background: computed
          ? "color-mix(in oklab, var(--color-accent-mint) 12%, transparent)"
          : "var(--color-surface-2)",
      }}
      title={when ? `Generated ${when}` : undefined}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: computed ? "var(--color-accent-mint)" : "var(--color-text-subtle)" }}
        aria-hidden
      />
      {computed ? "Computed from your data" : "Seeded demo content"}
    </p>
  );
};
