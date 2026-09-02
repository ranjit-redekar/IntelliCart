import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../../lib/api";

export interface CartLine {
  productId: string;
  qty: number;
}

/** Server-expanded line. Prices come from the server, never from the client. */
export interface CartLineExpanded extends CartLine {
  name: string;
  price: number;
  category: string;
  categoryId: string;
  image: string;
  stock: number;
  lineTotal: number;
}

interface CartResponse {
  items: CartLineExpanded[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface CartCtx extends CartResponse {
  lines: CartLine[];
  expanded: CartLineExpanded[];
  loading: boolean;
  error: string | null;
  add: (productId: string, qty?: number) => Promise<void>;
  update: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Fold the guest cart into the signed-in one. Called after sign-in. */
  merge: () => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY: CartResponse = { items: [], count: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };

const Ctx = createContext<CartCtx | null>(null);

/**
 * The cart lives on the server.
 *
 * A guest cart is a Redis hash keyed by a cookie; signing in merges it into the
 * customer's cart. That is what makes a cart survive a device change — and what
 * lets the server, not the browser, decide what things cost.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<CartResponse>) => {
    try {
      setError(null);
      setCart(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cart update failed");
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setCart(await api.get<CartResponse>("/cart"));
      setError(null);
    } catch {
      // An unreachable API leaves an empty cart rather than a broken page.
      setCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CartCtx>(
    () => ({
      ...cart,
      lines: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      expanded: cart.items,
      loading,
      error,
      add: (productId, qty = 1) =>
        run(() => api.post<CartResponse>("/cart/items", { productId, qty })),
      update: (productId, qty) =>
        run(() => api.patch<CartResponse>(`/cart/items/${productId}`, { qty })),
      remove: (productId) => run(() => api.del<CartResponse>(`/cart/items/${productId}`)),
      clear: () => run(() => api.del<CartResponse>("/cart")),
      merge: () => run(() => api.post<CartResponse>("/cart/merge")),
      refresh,
    }),
    [cart, loading, error, run, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
