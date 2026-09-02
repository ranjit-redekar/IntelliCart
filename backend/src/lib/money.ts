/**
 * Money is stored and computed in integer minor units (cents). It is
 * serialized to whole currency units on the way out, because the existing
 * `Product.price: number` contract in shared/types.ts is what both frontends
 * already consume.
 *
 * Currency is USD — the fixtures are in dollars. The settings screens describe
 * rupee zones and GST; reconciling those is a product decision, and when it is
 * made it changes only this file and pricing.ts.
 */
export const CURRENCY = "USD";

export const toCents = (units: number) => Math.round(units * 100);
export const toUnits = (cents: number) => cents / 100;

export const formatUnits = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY }).format(toUnits(cents));
