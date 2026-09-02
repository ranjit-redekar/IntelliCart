import { toCents } from "./money.js";

/**
 * THE pricing function. Not one of several.
 *
 * The frontend currently computes money in three mutually inconsistent places:
 *   shop/pages/CheckoutPage.tsx   free shipping over $50, else $8,  8% tax
 *   admin/lib/orderDetails.ts     free shipping over $200, else $12, 8% tax
 *   admin/settings/ShippingTax    rupee zones with 5/12/18% GST
 *
 * A client that computes a total is a client that can be argued with. The
 * server decides, the client displays.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = toCents(50);
export const FLAT_SHIPPING_CENTS = toCents(8);
export const TAX_RATE = 0.08;

export interface PriceableLine {
  productId: string;
  qty: number;
  unitPriceCents: number;
}

export interface Totals {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export function priceCart(lines: readonly PriceableLine[]): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0);
  const shippingCents =
    subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  // Tax applies to goods, not shipping.
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  };
}
