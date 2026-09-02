import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiError, type Page } from "./api";

interface State<T> {
  items: T[];
  total: number;
  page: number;
  loading: boolean;
  error: ApiError | undefined;
  exhausted: boolean;
}

type Action<T> =
  | { type: "reset" }
  | { type: "start" }
  | { type: "page"; page: Page<T> }
  | { type: "failure"; error: ApiError };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "reset":
      return { items: [], total: 0, page: 0, loading: true, error: undefined, exhausted: false };
    case "start":
      return { ...state, loading: true, error: undefined };
    case "page": {
      // Page 1 replaces; later pages append. Appending in the fetch callback
      // rather than in an effect keeps this out of the render cascade.
      const items = action.page.page === 1 ? action.page.items : [...state.items, ...action.page.items];
      return {
        items,
        total: action.page.total,
        page: action.page.page,
        loading: false,
        error: undefined,
        exhausted: items.length >= action.page.total || action.page.items.length === 0,
      };
    }
    case "failure":
      return { ...state, loading: false, error: action.error };
  }
}

/**
 * A paginated list with a "load more" button.
 *
 * `key` identifies the current filter set: when it changes the list resets to
 * page 1. Everything else appends.
 */
export function useInfinite<T>(load: (page: number) => Promise<Page<T>>, key: string) {
  const [state, dispatch] = useReducer(reducer<T>, {
    items: [],
    total: 0,
    page: 0,
    loading: true,
    error: undefined,
    exhausted: false,
  } as State<T>);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const latest = useRef(0);

  const fetchPage = useCallback((page: number) => {
    const ticket = ++latest.current;
    dispatch(page === 1 ? { type: "reset" } : { type: "start" });
    loadRef.current(page).then(
      (result) => {
        if (ticket !== latest.current) return;
        dispatch({ type: "page", page: result });
      },
      (err: unknown) => {
        if (ticket !== latest.current) return;
        dispatch({
          type: "failure",
          error: err instanceof ApiError ? err : new ApiError(0, "unknown", String(err)),
        });
      },
    );
  }, []);

  // A new filter set starts over.
  useEffect(() => {
    fetchPage(1);
  }, [key, fetchPage]);

  const loadMore = useCallback(() => {
    if (state.loading || state.exhausted) return;
    fetchPage(state.page + 1);
  }, [state.loading, state.exhausted, state.page, fetchPage]);

  const reload = useCallback(() => fetchPage(1), [fetchPage]);

  return { ...state, loadMore, reload };
}
