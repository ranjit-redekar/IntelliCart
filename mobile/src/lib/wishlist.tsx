import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "../../../shared/types";
import { api, ApiError } from "./api";
import { useSession } from "./session";

const KEY = "intellicart_wishlist_v1";

interface WishlistCtx {
  ids: string[];
  /** Signed in: saved products from the last server sync (filter by `has`; new saves appear after `refresh`). Signed out: []. */
  items: Product[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  /** The list for the current account (or this device, signed out) has loaded. */
  ready: boolean;
  /** Last sync failure, signed in only. */
  error: string | null;
  /** Re-sync from the server (no-op signed out). */
  refresh: () => Promise<void>;
}

const Ctx = createContext<WishlistCtx | null>(null);

async function readDevice(): Promise<string[]> {
  try {
    const v: unknown = JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const set = (list: string[], id: string, on: boolean) =>
  list.includes(id) === on ? list : on ? [...list, id] : list.filter((x) => x !== id);

/** In-flight writes for one product, serialized so rapid taps land in order. */
interface Op {
  want: boolean;
  confirmed: boolean;
  last: Promise<void>;
}

/**
 * Signed out: device-only (AsyncStorage). Signed in: the account's list on the
 * server; device ids are merged up on sign-in and then cleared.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, ready: sessionReady } = useSession();
  // null = session not restored yet, "" = signed out (device), else the user id.
  const owner = sessionReady ? (user?.id ?? "") : null;
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ownerRef = useRef(owner);
  const ops = useRef(new Map<string, Op>());
  const writes = useRef(0);

  const sync = useCallback(async (who: string) => {
    // A GET that raced a PUT/DELETE may predate it: refetch if a write settled meanwhile.
    const fetchServer = async () => {
      for (let i = 0; ; i++) {
        const w = writes.current;
        const r = await api.get<{ items: Product[] }>("/account/wishlist");
        if (w === writes.current || i === 2) return r.items;
      }
    };
    try {
      const device = await readDevice();
      let server = await fetchServer();
      const missing = device.filter((id) => !server.some((p) => p.id === id));
      if (missing.length) {
        // ponytail: ids of deleted products 500 on PUT (FK); allSettled just drops them.
        await Promise.allSettled(missing.map((id) => api.put(`/account/wishlist/${encodeURIComponent(id)}`)));
        server = await fetchServer();
      }
      if (ownerRef.current !== who) return; // signed out/switched meanwhile: leave the device list alone
      await AsyncStorage.removeItem(KEY).catch(() => {});
      if (ownerRef.current !== who) return;
      let next = server.map((p) => p.id);
      for (const [id, op] of ops.current) next = set(next, id, op.want); // keep optimistic taps still in flight
      setItems(server);
      setIds(next);
      setError(null);
    } catch (e) {
      if (ownerRef.current === who) setError(e instanceof ApiError ? e.message : "Couldn't load your wishlist.");
    } finally {
      if (ownerRef.current === who) setLoadedFor(who);
    }
  }, []);

  useEffect(() => {
    ownerRef.current = owner;
    if (owner === null) return;
    // New account (or signed out): never show the previous one's list.
    ops.current.clear();
    setIds([]);
    setItems([]);
    setError(null);
    if (owner) {
      void sync(owner);
      return;
    }
    void readDevice().then((saved) => {
      if (ownerRef.current !== "") return;
      setIds((curr) => [...new Set([...curr, ...saved])]); // keep taps made before the read finished
      setLoadedFor("");
    });
  }, [owner, sync]);

  // Persist only a device list that was loaded as one (not the account list on the sign-out render).
  useEffect(() => {
    if (owner === "" && loadedFor === "") AsyncStorage.setItem(KEY, JSON.stringify(ids)).catch(() => {});
  }, [ids, owner, loadedFor]);

  const toggle = useCallback(
    (id: string) => {
      const want = !ids.includes(id);
      setIds((curr) => set(curr, id, want));
      if (!owner) return;
      const who = owner;
      const op = ops.current.get(id) ?? { want, confirmed: !want, last: Promise.resolve() };
      op.want = want;
      const last = op.last
        .then(() => (want ? api.put(`/account/wishlist/${encodeURIComponent(id)}`) : api.del(`/account/wishlist/${encodeURIComponent(id)}`)))
        .then(
          () => void (op.confirmed = want),
          () => {},
        )
        .finally(() => void writes.current++);
      op.last = last;
      ops.current.set(id, op);
      void last.then(() => {
        if (op.last !== last) return; // a later tap settles this id
        if (ops.current.get(id) === op) ops.current.delete(id);
        // On failure this rolls back to what the server last confirmed.
        if (ownerRef.current === who) setIds((curr) => set(curr, id, op.confirmed));
      });
    },
    [ids, owner],
  );

  const refresh = useCallback(async () => {
    if (owner) await sync(owner);
  }, [owner, sync]);

  const value = useMemo<WishlistCtx>(
    () => ({
      ids,
      items,
      has: (id) => ids.includes(id),
      toggle,
      ready: owner !== null && loadedFor === owner,
      error,
      refresh,
    }),
    [ids, items, toggle, owner, loadedFor, error, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
