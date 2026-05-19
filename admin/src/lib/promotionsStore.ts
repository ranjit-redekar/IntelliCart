import { useSyncExternalStore } from "react";
import { promotions as seed } from "../mockdata";
import type { Promotion } from "../types";

const STORAGE_KEY = "intellicart_promotions_v1";

// NOTE — production swap point:
// Replace `load`/`persist` with fetch() against a shared backend
// (e.g. /api/promotions GET + PUT) so admin, customer-web, and mobile
// all read the same source. The public surface of this store (getAll,
// subscribe, toggle, update, add, remove) is what each app reuses;
// only the transport changes.

type Listener = () => void;

function load(): Promotion[] {
  if (typeof window === "undefined") return [...seed];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [...seed];
  try {
    return JSON.parse(raw) as Promotion[];
  } catch {
    return [...seed];
  }
}

let state: Promotion[] = load();
const listeners = new Set<Listener>();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const promotionsStore = {
  getAll(): Promotion[] {
    return state;
  },
  get(id: string): Promotion | undefined {
    return state.find((p) => p.id === id);
  },
  toggle(id: string, active: boolean) {
    state = state.map((p) =>
      p.id === id ? { ...p, status: active ? "active" : "draft" } : p
    );
    persist();
  },
  update(id: string, patch: Partial<Promotion>) {
    state = state.map((p) => (p.id === id ? { ...p, ...patch } : p));
    persist();
  },
  add(promotion: Promotion) {
    state = [promotion, ...state];
    persist();
  },
  remove(id: string) {
    state = state.filter((p) => p.id !== id);
    persist();
  },
  reset() {
    state = [...seed];
    persist();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function usePromotions(): Promotion[] {
  return useSyncExternalStore(
    (cb) => promotionsStore.subscribe(cb),
    () => promotionsStore.getAll(),
    () => promotionsStore.getAll()
  );
}
