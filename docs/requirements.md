# Ecommerce Admin + Mobile Requirements

## Project Structure Requirements

- Keep `admin` and `mobile` as independent apps.
- Do not share application code between `admin` and `mobile`.
- Keep common mock dataset as one source of truth in `/mockdata/index.ts`.
- Both apps must consume the same mock values from the shared root mockdata file.

## Technology Requirements

### Admin (Web)

- Framework: Vite + React + TypeScript.
- UI: Tailwind CSS.
- App type: Modern ecommerce admin template.

### Mobile

- Framework: Expo React Native + TypeScript.
- App type: Ecommerce customer-facing app.

## Functional Requirements

### Admin Template Screens (Mock Data First)

- Dashboard
- Products
- Orders
- Customers
- Settings

### Mobile Screens (Mock Data First)

- Home
- Search
- Cart
- Profile
- Additional planned screens: Auth, Product Details, Checkout, Orders, Addresses

## Delivery Process Requirements

- Build all screens with mock data first in each phase.
- API integration comes after UI and flow validation.
- Keep data contracts stable during mock-first development.

## Mock Data Requirements

Single shared dataset must include:

- `metrics`
- `categories`
- `products`
- `orders`
- `customers`
- `cartItems`

Current source:

- `/Users/ranjitredekar/Project/Ranjit/ecommerce/mockdata/index.ts`

## Current Integration Paths

- Admin bridge: `/Users/ranjitredekar/Project/Ranjit/ecommerce/admin/src/mockdata.ts`
- Mobile bridge: `/Users/ranjitredekar/Project/Ranjit/ecommerce/mobile/src/mockdata/index.ts`

## Run Instructions

### Admin

```bash
cd /Users/ranjitredekar/Project/Ranjit/ecommerce/admin
npm run dev
```

### Mobile

```bash
cd /Users/ranjitredekar/Project/Ranjit/ecommerce/mobile
npm start
```

## AI UI Routes (Mock Data)

- `/ai-hub`
- `/ai-hub/sales-copilot`
- `/ai-hub/content-studio`
- `/ai-hub/smart-search`
- `/ai-hub/support-assistant`
- `/ai-hub/promotion-optimizer`
- `/ai-hub/anomaly-alerts`
- `/ai-hub/review-summarizer`
- `/ai-hub/forecasting`
