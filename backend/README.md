# IntelliCart backend

Fastify + Postgres + Redis. Replaces the `mockdata/` fixtures the web and mobile
apps read directly today.

Full architecture, including the nine diagrams and the Redis key-family
reference: `docs/backend-architecture.md`.

## Run it

From the **repo root** (backing services and app both):

```bash
docker compose up -d              # postgres, redis, minio, mailpit, api, worker
```

Or backing services in Docker and the API on the host, which is nicer for
iterating:

```bash
docker compose up -d postgres redis minio mailpit
cd backend
cp .env.example .env
npm install
npx drizzle-kit push              # create the schema
npm run seed                      # load mockdata/index.ts into Postgres
npm run dev                       # :3000
npm run dev:worker                # queues, rollups, audit flush
```

`npm run seed` loads the same 24 products, 22 customers, 27 orders and 23
reviews the UI showed before there was a backend, so a fresh database renders
exactly what the fixtures did. Every seeded account's password is `demo1234`.

### First run

A store with no owner yet sends you to **`/admin/#/register`** instead of a
login form nobody has credentials for. That screen creates the owner account
and loads sample data in the same step — tick the datasets you want, and
anything a choice depends on is ticked for you (order history needs a catalog
and customers, or the line items point at nothing).

Registration is only available while `admin_users` is empty. Once someone has
claimed the store it returns 409, because otherwise it is an open endpoint for
minting owner accounts.

### Seeding from the admin UI

You do not need the CLI. Sign in as an owner and go to **Settings → Demo data**:
it shows what is currently in the database and offers a one-click reload of the
sample catalog.

You choose what to load — the same eight datasets as the setup screen — and
only what you select is replaced. It is destructive, so it has three locks:

| Lock | Why |
|---|---|
| `ALLOW_DEMO_SEED=true` | Defaults to **false** when `NODE_ENV=production`, where this would delete real orders. |
| Owner role | A manager sees the row counts but not the control. |
| Typed confirmation | The operator types `RESET DEMO DATA`; there is no undo. |

Admin accounts are preserved — the person clicking is one of them, and wiping
that table would sign them out and delete the account they would need to sign
back in with. Caches, carts and counters are flushed afterwards, so the
storefront reflects the new data immediately.

The fixtures live in `mockdata/*.ts`. `npm run fixtures` snapshots them to
`src/db/fixtures.json`, which is what the running server reads — it runs
automatically as part of `npm run build` and `npm run seed`.

| | |
|---|---|
| Storefront accounts | `alex@example.com`, `maya@example.com`, … |
| Admin accounts | `admin@` (owner), `manager@` (manager), `staff@` (viewer) `@intellicart.shop` |

## Checks

```bash
npm test        # 21 assertions: money, pricing, permissions, key collisions, ids
npm run typecheck
npm run build
```

`npm test` needs no database and no Redis — it covers the pure logic where a
bug silently corrupts money or oversells stock.

## Layout

```
src/
  server.ts        Fastify app, CORS, health, route registration
  worker.ts        BullMQ consumers, audit flush, counter refresh, cart expiry
  env.ts           zod-validated configuration — fails fast on a bad env
  db/
    schema.ts      21 tables
    seed.ts        loads mockdata/index.ts (run via tsx, not in the bundle)
  redis/
    keys.ts        every key the system uses, in one place
    cache.ts       cache-aside with a stampede lock and tag invalidation
  lib/             money, pricing, ids, permissions, errors, pagination
  routes/          auth, catalog, cart, checkout, account, admin,
                   merchandising, analytics, ai, uploads
  ai/              query interpretation + the Claude-backed assistant
```

## Things worth knowing

**Money is integer cents everywhere.** `lib/money.ts` converts at the API
boundary only. `lib/pricing.ts` is the single pricing function — the frontend
currently computes shipping and tax three different and mutually inconsistent
ways, and none of them should survive.

**Redis is not the source of truth.** Stop it and catalog reads keep working
against Postgres; auth fails closed. `/readyz` reports it so a rolling deploy
gates on it. What Redis does own is guest carts, which is a deliberate trade —
they have a TTL and their expiry drives abandoned-cart recovery.

**`--notify-keyspace-events Ex` is required** and is not a Redis default. Without
it the abandoned-cart job never fires and nothing errors. It is set in
`docker-compose.yml`.

**Docker build context is the repo root**, not this directory: the backend
shares `../shared` and `../mockdata` with the other apps.

```bash
docker build -f backend/Dockerfile --target api .
```

**Checkout requires an `Idempotency-Key` header.** A retry returns the original
order rather than creating a second one.
