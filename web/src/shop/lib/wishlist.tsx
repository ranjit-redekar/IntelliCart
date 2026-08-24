import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "cw_wishlist_v1";

interface WishlistCtx {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => boolean;
  remove: (productId: string) => void;
}

const Ctx = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback((productId: string) => {
    let saved = false;
    setIds((curr) => {
      saved = !curr.includes(productId);
      return saved ? [...curr, productId] : curr.filter((x) => x !== productId);
    });
    return !ids.includes(productId);
  }, [ids]);

  const value = useMemo<WishlistCtx>(
    () => ({
      ids,
      has: (productId) => ids.includes(productId),
      toggle,
      remove: (productId) => setIds((curr) => curr.filter((x) => x !== productId)),
    }),
    [ids, toggle]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
