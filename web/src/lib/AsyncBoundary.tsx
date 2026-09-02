import type { ReactNode } from "react";
import { ApiError } from "./api";

/**
 * Consistent loading / error / empty states.
 *
 * Every list and detail screen now has three states it never had while the
 * data was a bundled array. Doing it once keeps them from drifting.
 */
export function AsyncBoundary<T>({
  state,
  children,
  skeleton,
  empty,
  isEmpty,
}: {
  state: { data: T | undefined; error: ApiError | undefined; loading: boolean; reload: () => void };
  children: (data: T) => ReactNode;
  skeleton?: ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
}) {
  if (state.loading && state.data === undefined) {
    return <>{skeleton ?? <Skeleton />}</>;
  }
  if (state.error) {
    return <ErrorState error={state.error} onRetry={state.reload} />;
  }
  if (state.data === undefined) return null;
  if (empty && isEmpty?.(state.data)) return <>{empty}</>;
  return <>{children(state.data)}</>;
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg animate-pulse"
          style={{ background: "color-mix(in srgb, currentColor 8%, transparent)" }}
        />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const offline = error.status === 0;
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border p-6" style={{ borderColor: "var(--border, #ddd)" }}>
      <p className="text-sm font-semibold">
        {offline ? "Can't reach the server" : "That didn't work"}
      </p>
      <p className="text-sm opacity-70">{error.message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary text-sm">
          Try again
        </button>
      )}
    </div>
  );
}
