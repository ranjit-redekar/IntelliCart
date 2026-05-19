import { products } from "../mockdata";

export interface LineItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface DerivedOrder {
  items: LineItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  adjustment: number;
}

export function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function deriveLineItems(orderId: string, total: number): DerivedOrder {
  const seed = hashString(orderId);
  const count = (seed % 3) + 1;
  const items: LineItem[] = [];
  for (let i = 0; i < count; i++) {
    const p = products[(seed + i * 17) % products.length];
    const qty = ((seed >> (i + 1)) % 2) + 1;
    items.push({ sku: p.id, name: p.name, qty, unitPrice: p.price });
  }
  const shipping = total >= 200 ? 0 : 12;
  const tax = Math.round(total * 0.08);
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const adjustment = total - shipping - tax - subtotal;
  return { items, subtotal, shipping, tax, adjustment };
}
