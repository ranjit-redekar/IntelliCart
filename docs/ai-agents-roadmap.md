# Admin AI Agents — Roadmap & Use Cases

Detailed plan for the next wave of AI agents in the **admin** app. Each agent is described with the business problem, capabilities, data inputs (mapped to existing `mockdata/index.ts`), UI shape, example interactions, build effort, and priority.

---

## Current state (already live)

The admin already ships 8 AI features under `/ai-hub/*` ([admin/src/pages/ai/](../admin/src/pages/ai/)):

| # | Feature | Route |
|---|---------|-------|
| 1 | Sales Copilot | `/ai-hub/sales-copilot` |
| 2 | Product Content Studio | `/ai-hub/content-studio` |
| 3 | Smart Search | `/ai-hub/smart-search` |
| 4 | Support Assistant | `/ai-hub/support-assistant` |
| 5 | Promotion Optimizer | `/ai-hub/promotion-optimizer` |
| 6 | Anomaly Alerts | `/ai-hub/anomaly-alerts` |
| 7 | Review Summarizer | `/ai-hub/review-summarizer` |
| 8 | Forecasting | `/ai-hub/forecasting` |

The agents below are **new** and intentionally non-overlapping with the above.

---

## Priority Tier 1 — build first

These are the highest-ROI additions and form a coherent "what's happening + what should I do" loop on top of the existing dashboard.

### 1. Trend Spotter ⭐ *(user-requested)*

**Problem.** Admin can see today's revenue but not *which products are rising, which are cooling, and why.* Forecasting predicts future demand and Anomaly Alerts flags spikes — neither explains the underlying patterns.

**Capabilities.**
- Ranks SKUs by 7 / 30 / 90-day growth rate and decline rate (rolling windows).
- Detects **emerging products** (low base, fast acceleration) vs **proven winners** (high base, sustained growth).
- Detects **cooling products** before they become anomalies.
- Breaks each trend down by:
  - Category (Fashion / Electronics / Home)
  - Customer segment (new vs repeat, VIP vs casual)
  - Order channel / region (when available)
  - Price band
- Surfaces **driver hypotheses**: "Sneakers +38% week-over-week — concentrated in repeat customers; correlates with the May promo banner."
- Detects seasonality (day-of-week, monthly patterns).
- Flags **view → add-to-cart → purchase** funnel shifts (when view data exists).

**Data inputs.** `products`, `orders`, `customers` from `mockdata/index.ts`. Derived: per-SKU order counts and revenue over rolling windows.

**UI shape.**
- Two columns: **Heating up** (green chips) and **Cooling down** (amber/red chips).
- Each row: SKU name, % change, sparkline, one-line driver explanation, "Investigate" button.
- Header filter: time window (7d / 30d / 90d), category, segment.
- Below: a generated narrative paragraph — "This week, Electronics is leading with..." — written by the LLM from the aggregated stats.

**Example prompts.**
- "Why are Home goods cooling?"
- "Show me products gaining traction with first-time buyers."
- "Which Fashion SKUs are losing momentum vs last month?"

**Route.** `/ai-hub/trend-spotter`
**Effort.** M (aggregation logic + new page + LLM narrative)
**Why first.** Directly requested. High visibility on the home dashboard. Reuses data the Forecasting/Anomaly pages already aggregate.

---

### 2. Daily Briefing

**Problem.** Admin opens the dashboard and has to interpret 6 metric tiles, 3 charts, and several alerts to know what matters today.

**Capabilities.**
- Single paragraph at the top of the dashboard, regenerated daily.
- Pattern: *"Yesterday: revenue $X (+Y% vs 7-day avg). Biggest mover: SKU Z. One thing to watch: refund rate ticked up in Electronics. Recommended action: review the Anomaly Alerts queue."*
- "Read more" expands into a structured digest: revenue vs plan, top mover, top concern, top opportunity, suggested action.
- Optional: email/push delivery (future).

**Data inputs.** All dashboard metrics + outputs of Trend Spotter + Anomaly Alerts.

**UI shape.** Banner card at top of `DashboardPage.tsx` with a "Refresh" and "Expand" affordance. Re-uses the existing `AiInsights` component pattern.

**Route.** Embedded on `/` (Dashboard), not a separate page.
**Effort.** S (composes outputs from other agents).
**Why early.** Highest *daily* utility per line of code — admin sees it every login.

