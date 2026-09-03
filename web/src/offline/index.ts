import snapshot from "./snapshot.json";
import { ApiError } from "../lib/api";

/**
 * Offline demo transport.
 *
 * Serves recorded API responses so the whole app runs as a static build with
 * no server. Deliberately NOT a second implementation of the product: reads
 * come from a snapshot of the real API, and only the handful of writes a demo
 * needs to feel alive are simulated. Anything else says so plainly rather than
 * pretending to have worked.
 */
type Json = Record<string, unknown>;
const data = snapshot as Record<string, unknown>;

const DEMO_KEY = "ic_demo_state_v1";

interface DemoState {
  cartQty: Record<string, number>;
  signedInAs: "customer" | "admin" | null;
  wishlist: string[];
}

const EMPTY: DemoState = { cartQty: {}, signedInAs: null, wishlist: [] };

function load(): DemoState {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(DEMO_KEY) ?? "{}") as Partial<DemoState>) };
  } catch {
    return { ...EMPTY };
  }
}
function save(state: DemoState) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  } catch {
    /* private window — the demo still works, it just forgets */
  }
}

/** Snapshot lookup with the query-order tolerance a real server has. */
function lookup(path: string): unknown | undefined {
  if (path in data) return data[path];
  const [base, query = ""] = path.split("?");
  const wanted = new URLSearchParams(query);
  wanted.sort();
  for (const key of Object.keys(data)) {
    const [kBase, kQuery = ""] = key.split("?");
    if (kBase !== base) continue;
    const have = new URLSearchParams(kQuery);
    have.sort();
    if (have.toString() === wanted.toString()) return data[key];
  }
  // Same path, any query: better a close list than an error page.
  const loose = Object.keys(data).find((k) => k.split("?")[0] === base);
  return loose ? data[loose] : undefined;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/* ------------------------------------------------------------------ cart */

interface CartLine {
  productId: string; name: string; price: number; category: string;
  categoryId: string; image: string; stock: number; qty: number; lineTotal: number;
}

/** Same rules as lib/pricing.ts on the server. Kept in one place here. */
function priceCart(items: CartLine[]) {
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 8;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  return { subtotal, shipping, tax, total: Math.round((subtotal + shipping + tax) * 100) / 100 };
}

function buildCart(state: DemoState) {
  const items: CartLine[] = [];
  for (const [productId, qty] of Object.entries(state.cartQty)) {
    if (qty <= 0) continue;
    const p = lookup(`/products/${productId}`) as
      | { id: string; name: string; price: number; category: string; categoryId: string; image: string; stock: number }
      | undefined;
    if (!p) continue;
    items.push({
      productId, name: p.name, price: p.price, category: p.category,
      categoryId: p.categoryId, image: p.image, stock: p.stock,
      qty, lineTotal: Math.round(p.price * qty * 100) / 100,
    });
  }
  return { items, count: items.reduce((n, i) => n + i.qty, 0), ...priceCart(items) };
}

/* --------------------------------------------------------------- routing */

const notAvailable = (what: string) =>
  new ApiError(
    501,
    "demo_mode",
    `${what} isn't available in the offline demo — it needs the server.`,
  );

export async function offlineRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // A touch of latency so loading states are visible rather than skipped.
  await new Promise((r) => setTimeout(r, 60 + Math.random() * 90));
  const state = load();
  const b = (body ?? {}) as Json;

  if (method === "GET") {
    if (path === "/cart") return buildCart(state) as T;

    if (path === "/auth/me") {
      if (state.signedInAs === "admin") return clone(data["/auth/me::admin"]) as T;
      if (state.signedInAs === "customer") {
        return { user: { id: "C-01", name: "Alex Turner", email: "alex@example.com" }, kind: "customer", permissions: [] } as T;
      }
      return { user: null } as T;
    }

    if (path === "/account/wishlist") {
      const items = state.wishlist
        .map((id) => lookup(`/products/${id}`))
        .filter(Boolean);
      return { items } as T;
    }

    // Anything behind auth returns empty rather than erroring when signed out.
    if (path.startsWith("/account/") && state.signedInAs !== "customer") {
      throw new ApiError(401, "unauthorized", "Sign in to continue.");
    }
    if (path.startsWith("/admin/") && state.signedInAs !== "admin") {
      throw new ApiError(401, "unauthorized", "Sign in to continue.");
    }

    const hit = lookup(path);
    if (hit !== undefined) return clone(hit) as T;
    throw new ApiError(404, "not_found", "Not captured in the offline demo.");
  }

  /* ----------------------------------------------------------- auth */
  if (path === "/auth/sign-in") {
    if (typeof b.password !== "string" || b.password.length < 4) {
      throw new ApiError(401, "unauthorized", "Email or password is incorrect.");
    }
    state.signedInAs = "customer";
    save(state);
    return { user: { id: "C-01", name: "Alex Turner", email: String(b.email) } } as T;
  }
  if (path === "/auth/admin/sign-in") {
    if (typeof b.password !== "string" || b.password.length < 4) {
      throw new ApiError(401, "unauthorized", "Email or password is incorrect.");
    }
    state.signedInAs = "admin";
    save(state);
    const me = clone(data["/auth/me::admin"]) as { user: unknown; permissions: unknown };
    return { user: me.user, permissions: me.permissions } as T;
  }
  if (path === "/auth/sign-out") {
    state.signedInAs = null;
    save(state);
    return { ok: true } as T;
  }
  if (path === "/auth/sign-up" || path === "/auth/register") {
    throw notAvailable("Creating an account");
  }

  /* ----------------------------------------------------------- cart */
  if (path === "/cart/items" && method === "POST") {
    const id = String(b.productId);
    const qty = Number(b.qty ?? 1);
    state.cartQty[id] = (state.cartQty[id] ?? 0) + qty;
    save(state);
    return buildCart(state) as T;
  }
  if (path.startsWith("/cart/items/")) {
    const id = path.split("/").pop()!;
    if (method === "DELETE") delete state.cartQty[id];
    else state.cartQty[id] = Number(b.qty ?? 0);
    if ((state.cartQty[id] ?? 0) <= 0) delete state.cartQty[id];
    save(state);
    return buildCart(state) as T;
  }
  if (path === "/cart" && method === "DELETE") {
    state.cartQty = {};
    save(state);
    return buildCart(state) as T;
  }
  if (path === "/cart/merge") return buildCart(state) as T;

  /* ------------------------------------------------------- wishlist */
  if (path.startsWith("/account/wishlist/")) {
    const id = path.split("/").pop()!;
    if (state.signedInAs !== "customer") throw new ApiError(401, "unauthorized", "Sign in to continue.");
    state.wishlist = method === "DELETE"
      ? state.wishlist.filter((x) => x !== id)
      : [...new Set([...state.wishlist, id])];
    save(state);
    return { ok: true } as T;
  }

  /* ------------------------------------------------------- checkout */
  if (path === "/checkout") {
    if (state.signedInAs !== "customer") throw new ApiError(401, "unauthorized", "Sign in to continue.");
    const cart = buildCart(state);
    if (!cart.items.length) throw new ApiError(400, "bad_request", "Your cart is empty.");
    const id = `ORD-DEMO${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const order = {
      id, status: "pending", placedAt: new Date().toISOString().slice(0, 10),
      customerName: String(b.name ?? "Alex Turner"),
      subtotal: cart.subtotal, shipping: cart.shipping, tax: cart.tax, total: cart.total,
      items: cart.items.map((i) => ({ productId: i.productId, sku: i.productId, name: i.name, qty: i.qty, unitPrice: i.price })),
      address: { name: String(b.name ?? ""), line1: String(b.line1 ?? ""), city: String(b.city ?? ""), postal: String(b.postal ?? ""), country: String(b.country ?? "US") },
      timeline: [{ status: "pending", at: new Date().toISOString(), note: "Order placed" }],
    };
    // Readable back on the confirmation screen, which fetches it by id.
    data[`/account/orders/${id}`] = order;
    state.cartQty = {};
    save(state);
    return order as T;
  }

  /* ------------------------------------------------------------- ai */
  if (path === "/ai/assistant") {
    const products = ((lookup("/products?pageSize=8&sort=rating") as { items: unknown[] })?.items ?? []).slice(0, 3);
    return {
      text: "Here are a few picks based on what you asked. (Offline demo — replies are recorded, not generated.)",
      products, followups: ["Anything similar but cheaper?", "What do customers say about these?"],
      source: "fixture", interpretation: null,
    } as T;
  }

  /* ------------------------------------- admin writes: honest refusal */
  if (path.startsWith("/admin/") || path.startsWith("/auth/")) {
    throw notAvailable("Saving changes");
  }
  throw notAvailable("That action");
}

/** Reset the bits the demo remembers. */
export function resetDemoState() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* nothing to clear */
  }
}
