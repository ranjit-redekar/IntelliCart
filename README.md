<div align="center">

# 🛒 IntelliCart

**The AI-first ecommerce platform — every workflow starts with AI, across three apps.**

<sub>⌘K to ask anywhere in admin · AI shopping concierge on web & mobile · auto-drafted replies · live insights</sub>

[Admin Console](#-admin) · [Customer Portal](#-customer-portal) · [Mobile App](#-mobile-app)

![Stack](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000?logo=expo&logoColor=white)

</div>

---

## ✨ What's inside

Three independent apps that share one schema and one mock dataset:

| App | What it does | Stack |
|-----|--------------|-------|
| 🛠️ **admin** | Operator console — catalog, orders, customers, feedback, promotions, hero slides, AI tools | Vite · React · Tailwind v4 · React Router |
| 🛍️ **customer-web** | Storefront — browse, search, cart, checkout, account, reviews, AI shopping assistant | Vite · React · Tailwind v4 · React Router |
| 📱 **mobile** | Native iOS/Android customer app — same data, native UX | Expo SDK 54 · Expo Router · React Native |

```
┌─────────────────────────────────────────────────────┐
│              shared/ (types + helpers)              │
│        mockdata/ (the single source of truth)       │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
       ┌───▼───┐     ┌────▼─────┐    ┌───▼────┐
       │ admin │     │ customer │    │ mobile │
       │       │     │   -web   │    │        │
       └───────┘     └──────────┘    └────────┘
```

---

## 📸 Screenshots

> Drop captured screenshots into `docs/screenshots/` using the filenames below and they'll render here automatically. See [capture instructions](#-adding-screenshots) at the bottom.

### 🛠️ Admin

<table>
<tr>
<td width="50%"><img src="docs/screenshots/admin-dashboard.png" alt="Admin dashboard"/><br/><sub><b>Dashboard</b> — revenue, orders, AOV, conversion</sub></td>
<td width="50%"><img src="docs/screenshots/admin-products.png" alt="Admin products"/><br/><sub><b>Products</b> — catalog grid + list view</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/admin-new-product.png" alt="New product"/><br/><sub><b>Add product</b> — media uploader, custom fields, AI drafting</sub></td>
<td><img src="docs/screenshots/admin-orders.png" alt="Orders"/><br/><sub><b>Orders</b> — fulfillment pipeline</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/admin-feedback.png" alt="Feedback"/><br/><sub><b>Feedback inbox</b> — reviews with AI reply drafting</sub></td>
<td><img src="docs/screenshots/admin-promotions.png" alt="Promotions"/><br/><sub><b>Promotions</b> — manage offers across surfaces</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/admin-slides.png" alt="Hero slides"/><br/><sub><b>Hero slides</b> — carousel slides with live preview</sub></td>
<td><img src="docs/screenshots/admin-signin.png" alt="Sign in"/><br/><sub><b>Sign in</b> — role-based demo accounts</sub></td>
</tr>
</table>

### 🛍️ Customer Portal

<table>
<tr>
<td width="50%"><img src="docs/screenshots/web-home.png" alt="Home"/><br/><sub><b>Home</b> — hero slider, categories, featured products</sub></td>
<td width="50%"><img src="docs/screenshots/web-shop.png" alt="Shop"/><br/><sub><b>Shop</b> — AI-powered smart search</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/web-product.png" alt="Product detail"/><br/><sub><b>Product detail</b> — gallery, offers, specs, AI Q&A</sub></td>
<td><img src="docs/screenshots/web-cart.png" alt="Cart"/><br/><sub><b>Cart & checkout</b> — 3-step flow</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/web-account.png" alt="Account"/><br/><sub><b>Account</b> — orders, addresses, reviews</sub></td>
<td><img src="docs/screenshots/web-ai-assistant.png" alt="AI assistant"/><br/><sub><b>AI shopping assistant</b> — floating chat widget</sub></td>
</tr>
</table>

### 📱 Mobile App

<table>
<tr>
<td width="33%"><img src="docs/screenshots/mobile-home.png" alt="Mobile home"/><br/><sub><b>Shop</b> — hero carousel + categories</sub></td>
<td width="33%"><img src="docs/screenshots/mobile-product.png" alt="Mobile product"/><br/><sub><b>Product detail</b> — image carousel, specs, offers</sub></td>
<td width="33%"><img src="docs/screenshots/mobile-cart.png" alt="Mobile cart"/><br/><sub><b>Cart</b> — full checkout flow</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/mobile-account.png" alt="Mobile account"/><br/><sub><b>Account</b> — orders, reviews, stats</sub></td>
<td><img src="docs/screenshots/mobile-ai.png" alt="Mobile AI"/><br/><sub><b>AI assistant</b> — full-screen chat</sub></td>
<td><img src="docs/screenshots/mobile-search.png" alt="Mobile search"/><br/><sub><b>Search</b> — with AI shortcut</sub></td>
</tr>
</table>

---

## 🚀 Quick start

```bash
# 1. Install all three apps
cd admin && npm install && cd ..
cd customer-web && npm install && cd ..
cd mobile && npm install && cd ..

# 2. Run each one in its own terminal
cd admin && npm run dev          # → http://localhost:5173
cd customer-web && npm run dev   # → http://localhost:5174
cd mobile && npm start           # → Expo dev tools (press i / a / w)
```

> No backend required. All three apps read from `mockdata/index.ts` and persist user state to `localStorage` / `AsyncStorage`.

---

## 🔑 Demo accounts

### Admin (`/sign-in`)
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

- **Dashboard** — revenue, AOV, conversion, top products with sparklines
- **Products** — grid + list views, multi-image uploader, custom specs, highlights, tags, AI copywriter
- **Orders** — pipeline view, detail with line items + tracking timeline
- **Customers** — segmentation, lifetime value, per-customer history & reviews left
- **Feedback** — review inbox, AI-drafted replies, sentiment filtering
- **Promotions** — manage offers per surface (web / mobile / both), live previews
- **Hero slides** — carousel content with reorder + theme + live previews for each surface
- **AI Hub** — eight AI helpers (sales copilot, content studio, smart search, support, etc.)
- **Auth** — role-based mock accounts (Owner / Manager / Staff)

</details>

<details>
<summary><b>🛍️ Customer Portal</b></summary>

- **Home** — hero slider (managed from admin), featured + top-rated products
- **Shop** — AI-powered smart search ("top-rated home goods under $80")
- **Product detail** — multi-image gallery, applicable offers, highlights, spec table, AI Q&A, reviews
- **Cart & checkout** — 3-step flow with order confirmation
- **Account** — orders, addresses, reviews left, profile
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
├── admin/                    # Vite + React + TS (operator console)
├── customer-web/             # Vite + React + TS (storefront)
├── mobile/                   # Expo + React Native (customer app)
├── shared/
│   ├── types.ts              # Domain types (Product, Order, Feedback, …)
│   └── productExtras.ts      # Helper for product enrichment fallback
├── mockdata/
│   └── index.ts              # Single source of truth — all seed data
└── docs/
    ├── requirements.md
    └── screenshots/          # Drop screenshots here
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

## 📷 Adding screenshots

The README expects screenshots in `docs/screenshots/` with specific filenames. To capture them:

1. Start the relevant dev server (`npm run dev` for web, `npm start` for mobile).
2. Take a screenshot — macOS `⇧⌘4` for a region, or use your browser's dev tools device toolbar for mobile-sized captures.
3. Save with the matching filename listed below into `docs/screenshots/`.

<details>
<summary><b>Filename list (click to expand)</b></summary>

```
admin-dashboard.png            web-home.png             mobile-home.png
admin-products.png             web-shop.png             mobile-product.png
admin-new-product.png          web-product.png          mobile-cart.png
admin-orders.png               web-cart.png             mobile-account.png
admin-feedback.png             web-account.png          mobile-ai.png
admin-promotions.png           web-ai-assistant.png     mobile-search.png
admin-slides.png
admin-signin.png
```

</details>

> **Tip**: For mobile, capture at iPhone 14/15 dimensions (393 × 852) using the Expo Go app or iOS Simulator. PNG at ~80% quality is plenty for the README.

---

## 📋 Requirements doc

See [`docs/requirements.md`](docs/requirements.md) for the original product brief.

---

<div align="center">
<sub>Built with 🛒 for modern, AI-first ecommerce.</sub>
</div>
