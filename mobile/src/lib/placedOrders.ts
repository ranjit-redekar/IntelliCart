import type { Order } from "../../../shared/types";

export interface PlacedItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

// ponytail: in-memory until mobile moves onto the API; lost on app restart.
export const placedOrders: Order[] = [];
export const placedItems = new Map<string, PlacedItem[]>();

export function recordOrder(customerName: string, total: number, items: PlacedItem[]) {
  const id = `ORD-${Date.now().toString().slice(-6)}`;
  placedOrders.unshift({
    id,
    customerName,
    total,
    status: "pending",
    placedAt: new Date().toISOString().slice(0, 10),
  });
  placedItems.set(id, items);
  return id;
}
