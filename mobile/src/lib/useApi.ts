import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";

export interface AsyncState<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  /** True only during a pull-to-refresh, so the list keeps its content. */
  refreshing: boolean;
  reload: () => void;
  /** For RefreshControl: refetch and show the spinner until it lands. */
  refresh: () => void;
}

/**
 * Fetch on mount and whenever `deps` change. A superseded response is
 * dropped, so a quick filter change can't leave older results on screen.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let live = true;
    loadRef.current()
      .then((d) => live && (setData(d), setError(undefined)))
      .catch((e: unknown) =>
        live && setError(e instanceof ApiError ? e : new ApiError(0, "unknown", "Something went wrong.")),
      )
      .finally(() => live && (setLoading(false), setRefreshing(false)));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);
  const refresh = useCallback(() => {
    setRefreshing(true);
    setNonce((n) => n + 1);
  }, []);

  return { data, error, loading, refreshing, reload, refresh };
}
