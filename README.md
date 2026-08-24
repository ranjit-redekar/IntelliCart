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

Two apps that share one schema and one mock dataset:

| App | What it does | Stack |
|-----|--------------|-------|
| 🌐 **web** | Storefront (`/`) + operator console (`/admin/`) in one deployable | Vite · React · Tailwind v4 · React Router |
| 📱 **mobile** | Native iOS/Android customer app — same data, native UX | Expo SDK 54 · Expo Router · React Native |

```
┌─────────────────────────────────────────────────────┐
│              shared/ (types + helpers)              │
│        mockdata/ (the single source of truth)       │
└──────────────┬───────────────────────┬─────────────┘
               │                       │
     ┌─────────▼─────────┐      ┌──────▼──────┐
     │        web        │      │   mobile    │
     │   /  +  /admin/   │      │             │
     └───────────────────┘      └─────────────┘
```

---

## 🌐 Live demo (GitHub Pages)

The web app is deployed automatically on every push to `main`. No install required — open either entry point and sign in with the [demo accounts](#-demo-accounts) below.

| Surface | URL | Try it |
|---------|-----|--------|
| 🛍️ **Customer portal** | [ranjit-redekar.github.io/IntelliCart](https://ranjit-redekar.github.io/IntelliCart/) | Shop, wishlist, cart, checkout, AI assistant |
| 🛠️ **Admin console** | [ranjit-redekar.github.io/IntelliCart/admin](https://ranjit-redekar.github.io/IntelliCart/admin/) | Dashboard, AI Hub (24 copilots), catalog, orders, settings |

> 📱 **Mobile** runs locally via Expo (`cd mobile && npm start`) — same mock data, native UX.

---

## 🚀 Quick start

```bash
# 1. Install
cd web && npm install && cd ..
cd mobile && npm install && cd ..

# 2. Run
cd web && npm run dev     # → http://localhost:5173/IntelliCart/  (admin at /IntelliCart/admin/)
cd mobile && npm start    # → Expo dev tools (press i / a / w)
```

## 🌍 Deploy

Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds `web/` and publishes to **GitHub Pages**.

One-time repo setup: **Settings → Pages → Source → GitHub Actions**. After that, every merge to `main` updates the live demo at the URLs above. Both entries use `HashRouter`, so deep links work on static hosting without server rewrites.

> No backend required. Both apps read from `mockdata/index.ts` and persist user state to `localStorage` / `AsyncStorage`.

---

## 🔑 Demo accounts

### Admin (`/admin/#/sign-in`)
| Email | Role | Password |
|-------|------|----------|
| `admin@intellicart.shop` | Owner | any 4+ chars |
| `manager@intellicart.shop` | Manager | any 4+ chars |
| `staff@intellicart.shop` | Staff | any 4+ chars |

### Customer portal & mobile (`/sign-in`)
Any email from the mock `customers` list — for example **`alex@example.com`**, **`priya.sharma@example.com`**, **`nora.k@example.com`**. Or create a fresh account via `/sign-up`.

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
├── mockdata/
│   └── index.ts              # Single source of truth — all seed data
└── docs/
    ├── requirements.md
    └── ai-agents-roadmap.md
```

**Sharing model**: schema + mock data are shared. UI components are intentionally per-app — admin uses Tailwind/Lucide, mobile uses React Native primitives + Feather. Each app has its own `mockdata` re-export that casts the raw fixtures to the typed shape from `shared/types.ts`.

---

## 🧪 Tech stack

| Layer | Choice |
|-------|--------|
| Web UI | React 19 + Vite 8 + Tailwind v4 + Lucide icons |
| Web routing | React Router 7 |
| Mobile | Expo SDK 54 + Expo Router 6 + React Native 0.81 |
| Mobile icons | `@expo/vector-icons` (Feather) |
| Mobile storage | `@react-native-async-storage/async-storage` |
| Mock AI | Deterministic intent parsing (`src/lib/ai.ts` per app) |
| Charts (admin) | Recharts |
| Language | TypeScript 6 (strict) |

---

## 📋 Requirements doc

See [`docs/requirements.md`](docs/requirements.md) for the original product brief.

---

> 📧 **Complete Source Code**: For the complete app source code, please contact [ranjitredekar8@gmail.com](mailto:ranjitredekar8@gmail.com).

---

<div align="center">
<sub>Built with 🛒 for modern, AI-first ecommerce.</sub>
</div>
