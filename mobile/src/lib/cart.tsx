import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { products } from "../mockdata";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface CartLineExpanded extends CartLine {
  name: string;
  price: number;
  category: string;
  categoryId: string;
  lineTotal: number;
}

interface CartCtx {
  lines: CartLine[];
  expanded: CartLineExpanded[];
  count: number;
  subtotal: number;
  add: (productId: string, qty?: number) => void;
  update: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartCtx>(() => {
    const expanded: CartLineExpanded[] = lines.flatMap((line) => {
      const p = products.find((x) => x.id === line.productId);
      if (!p) return [];
      return [
        {
          ...line,
          name: p.name,
          price: p.price,
          category: p.category,
          categoryId: p.categoryId,
          lineTotal: p.price * line.qty,
        },
      ];
    });
    const count = expanded.reduce((s, l) => s + l.qty, 0);
    const subtotal = expanded.reduce((s, l) => s + l.lineTotal, 0);
    return {
      lines,
      expanded,
      count,
      subtotal,
      add(productId, qty = 1) {
        setLines((curr) => {
          const idx = curr.findIndex((l) => l.productId === productId);
          if (idx >= 0) {
            const next = [...curr];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [...curr, { productId, qty }];
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
