/**
 * End-to-end smoke test against a running API with seeded data:
 *   npm run seed && npm run dev   (in another shell)
 *   npm run smoke                 (API_URL overrides http://localhost:3000)
 * Walks the flows the web and mobile clients depend on, using Bearer auth like
 * the mobile app. Writes one real order for the demo customer each run.
 */
const B = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "");
let token = null, fails = 0;
async function call(method, path, body, headers = {}) {
  const res = await fetch(B + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
function check(name, cond, extra = "") { console.log(`${cond ? "ok  " : "FAIL"} ${name} ${extra}`); if (!cond) fails++; }

const signin = await call("POST", "/auth/sign-in", { email: "jordan@example.com", password: "demo1234" });
check("sign-in returns token", signin.status === 200 && !!signin.json?.token, String(signin.status) + " " + (signin.json?.error?.message ?? ""));
token = signin.json?.token;
const me = await call("GET", "/auth/me"); check("auth/me via Bearer", me.json?.user?.email === "jordan@example.com");
const cats = await call("GET", "/categories"); check("categories", cats.json?.items?.length > 0, `n=${cats.json?.items?.length} productCount=${cats.json?.items?.[0]?.productCount}`);
const cat = cats.json.items[0].id;
const prods = await call("GET", `/products?cat=${cat}&pageSize=20`); check("products by cat", prods.json?.items?.length > 0);
const all = await call("GET", `/products?cat=all&pageSize=20`); check("cat=all accepted", all.status === 200, String(all.status));
const q = await call("GET", `/products?q=under%20%2450&pageSize=40`); check("search + interpretation", q.status === 200, `total=${q.json?.total} interp=${JSON.stringify(q.json?.interpretation)?.slice(0,60)}`);
const price = await call("GET", `/products?minPrice=50&maxPrice=99.99&pageSize=40`);
check("price band in range", price.status === 200 && price.json.items.every((p) => p.price >= 50 && p.price <= 99.99), `n=${price.json?.items?.length}`);
const pop = await call("GET", `/products?sort=rating&pageSize=8`); check("popular sort=rating", pop.status === 200, String(pop.status));
const pid = prods.json.items[0].id;
const pd = await call("GET", `/products/${pid}`); check("product detail", pd.status === 200, `keys=${Object.keys(pd.json ?? {}).join(",").slice(0,90)}`);
const rv = await call("GET", `/products/${pid}/reviews?pageSize=20`); check("reviews", rv.status === 200);
const nf = await call("GET", `/products/NOPE-404`); check("product 404", nf.status === 404, String(nf.status));
const sl = await call("GET", `/slides?surface=mobile`); check("slides mobile", sl.status === 200, `n=${sl.json?.items?.length}`);
const pr = await call("GET", `/promotions?surface=mobile`); check("promotions mobile", pr.status === 200, `n=${pr.json?.items?.length}`);
const ov = await call("GET", `/account/overview`); check("account overview", ov.status === 200, JSON.stringify(ov.json)?.slice(0,120));
const ords = await call("GET", `/account/orders?pageSize=4`); check("account orders", ords.status === 200, `n=${ords.json?.items?.length}`);
const oid = ords.json?.items?.[0]?.id;
if (oid) { const od = await call("GET", `/account/orders/${oid}`); check("order detail", od.status === 200 && Array.isArray(od.json?.items), `keys=${Object.keys(od.json ?? {}).join(",")}`); }
const revs = await call("GET", `/account/reviews?pageSize=3`); check("account reviews", revs.status === 200, String(revs.status));
const addrs = await call("GET", `/account/addresses`); check("addresses", addrs.status === 200, `n=${addrs.json?.items?.length}`);
// checkout exactly like mobile: replace server cart, add lines, place order with idempotency key
// Checkout exactly like mobile: replace the server cart in one call, then order.
const put = await call("PUT", "/cart", { items: [{ productId: pid, qty: 1 }, { productId: "NOPE", qty: 1 }] });
check("replace server cart (unknown product dropped)", put.status === 200 && put.json?.items?.length === 1 && put.json.items[0].qty === 1, String(put.status));
const capped = await call("PUT", "/cart", { items: [{ productId: pid, qty: 99 }] });
check("replace caps qty at stock", capped.status === 200 && capped.json.items[0].qty <= pd.json.stock, `qty=${capped.json?.items?.[0]?.qty} stock=${pd.json?.stock}`);
await call("PUT", "/cart", { items: [{ productId: pid, qty: 1 }] });
const a = addrs.json?.items?.[0] ?? { name: "Jordan", line1: "1 Main St", city: "SF", postal: "94105", country: "US" };
const key = "smoke-" + Date.now();
const co = await call("POST", "/checkout", { name: a.name, line1: a.line1, city: a.city, postal: a.postal, country: a.country, paymentMethod: "card", cardLast4: "4242" }, { "Idempotency-Key": key });
check("checkout", co.status < 300 && !!co.json?.id, `${co.status} ${co.json?.error?.message ?? co.json?.id}`);
const co2 = await call("POST", "/checkout", { name: a.name, line1: a.line1, city: a.city, postal: a.postal, country: a.country, paymentMethod: "card" }, { "Idempotency-Key": key });
check("idempotent replay returns same order", co2.json?.id === co.json?.id, `${co2.status} ${co2.json?.id}`);
// A second order, left unrefunded, for the ship/capture checks below.
await call("PUT", "/cart", { items: [{ productId: pid, qty: 1 }] });
const shipOrder = await call("POST", "/checkout", { name: a.name, line1: a.line1, city: a.city, postal: a.postal, country: a.country, paymentMethod: "card" }, { "Idempotency-Key": key + "-ship" });
if (co.json?.id) { const nod = await call("GET", `/account/orders/${co.json.id}`); check("new order readable", nod.status === 200); }
const wlBad = await call("PUT", "/account/wishlist/NOPE"); check("wishlist unknown product → 404", wlBad.status === 404, String(wlBad.status));
const wlHad = (await call("GET", "/account/wishlist")).json?.items?.some((p) => p.id === pid);
await call("PUT", `/account/wishlist/${pid}`);
check("wishlist save", (await call("GET", "/account/wishlist")).json?.items?.some((p) => p.id === pid));
if (!wlHad) await call("DELETE", `/account/wishlist/${pid}`);
const badAddr = await call("POST", "/account/addresses", { name: "  ", line1: "x", city: "y", postal: "z" }); check("blank name rejected", badAddr.status === 400, String(badAddr.status));
const so = await call("POST", "/auth/sign-out"); check("sign-out", so.status < 300, String(so.status));
const me2 = await call("GET", "/auth/me"); check("token dead after sign-out", me2.json?.user === null);
// admin
token = null;
const as = await call("POST", "/auth/admin/sign-in", { email: "admin@intellicart.shop", password: "demo1234" });
check("admin sign-in", as.status === 200 && !!as.json?.token, String(as.status)); token = as.json?.token;
if (co.json?.id) {
  const before = (await call("GET", `/admin/products/${pid}`)).json?.stock;
  const rf = await call("POST", `/admin/orders/${co.json.id}/refund`, { reason: "smoke test", restock: true });
  check("refund", rf.status === 200 && rf.json?.payment?.status === "refunded", `${rf.status} ${rf.json?.error?.message ?? ""}`);
  const after = (await call("GET", `/admin/products/${pid}`)).json?.stock;
  check("refund restocks", after === before + 1, `${before} → ${after}`);
  const rf2 = await call("POST", `/admin/orders/${co.json.id}/refund`, {});
  check("second refund → 409", rf2.status === 409, String(rf2.status));
}
if (shipOrder.json?.id) {
  const sid = shipOrder.json.id;
  check("new order payment starts authorized", (await call("GET", `/admin/orders/${sid}`)).json?.payment?.status === "authorized");
  const shipped = await call("PATCH", `/admin/orders/${sid}/status`, { status: "shipped" });
  const after = await call("GET", `/admin/orders/${sid}`);
  check("shipping captures payment", shipped.status === 200 && after.json?.payment?.status === "captured", `${shipped.status} ${after.json?.payment?.status}`);
  const mail = await call("POST", `/admin/orders/${sid}/email`, { subject: "  About your order  ", body: "Hello from the smoke test." });
  check("email customer queued", mail.status === 202, String(mail.status));
  check("email needs a subject", (await call("POST", `/admin/orders/${sid}/email`, { subject: " ", body: "x" })).status === 400);
}
const exp = await call("GET", "/admin/export");
check("workspace export", exp.status === 200 && ["products", "customers", "orders", "settings"].every((k) => Array.isArray(exp.json?.[k]) || typeof exp.json?.[k] === "object"), String(exp.status));
check("export leaks no credentials", !/passwordhash|password_hash|"token"|apikey|secret/i.test(exp.text));
const imp = await call("POST", "/admin/products/import", {
  dryRun: true,
  rows: [
    { sku: `SMOKE-${Date.now()}`, name: "Smoke import", category: cats.json.items[0].name, price: "12.5", stock: "3" },
    { sku: "SMOKE-BAD", name: "   ", price: "-1" },
  ],
});
check("import dry run splits create / error", imp.status === 200 && imp.json?.created === 1 && imp.json?.skipped === 1, `${imp.status} ${JSON.stringify(imp.json?.results?.map((r) => r.action))}`);
const sorted = await call("GET", "/admin/products?sort=stock-asc&pageSize=50");
check("admin sort stock-asc", sorted.status === 200 && sorted.json.items.every((p, i, arr) => i === 0 || arr[i - 1].stock <= p.stock), String(sorted.status));
const vip = await call("GET", "/admin/customers?tier=VIP&pageSize=100"); check("tier=VIP all >=12", vip.status === 200 && vip.json.items.every((c) => c.orders >= 12), `n=${vip.json?.items?.length} total=${vip.json?.total}`);
const loyal = await call("GET", "/admin/customers?tier=Loyal&pageSize=100"); check("tier=Loyal 6-11", loyal.status === 200 && loyal.json.items.every((c) => c.orders >= 6 && c.orders <= 11), `total=${loyal.json?.total}`);
const counts = await call("GET", "/admin/analytics/counts"); check("counts", counts.status === 200, JSON.stringify(counts.json));
const ap = await call("GET", "/admin/orders?status=pending&pageSize=1"); check("orders status filter", ap.status === 200, `pending total=${ap.json?.total}`);
token = (await call("POST", "/auth/admin/sign-in", { email: "staff@intellicart.shop", password: "demo1234" })).json?.token;
check("viewer can't export", (await call("GET", "/admin/export")).status === 403);

// Session revoke, on the demo *manager* so the main admin stays signed in.
// Note: "revoke others" signs out every other manager session on this server.
const mgr = async () => (await call("POST", "/auth/admin/sign-in", { email: "manager@intellicart.shop", password: "demo1234" }, {})).json?.token;
token = null;
const t1 = await mgr(), t2 = await mgr(), t3 = await mgr();
token = t3;
const list = await call("GET", "/auth/sessions");
const other = list.json?.items?.find((x) => !x.current);
const one = other ? await call("DELETE", `/auth/sessions/${other.id}`) : { status: 0 };
check("revoke one session", one.status === 200, String(one.status));
const cur = list.json?.items?.find((x) => x.current);
const self = cur ? await call("DELETE", `/auth/sessions/${cur.id}`) : { status: 0 };
check("can't revoke current session that way", self.status === 400, String(self.status));
const others = await call("POST", "/auth/sessions/revoke-others");
check("revoke others", others.status === 200, `revoked=${others.json?.revoked}`);
for (const [name, t] of [["first", t1], ["second", t2]]) {
  token = t;
  check(`${name} manager session is dead`, (await call("GET", "/auth/me")).json?.user === null);
}
token = t3;
check("current manager session survives", (await call("GET", "/auth/me")).json?.user?.email === "manager@intellicart.shop");

// Password change on a throwaway customer, never a seeded one.
token = null;
const pwEmail = `smoke-${Date.now()}@example.test`;
token = (await call("POST", "/auth/sign-up", { name: "Smoke Test", email: pwEmail, password: "first-pass-1" })).json?.token;
const pwOk = await call("POST", "/auth/password", { current: "first-pass-1", next: "second-pass-2" });
check("password change", pwOk.status === 200, String(pwOk.status));
check("still signed in after own change", (await call("GET", "/auth/me")).json?.user?.email === pwEmail);
token = null;
check("old password rejected", (await call("POST", "/auth/sign-in", { email: pwEmail, password: "first-pass-1" })).status === 401);
token = (await call("POST", "/auth/sign-in", { email: pwEmail, password: "second-pass-2" })).json?.token;
check("new password works", !!token);
let lastStatus = 0;
for (let i = 0; i < 9; i++) lastStatus = (await call("POST", "/auth/password", { current: "wrong-guess", next: "whatever-123" })).status;
check("password guessing locks out", lastStatus === 429, String(lastStatus));

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
