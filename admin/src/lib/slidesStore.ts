import { useSyncExternalStore } from "react";
import { heroSlides as seed } from "../mockdata";
import type { HeroSlide } from "../types";

const STORAGE_KEY = "intellicart_slides_v1";

// NOTE — production swap point:
// Replace `load`/`persist` with fetch() against /api/slides so admin,
// customer-web, and mobile all read from the same source. The store's
// public surface (getAll, subscribe, toggle, update, add, remove, move)
// is what each app reuses; only the transport changes.

type Listener = () => void;

function load(): HeroSlide[] {
  if (typeof window === "undefined") return [...seed].sort((a, b) => a.order - b.order);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [...seed].sort((a, b) => a.order - b.order);
  try {
    return (JSON.parse(raw) as HeroSlide[]).sort((a, b) => a.order - b.order);
  } catch {
    return [...seed].sort((a, b) => a.order - b.order);
  }
}

let state: HeroSlide[] = load();
const listeners = new Set<Listener>();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function reindex(list: HeroSlide[]): HeroSlide[] {
  return list.map((s, i) => ({ ...s, order: i + 1 }));
}

export const slidesStore = {
  getAll(): HeroSlide[] {
    return state;
  },
  get(id: string): HeroSlide | undefined {
    return state.find((s) => s.id === id);
  },
  toggle(id: string, active: boolean) {
    state = state.map((s) =>
      s.id === id ? { ...s, status: active ? "active" : "draft" } : s
    );
    persist();
  },
  update(id: string, patch: Partial<HeroSlide>) {
    state = state.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persist();
  },
  add(slide: HeroSlide) {
    state = reindex([...state, slide]);
    persist();
  },
  remove(id: string) {
    state = reindex(state.filter((s) => s.id !== id));
    persist();
  },
  move(id: string, direction: "up" | "down") {
    const idx = state.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= state.length) return;
    const next = [...state];
    [next[idx], next[target]] = [next[target], next[idx]];
    state = reindex(next);
    persist();
  },
  reset() {
    state = [...seed].sort((a, b) => a.order - b.order);
    persist();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useSlides(): HeroSlide[] {
  return useSyncExternalStore(
    (cb) => slidesStore.subscribe(cb),
    () => slidesStore.getAll(),
    () => slidesStore.getAll()
  );
}
