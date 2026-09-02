import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiError } from "./api";

export interface AsyncState<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  reload: () => void;
}

interface State<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  nonce: number;
}

type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "failure"; error: ApiError }
  | { type: "reload" };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "start":
      // Keep the previous data visible while refetching, so a filter change
      // does not blank the screen.
      return { ...state, loading: true, error: undefined };
    case "success":
      return { ...state, data: action.data, loading: false, error: undefined };
    case "failure":
      return { ...state, error: action.error, loading: false };
    case "reload":
      return { ...state, nonce: state.nonce + 1 };
  }
}

/**
 * Fetch-on-mount with loading and error state.
 *
 * `deps` controls refetching, the same way useEffect does. A superseded
 * response is discarded, so changing a filter quickly cannot leave the older
 * result on screen.
 *
 * One reducer rather than four useState calls: the whole transition is a
 * single dispatch, which keeps the effect from firing a cascade of renders.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: undefined,
    error: undefined,
    loading: true,
    nonce: 0,
  } as State<T>);

  // The loader closes over props and changes every render; keeping it in a ref
  // means `deps` alone decides when to refetch. Assigned inside an effect,
  // never during render.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
    let cancelled = false;
    dispatch({ type: "start" });
    loadRef.current().then(
      (result) => {
        if (cancelled || ticket !== latest.current) return;
        dispatch({ type: "success", data: result });
      },
      (err: unknown) => {
        if (cancelled || ticket !== latest.current) return;
        dispatch({
          type: "failure",
          error: err instanceof ApiError ? err : new ApiError(0, "unknown", String(err)),
        });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, state.nonce]);

  const reload = useCallback(() => dispatch({ type: "reload" }), []);

  return { data: state.data, error: state.error, loading: state.loading, reload };
}
