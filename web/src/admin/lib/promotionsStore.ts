import { useSyncExternalStore } from "react";
import { api } from "../../lib/api";
import { reportWrite } from "../../lib/toast";
import type { Promotion } from "../types";

/**
 * Promotions, served by the API.
 *
 * This was a localStorage store, which is why admin edits were invisible to
 * the storefront — the shell imported `promotions` from the fixtures instead.
 * The module's shape is unchanged so the pages did not have to move; only
 * where the data comes from changed. Writes now reach shoppers, and the API
 * publishes on a Redis channel so open storefronts update without a reload.
 */
let cache: Promotion[] = [];
let loaded = false;
const subscribers = new Set<() => void>();

const emit = () => subscribers.forEach((fn) => fn());

async function refresh() {
  try {
    const r = await api.get<{ items: Promotion[] }>("/admin/promotions");
    cache = r.items;
  } catch {
    // Keep the last good list rather than blanking the screen on a blip.
  } finally {
    loaded = true;
    emit();
  }
}

export const promotionsStore = {
  getAll: () => cache,
  get: (id: string) => cache.find((p) => p.id === id),

  async add(promo: Promotion) {
    // Optimistic, so the row appears immediately; refresh reconciles ids.
    cache = [...cache, promo];
    emit();
    await reportWrite(api.post("/admin/promotions", promo), "Created");
    await refresh();
  },

  async update(id: string, patch: Partial<Promotion>) {
    cache = cache.map((p) => (p.id === id ? { ...p, ...patch } : p));
    emit();
    const ok = await reportWrite(api.put(`/admin/promotions/${id}`, patch), "Saved");
    await refresh();
    return ok;
  },

  async toggle(id: string, active: boolean) {
    await promotionsStore.update(id, { status: active ? "active" : "draft" });
  },

  async remove(id: string) {
    cache = cache.filter((p) => p.id !== id);
    emit();
    await reportWrite(api.del(`/admin/promotions/${id}`), "Deleted");
    await refresh();
  },

  /** Re-read from the server. There is no local copy to reset any more. */
  async reset() {
    await refresh();
  },

  subscribe(fn: () => void) {
    subscribers.add(fn);
    if (!loaded) void refresh();
    return () => subscribers.delete(fn);
  },
};

export function usePromotions(): Promotion[] {
  return useSyncExternalStore(promotionsStore.subscribe, promotionsStore.getAll, () => cache);
}
