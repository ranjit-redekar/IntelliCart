<div align="center">

# 🛒 IntelliCart

**The AI-first ecommerce platform — every workflow starts with AI.**

<sub>⌘K to ask anywhere in admin · AI shopping concierge on web & mobile · auto-drafted replies · live insights</sub>

**[▶ Customer portal](https://ranjit-redekar.github.io/IntelliCart/)** · **[Admin console](https://ranjit-redekar.github.io/IntelliCart/admin/)**

![Stack](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000?logo=expo&logoColor=white)

</div>

---

## ✨ What's inside

Three packages behind one API:

| Package | What it does | Stack |
|---------|--------------|-------|
| 🌐 **web** | Storefront (`/`) + operator console (`/admin/`) in one deployable | Vite · React 19 · Tailwind v4 · React Router |
| ⚙️ **backend** | REST API, background worker, seeder | Fastify · Postgres · Redis · Drizzle |
| 📱 **mobile** | Native iOS/Android customer app | Expo SDK 54 · Expo Router · React Native |

```
                 ┌──────────────────────────┐
                 │  shared/  (domain types) │
                 │  mockdata/ (seed data)   │
                 └────────────┬─────────────┘
                              │
     ┌──────────────┬─────────▼────────┬──────────────┐
     │     web      │     backend      │    mobile    │
     │ / + /admin/  │   Fastify API    │  Expo Router │
     └──────┬───────┴─────────┬────────┴──────┬───────┘
            │      HTTP       │               │
            └─────────────────┼───────────────┘
                              │
                  ┌───────────┴───────────┐
                  │ PostgreSQL  ·  Redis  │
                  └───────────────────────┘
```

> `mobile/` still reads `mockdata/` directly — it has not been moved onto the API yet.

---

## 🌐 Live demo (GitHub Pages)

The web app is deployed automatically on every push to `main`. No install required — open either entry point and sign in with the [demo accounts](#-demo-accounts) below.

| Surface | URL | Try it |
|---------|-----|--------|
| 🛍️ **Customer portal** | [ranjit-redekar.github.io/IntelliCart](https://ranjit-redekar.github.io/IntelliCart/) | Shop, wishlist, cart, checkout, AI assistant |
| 🛠️ **Admin console** | [ranjit-redekar.github.io/IntelliCart/admin](https://ranjit-redekar.github.io/IntelliCart/admin/) | Dashboard, AI Hub (24 copilots), catalog, orders, settings |

The Pages build runs in **offline mode**: requests are answered from a recorded
snapshot of the real API, so the demo works with no server behind it. See
[Offline demo](#offline-demo).

> 📱 **Mobile** runs locally via Expo (`cd mobile && npm start`).

---

## 🚀 Quick start

```bash
# 1. Backing services (postgres, redis, minio, mailpit)
docker compose up -d postgres redis minio mailpit

# 2. API
cd backend
cp .env.example .env
npm install
npx drizzle-kit push          # create the schema
npm run seed                  # load the sample store
npm run dev                   # → :3000
npm run dev:worker            # queues, rollups, audit flush (second terminal)

# 3. Web
cd ../web && npm install && npm run dev
#   storefront → http://localhost:5173/IntelliCart/
#   admin      → http://localhost:5173/IntelliCart/admin/
```

No Docker? Run the web app on its own in offline mode — see
[Offline demo](#offline-demo).

```bash
cd mobile && npm install && npm start   # Expo dev tools (press i / a / w)
```

## 🌍 Deploy

**Static demo (free).** Push to `main` —
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs
`npm run build:offline` and publishes to **GitHub Pages**. One-time repo setup:
**Settings → Pages → Source → GitHub Actions**. Both entries use `HashRouter`,
so deep links work on static hosting without server rewrites.

**With a real backend.** One container runs the API, both web apps and the
worker:

```bash
docker build -f backend/Dockerfile --target allinone -t intellicart .
```

`render.yaml` describes exactly that. Single-origin is not just cheaper — it
keeps the session cookie first-party. Serving the SPA from one domain and the
API from another makes it a *third-party* cookie, which Safari blocks and Chrome
is removing, so sign-in would fail for many visitors. See
[`backend/README.md`](backend/README.md) for both shapes and the managed
Postgres / Redis options.

---

## 🔑 Demo accounts

### Admin (`/admin/#/sign-in`)
| Email | Role | Password |
|-------|------|----------|
| `admin@intellicart.shop` | Owner | `demo1234` |
| `manager@intellicart.shop` | Manager | `demo1234` |
| `staff@intellicart.shop` | Viewer | `demo1234` |

Passwords are argon2id-hashed and actually checked. On a database with no admin
yet, `/admin/` sends you to **`/admin/#/register`** to create the first owner and
pick which demo data to load.

### Customer portal (`/sign-in`)
Any seeded customer — for example **`alex@example.com`**, **`maya@example.com`**,
**`jordan@example.com`** — password `demo1234`. Or create an account at `/sign-up`.

> In the **offline demo** any password works, since there is no server to check it.

---

## 🎯 Features at a glance

<details>
<summary><b>🛠️ Admin Console</b></summary>

- **Dashboard** — revenue, AOV, conversion, top products with sparklines, date-range filtering, and AI insights, date-range filtering, and AI insights
- **Products** — grid + list views, multi-image uploader, custom specs, highlights, tags, AI copywriter
- **Orders** — pipeline view, detail with line items + tracking timeline
- **Customers** — segmentation, lifetime value, per-customer history & reviews left
- **Feedback** — review inbox, AI-drafted replies, sentiment filtering
- **Promotions** — manage offers per surface (web / mobile / both), live previews
- **Hero slides** — carousel content with reorder + theme + live previews for each surface
- **AI Hub** — 24 specialized copilots across analytics, operations, growth, and catalog (side-nav categories, hash deep links)
- **Settings** — store profile, localization, shipping/tax, payments, auth, API keys, audit logs
- **Auth** — role-based mock accounts (Owner / Manager / Staff); one-click demo sign-in on the login page

</details>

<details>
<summary><b>🛍️ Customer Portal</b></summary>

- **Home** — hero slider (managed from admin), featured + top-rated products
- **Shop** — AI-powered smart search ("top-rated home goods under $80")
- **Product detail** — multi-image gallery, applicable offers, highlights, spec table, AI Q&A, reviews
- **Cart & checkout** — 3-step flow with order confirmation
- **Account** — orders, addresses, wishlist, reviews left, profile
- **Sign in / sign up** — polished auth flows with demo shortcuts and inline validation
- **AI shopping assistant** — floating chat widget on every page

</details>

<details>
<summary><b>📱 Mobile App</b></summary>

- **Shop tab** — hero carousel + categories + product grid
- **Search tab** — keyword search with AI shortcut card
- **Cart tab** — full checkout flow
- **Account tab** — sign in/up, orders, reviews
- **AI assistant** — full-screen chat (modal)
- **Floating pill tab bar** — modern icon-only nav with active-pill backdrop
- **Session persistence** — AsyncStorage

</details>

---

## 📂 Project structure

```
intellicart/
├── web/                      # Vite + React + TS — one app, two entries
│   ├── index.html            #   storefront  → /
│   ├── admin/index.html      #   admin       → /admin/
│   └── src/{shop,admin}/     #   per-portal pages, shared src/index.css
├── mobile/                   # Expo + React Native (customer app)
├── shared/
│   ├── types.ts              # Domain types (Product, Order, Feedback, …)
│   └── productExtras.ts      # Helper for product enrichment fallback
├── backend/                  # Fastify API + worker + seeder
│   ├── src/db/               #   Drizzle schema, seeder, fixtures snapshot
│   ├── src/redis/            #   key families, cache-aside, client
│   ├── src/routes/           #   auth, catalog, cart, checkout, admin, ai, …
│   └── src/worker.ts         #   BullMQ consumers, rollups, audit flush
├── mockdata/
│   ├── index.ts              # Seed data — catalog, customers, orders, reviews
│   └── ai.ts                 # Seed content for the 24 AI Hub screens
├── docker-compose.yml        # postgres · redis · minio · mailpit · api · worker
└── docs/
    ├── requirements.md
    └── ai-agents-roadmap.md
```

**Sharing model**: `shared/types.ts` is the contract — the API serves those shapes
and both clients consume them, so there is no schema duplication. `mockdata/` is
seed data for the database, not something the web app bundles. UI components are
intentionally per-app: web uses Tailwind + Lucide, mobile uses React Native
primitives + Feather.

---

## 🧪 Tech stack

Versions are the ones in the lockfiles, not aspirations.

### Backend — `backend/`

| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Node.js | ≥ 22 |
| HTTP framework | [Fastify](https://fastify.dev) | 5.2 |
| Language | TypeScript (`strict`) | 5.7 |
| Database | **PostgreSQL** | 17 |
| ORM / migrations | [Drizzle ORM](https://orm.drizzle.team) + Drizzle Kit | 0.38 / 0.30 |
| Postgres driver | `postgres` (postgres.js) | 3.4 |
| Cache · queues · realtime | **Redis** | 7 |
| Redis client | `ioredis` | 5.4 |
| Job queues | [BullMQ](https://docs.bullmq.io) | 5.34 |
| Validation | [Zod](https://zod.dev) | 3.24 |
| Password hashing | `argon2` (argon2id) | 0.41 |
| Object storage | AWS SDK v3 S3 + presigner | 3.700 |
| LLM | `@anthropic-ai/sdk` (Claude) | 0.32 |
| Logging | Pino (bundled with Fastify) | — |

Fastify plugins: `@fastify/cookie`, `@fastify/cors`, `@fastify/rate-limit`
(Redis-backed), `@fastify/static`, `fastify-plugin`.

### Web — `web/`

One Vite app with two entry points: storefront at `/` and admin at `/admin/`.

| Layer | Choice | Version |
|-------|--------|---------|
| UI | React | 19.2 |
| Build | Vite | 8.0 |
| Routing | React Router (`HashRouter`) | 7.15 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | 4.3 |
| Icons | `lucide-react` | 1.16 |
| Charts | Recharts | 3.8 |
| Class merging | `clsx` | 2.1 |
| Language | TypeScript | 6.0 |
| Linting | ESLint 10 + typescript-eslint 8 + react-hooks 7 | — |

`HashRouter` is deliberate: it means a static host needs no rewrite rules, which
is what lets GitHub Pages serve deep links.

> ⚠️ `web/tsconfig.app.json` does **not** set `strict` — backend and mobile both
> do. Worth closing, but turning it on surfaces a backlog of existing errors.

### Mobile — `mobile/`

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Expo SDK | 54 |
| Routing | Expo Router | 6.0 |
| Native runtime | React Native | 0.81 |
| UI | React | 19.1 |
| Icons | `@expo/vector-icons` (Feather) | 15.0 |
| Storage | `@react-native-async-storage/async-storage` | 2.2 |
| Language | TypeScript (`strict`) | 5.9 |

### Local infrastructure — `docker-compose.yml`

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL | `postgres:17-alpine` | 5432 |
| Redis | `redis:7-alpine` | 6379 |
| Object storage | `minio/minio` | 9000 (console 9001) |
| Mail catcher | `axllent/mailpit` | 1025 (inbox 8025) |

Redis runs with `--appendonly yes --notify-keyspace-events Ex`. The second flag
is **not** a default and is load-bearing: cart-key expiry is what triggers
abandoned-cart recovery, and without it that job silently never fires.

### How the data is split

**Postgres is the system of record** — catalog, customers, orders, line items,
payments, reviews, merchandising, settings, audit log, AI Hub content. 22 tables.

**Redis is cache, coordination and transport, never the source of truth** —
sessions, cart state, rate limiting, brute-force lockout, stock locks,
idempotency keys, BullMQ queues, pub/sub for live merchandising (SSE), analytics
rollups and badge counters. Stop Redis and catalog reads still serve from
Postgres; auth fails closed. `/readyz` reports both.

One deliberate exception: **guest carts live only in Redis**, with a TTL. Writing
a row for every anonymous visitor is how you accumulate a million dead rows — and
the expiry event is what drives cart recovery. The `carts` / `cart_items` tables
exist for the durable half of that design and stay empty until carts need to
outlive Redis.

### Notable choices, and why

| Decision | Reason |
|----------|--------|
| Opaque session tokens in Redis, not JWT | The settings screen lists live sessions and offers revoke. A JWT stays valid until it expires no matter what the server thinks. |
| Money as integer cents | Floats do not survive arithmetic. Conversion happens once, at the API boundary. |
| Drizzle over Prisma | Types are inferred from the schema, so they line up with `shared/types.ts` without a generated client or a second runtime. |
| `postgres.js` over `pg` | Smaller, faster, and what Drizzle's docs use for this driver. |
| Zod at every trust boundary | One error envelope with field-level detail, so the UI can put errors next to inputs. |
| argon2id | The current password-hashing recommendation. bcrypt's 72-byte truncation is a footgun. |

---

## 📋 Requirements doc

See [`docs/requirements.md`](docs/requirements.md) for the original product brief.

---

## Offline demo

The app can run as a pure static site with no server — that is what the GitHub
Pages deploy publishes.

```bash
cd web
npm run snapshot        # record the API into src/offline/snapshot.json
npm run build:offline   # build with VITE_OFFLINE=true
```

The API client is unchanged; only its transport swaps. Requests are answered
from a recorded snapshot of the real API, so the demo cannot drift from the
real app the way a parallel set of fixtures would. The snapshot is code-split,
so it only downloads in the offline build (~56 kB gzipped).

| Works | Does not |
|---|---|
| Browsing, search, filters, product pages | Saving admin changes |
| Cart, checkout, order confirmation | Creating an account |
| Sign-in (any password), account pages | Live merchandising updates (SSE) |
| Admin dashboard, lists, AI Hub, settings | Anything needing a real write |

Writes that cannot work say so instead of silently appearing to succeed, and a
badge in the corner states there is no server behind the build.

Re-record the snapshot whenever the seeded data or an API response shape
changes, or the demo will drift.

---

> 📧 **Complete Source Code**: For the complete app source code, please contact [ranjitredekar8@gmail.com](mailto:ranjitredekar8@gmail.com).

---

<div align="center">
<sub>Built with 🛒 for modern, AI-first ecommerce.</sub>
</div>