---

### 3. Inventory & Reorder Agent

**Problem.** `products[].stock` is visible but the admin has to mentally combine it with sell-through rate to know what's about to stock out. Equally, slow-movers tying up cash are invisible.

**Capabilities.**
- Per-SKU **days-of-cover** = stock ÷ daily sales velocity.
- **Stockout risk** badge: critical (<7d), warning (<14d), healthy.
- Drafts a **reorder list** with quantity = projected demand × lead-time buffer.
- **Dead stock** list: SKUs with >60 days of cover and declining trend → suggest markdown.
- Exportable as CSV / draft PO.

**Data inputs.** `products`, `orders`. Configurable lead-time per category (settings).

**UI shape.** Two tables — "Reorder now" and "Slow-movers" — each with a "Draft PO" / "Suggest markdown" action.

**Route.** `/ai-hub/inventory-agent`
**Effort.** M
**Why.** Direct revenue protection (lost sales) and cash recovery (dead stock).

---

## Priority Tier 2 — high impact, slightly more scope

### 4. Customer Segmentation & Cohort Agent

**Problem.** `customers[].orders` count is the only segmentation signal today. There's no view of *who* the valuable, at-risk, or churned customers are.

**Capabilities.**
- Auto-clusters customers into named segments:
  - **VIPs** (top 10% by LTV)
  - **Loyal regulars**
  - **At risk** (declining cadence)
  - **One-and-done**
  - **Churned** (no purchase in N days)
  - **Deal hunters** (only purchase during promotions)
- Per segment: size, total revenue, AOV, top SKUs, recommended action.
- LLM-generated narrative per segment: "Your VIPs skew toward Electronics and respond to early-access offers."
- Click into any segment to see the member list.

**Data inputs.** `customers`, `orders` (joined on `customerName`).

**UI shape.** Grid of segment cards (count, revenue, trend), click-through to member table.

**Route.** `/ai-hub/segments`
**Effort.** M-L
**Why.** Unlocks every targeted-marketing use case downstream.

---

### 5. Churn & Win-back Agent

**Problem.** No system today to flag customers slipping away or to act on them.

**Capabilities.**
- Scores each customer's churn risk from purchase cadence drift.
- Ranks "Top 50 at-risk customers" with reason: *"Bought every 24 days for 6 months; now 51 days since last order."*
- Drafts a **personalized win-back message** per customer using their past category preference.
- One-click "Send" (stub) or "Add to campaign list".

**Data inputs.** `customers`, `orders`. Pairs with Segmentation Agent.

**UI shape.** Ranked list with drawer for each customer showing history + drafted email.

**Route.** `/ai-hub/win-back`
**Effort.** M
**Why.** Retention spend is ~5× cheaper than acquisition; this turns invisible drift into action.

---

### 6. Bundle & Cross-sell Miner

**Problem.** No data-driven way to propose product bundles or "frequently bought together" widgets.

**Capabilities.**
- Mines co-purchase patterns (lift, confidence) from order history.
- Proposes top 10 candidate bundles with: SKUs, projected attach rate, suggested bundle price, projected lift.
- LLM writes the bundle landing-page copy.
- "Publish to storefront" stub.

**Data inputs.** `orders` with line-item data (extend mockdata if needed).

**UI shape.** Table of proposed bundles → drawer with rationale + generated marketing copy.

**Route.** `/ai-hub/bundles`
**Effort.** M (requires line-item-level mock data)

---

### 7. Pricing Agent

**Problem.** Pricing decisions are gut-feel today.

**Capabilities.**
- Per-SKU price recommendation from views → add-to-cart → conversion trends at historical prices.
- Estimates elasticity band per SKU.
- Flags SKUs where a small price *increase* likely wouldn't hurt conversion (margin opportunity) and SKUs where a small *decrease* could unlock volume.
- Guardrails: minimum margin floor (configurable).
- "Apply price" action with a rollback window.

**Data inputs.** `products` + historical price/conversion data (extend mockdata).

**UI shape.** Table — current price, recommended price, expected revenue delta, confidence.

**Route.** `/ai-hub/pricing`
**Effort.** L (needs richer mock data + careful guardrails)

---

### 8. Return Reason Analyzer

**Problem.** Returns are tracked as a percentage in the dashboard but the *why* is buried in free-text fields.

