import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../../lib/api";
import { useSession } from "./session";
import type { Product } from "../types";

interface WishlistCtx {
  ids: string[];
  items: Product[];
  loading: boolean;
  has: (productId: string) => boolean;
  /** Resolves to the new saved state, or null if the visitor must sign in. */
  toggle: (productId: string) => Promise<boolean | null>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WishlistCtx | null>(null);

/**
 * The wishlist belongs to the account, not the browser.
 *
 * It used to be a bare localStorage array: it survived sign-out and two people
 * sharing a laptop shared a wishlist. Now it is empty until you sign in, and
 * follows you to another device.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useSession();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const r = await api.get<{ items: Product[] }>("/account/wishlist");
      setItems(r.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const toggle = useCallback(
    async (productId: string): Promise<boolean | null> => {
      if (!user) return null;
      const saved = !ids.includes(productId);
      // Optimistic: the heart should not lag behind the click.
      setItems((curr) =>
        saved ? [...curr, { id: productId } as Product] : curr.filter((p) => p.id !== productId),
      );
      try {
        if (saved) await api.put(`/account/wishlist/${productId}`);
        else await api.del(`/account/wishlist/${productId}`);
        await refresh();
        return saved;
      } catch {
        await refresh();
        return !saved;
      }
    },
    [user, ids, refresh],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!user) return;
      setItems((curr) => curr.filter((p) => p.id !== productId));
      await api.del(`/account/wishlist/${productId}`).catch(() => {});
      await refresh();
    },
    [user, refresh],
  );

  const value = useMemo<WishlistCtx>(
    () => ({ ids, items, loading, has: (id) => ids.includes(id), toggle, remove, refresh }),
    [ids, items, loading, toggle, remove, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
