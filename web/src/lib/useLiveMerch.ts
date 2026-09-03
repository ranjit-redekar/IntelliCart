import { useEffect } from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Subscribe to merchandising changes over SSE.
 *
 * When an admin publishes a promotion or reorders the hero, every open
 * storefront hears about it and refetches — including ones served by a
 * different API replica, because the fan-out goes through Redis pub/sub.
 */
export function useLiveMerch(onChange: () => void) {
  useEffect(() => {
    // Nothing to subscribe to without a server, and EventSource would retry
    // forever against a 404.
    if (import.meta.env.VITE_OFFLINE === "true") return;
    if (typeof EventSource === "undefined") return;
    let source: EventSource | undefined;
    try {
      source = new EventSource(`${BASE}/merch/stream`, { withCredentials: true });
    } catch {
      return; // live updates are a nicety; the page still works without them
    }
    const handler = () => onChange();
    source.addEventListener("merch", handler);
    // A dropped stream is not worth surfacing — EventSource reconnects itself.
    source.onerror = () => {};
    return () => {
      source?.removeEventListener("merch", handler);
      source?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
