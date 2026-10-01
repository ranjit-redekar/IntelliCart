import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "../../../shared/types";

const KEY = "intellicart_cart_v2";

/** Snapshot of the product at add time, so the cart renders without the catalog. */
export interface CartLine {
  productId: string;
  qty: number;
  name: string;
  price: number;
  category: string;
  categoryId: string;
  image: string;
}

export interface CartLineExpanded extends CartLine {
  lineTotal: number;
}

interface CartCtx {
  lines: CartLine[];
  expanded: CartLineExpanded[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  update: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate once, merging with anything added before the read finished.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const saved = JSON.parse(raw) as CartLine[];
          setLines((curr) => [...curr, ...saved.filter((s) => !curr.some((c) => c.productId === s.productId))]);
        } catch {
          /* corrupt entry, ignore */
        }
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const value = useMemo<CartCtx>(() => {
    const expanded: CartLineExpanded[] = lines.map((line) => ({ ...line, lineTotal: line.price * line.qty }));
    const count = expanded.reduce((s, l) => s + l.qty, 0);
    const subtotal = expanded.reduce((s, l) => s + l.lineTotal, 0);
    return {
      lines,
      expanded,
      count,
      subtotal,
      add(p, qty = 1) {
        setLines((curr) => {
          const idx = curr.findIndex((l) => l.productId === p.id);
          if (idx >= 0) {
            const next = [...curr];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [
            ...curr,
            { productId: p.id, qty, name: p.name, price: p.price, category: p.category, categoryId: p.categoryId, image: p.image },
          ];
        });
      },
      update(productId, qty) {
        setLines((curr) =>
          qty <= 0
            ? curr.filter((l) => l.productId !== productId)
            : curr.map((l) => (l.productId === productId ? { ...l, qty } : l))
        );
      },
      remove(productId) {
        setLines((curr) => curr.filter((l) => l.productId !== productId));
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