**Capabilities.**
- Clusters return reasons per SKU (sizing, quality, "not as described", shipping damage).
- Surfaces top 10 SKUs by return rate with the dominant reason.
- Routes findings: sizing issues → merchandising; quality defects → vendor; damage → ops/logistics.
- Suggests listing fixes when "not as described" dominates.

**Data inputs.** Extended `orders` with return records and reason text.

**UI shape.** Per-SKU breakdown + heatmap of reason × category.

**Route.** `/ai-hub/returns-analyzer`
**Effort.** M

---

## Priority Tier 3 — nice-to-have, build later

### 9. Cart Abandonment Analyst
Clusters *why* carts get abandoned (shipping cost shock at checkout, payment failure, price reconsider). Drafts recovery email sequences per cluster. **Route:** `/ai-hub/cart-recovery` · **Effort:** M.

### 10. Product Health Score
Per SKU, fuses reviews + returns + support tickets + conversion into a single **Health Score (0-100)** with a ranked fix-list. Pairs with the existing Review Summarizer. **Route:** `/ai-hub/product-health` · **Effort:** M.

### 11. Fraud & Risk Triage
Scores risky orders (velocity, address/IP mismatch, refund-abuser history) with LLM-written rationale so admins can approve/hold in one click. **Route:** `/ai-hub/risk` · **Effort:** L (needs richer order metadata).

### 12. Catalog Auditor
Scans listings for: missing fields, weak titles (<5 words), duplicate descriptions, broken image URLs, missing translations, low-quality images. Outputs a prioritized punch list. **Route:** `/ai-hub/catalog-audit` · **Effort:** S-M.

### 13. Vendor / Supplier Scorecard
Tracks per-supplier on-time delivery, defect rate, average lead time. LLM summarizes trends and recommends reallocation. **Route:** `/ai-hub/vendors` · **Effort:** M (needs supplier mock data).

### 14. Localization Agent
Bulk-translates listings + adapts unit/currency formatting per region. **Route:** `/ai-hub/localization` · **Effort:** M.

### 15. Marketing Campaign Generator
Given a segment (from #4) or trend (from #1), drafts email + push + banner copy + landing-page hero. Hands off to Promotion Optimizer for the offer math. **Route:** `/ai-hub/campaigns` · **Effort:** M.

### 16. Logistics / Delivery Agent
Flags slow shipping lanes, late shipments, recommends carrier swaps. **Route:** `/ai-hub/logistics` · **Effort:** L.

---

## Cross-cutting concerns

**LLM hosting.** The `mock-ai.ts` file currently fakes responses. To go live, route real LLM calls through a small server (Vite dev middleware or a Vercel/Netlify function) so the `ANTHROPIC_API_KEY` is never shipped to the browser.

**Shared data layer.** Tier 1 agents all need rolling-window aggregation over `orders`. Build it once in `admin/src/lib/analytics.ts` and reuse across Trend Spotter, Inventory, Daily Briefing, Forecasting, and Anomaly Alerts.

**Mock data gaps.** Several Tier 2/3 agents need richer mock data:
- Order line items (Bundles, Inventory velocity by SKU)
- Return records with reason text (Return Analyzer)
- Price history (Pricing Agent)
- Supplier records (Vendor Scorecard)
- Cart events (Cart Abandonment)

Extending `mockdata/index.ts` once unblocks several agents at a time.

**Consistent UX pattern.** All new agents should follow the existing `AiFeatureLayout` shell so the AI Hub stays visually consistent.

---

## Suggested build order

1. **Trend Spotter** (user-requested, high-visibility)
2. **Daily Briefing** (cheap, composes #1's output)
3. **Inventory & Reorder Agent** (direct revenue protection)
4. Extend mockdata with line items + returns
5. **Customer Segmentation** → **Win-back** → **Bundle Miner** (compounding retention/AOV stack)
6. Tier 3 as bandwidth allows

---

## Open questions for the user

- Are we wiring a real LLM (Claude API) now, or staying with mocked responses like `mock-ai.ts` for a few more iterations?
- Do you want the new agents to live in the existing `/ai-hub` page grid, or grouped into sections (Analytics / Operations / Customer / Catalog)?
- For Trend Spotter, what's the **default time window** — 7d, 30d, or both side-by-side?
