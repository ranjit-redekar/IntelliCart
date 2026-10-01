import { useSyncExternalStore } from "react";
import { api } from "../../lib/api";
import { reportWrite } from "../../lib/toast";
import type { HeroSlide } from "../types";

/** Hero slides, served by the API. Same story as promotionsStore. */
let cache: HeroSlide[] = [];
let loaded = false;
const subscribers = new Set<() => void>();

const emit = () => subscribers.forEach((fn) => fn());
const byOrder = (a: HeroSlide, b: HeroSlide) => a.order - b.order;

async function refresh() {
  try {
    const r = await api.get<{ items: HeroSlide[] }>("/admin/slides");
    cache = [...r.items].sort(byOrder);
  } catch {
    /* keep the last good list */
  } finally {
    loaded = true;
    emit();
  }
}

export const slidesStore = {
  getAll: () => cache,
  get: (id: string) => cache.find((s) => s.id === id),

  async add(slide: HeroSlide) {
    cache = [...cache, slide].sort(byOrder);
    emit();
    await reportWrite(api.post("/admin/slides", slide), "Created");
    await refresh();
  },

  async update(id: string, patch: Partial<HeroSlide>) {
    cache = cache.map((s) => (s.id === id ? { ...s, ...patch } : s)).sort(byOrder);
    emit();
    const ok = await reportWrite(api.put(`/admin/slides/${id}`, patch), "Saved");
    await refresh();
    return ok;
  },

  async toggle(id: string, active: boolean) {
    await slidesStore.update(id, { status: active ? "active" : "draft" });
  },

  async remove(id: string) {
    cache = cache.filter((s) => s.id !== id);
    emit();
    await reportWrite(api.del(`/admin/slides/${id}`), "Deleted");
    await refresh();
  },

  /** The server swaps and renumbers 1..n so `order` never goes sparse. */
  async move(id: string, direction: "up" | "down") {
    await reportWrite(api.post(`/admin/slides/${id}/move`, { direction }), "Order updated");
    await refresh();
  },

  async reset() {
    await refresh();
  },

  subscribe(fn: () => void) {
    subscribers.add(fn);
    if (!loaded) void refresh();
    return () => subscribers.delete(fn);
  },
};

export function useSlides(): HeroSlide[] {
  return useSyncExternalStore(slidesStore.subscribe, slidesStore.getAll, () => cache);
}
