import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "intellicart_wishlist_v1";

interface WishlistCtx {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

const Ctx = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate once; anything saved before the read finishes wins.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const saved = JSON.parse(raw) as string[];
          setIds((curr) => (curr.length ? curr : saved));
        } catch {
          /* corrupt entry, ignore */
        }
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, ready]);

  const value = useMemo<WishlistCtx>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle(id) {
        setIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
      },
    }),
    [ids]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
