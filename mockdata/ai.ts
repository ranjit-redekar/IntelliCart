export const aiCopilotChats = [
  { role: "user", text: "Why did conversion drop this week?" },
  { role: "assistant", text: "Conversion is down 0.4% mainly from mobile checkout abandonment (+9%). Suggested actions: simplify payment step, add express checkout, retarget dropped carts." }
] as const;

export const aiContentDrafts = [
  { sku: "P-1001", title: "Minimal Backpack for Everyday Commute", tone: "Premium", seo: "minimal backpack, urban carry, lightweight" },
  { sku: "P-1002", title: "Smart Watch with Health Tracking", tone: "Confident", seo: "fitness smartwatch, heart rate monitor" }
] as const;

export const aiSearchSamples = [
  "show delayed orders above $200 from last 3 days",
  "customers with more than 5 orders in fashion",
  "products with low stock and high rating"
] as const;

export const aiSupportDrafts = [
  { ticket: "TK-201", intent: "Refund request", draft: "I understand the delay. I have initiated your refund and it will reflect within 5-7 business days." },
  { ticket: "TK-202", intent: "Where is my order", draft: "Your order left our warehouse and is in transit. Expected delivery is tomorrow by 8 PM." }
] as const;

export const aiPromoIdeas = [
  { campaign: "Weekend Boost", segment: "Returning customers", suggestion: "12% off + free shipping", uplift: "+8.4%" },
  { campaign: "Cart Rescue", segment: "Abandoned cart users", suggestion: "10% off for 24 hours", uplift: "+11.2%" }
] as const;

export const aiAnomalies = [
  { metric: "Refund Rate", change: "+18%", reason: "Size mismatch in top 2 apparel SKUs" },
  { metric: "Payment Failures", change: "+12%", reason: "Higher UPI timeout between 7-9 PM" }
] as const;

export const aiReviewSummary = [
  { product: "Minimal Backpack", pros: "Design, comfort, premium finish", cons: "Limited inner pockets" },
  { product: "Smart Watch", pros: "Accurate tracking, battery life", cons: "Setup flow complexity" }
] as const;

export const aiForecasts = [
  { sku: "P-1001", demandNext30Days: 180, stock: 48, risk: "Stockout risk" },
  { sku: "P-1003", demandNext30Days: 72, stock: 62, risk: "Monitor closely" }
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// New agents (UI mock data only — replace with live signals during integration)
// ─────────────────────────────────────────────────────────────────────────────

export const aiTrendSpotter = {
  narrative:
    "Electronics is leading this week with Wireless Earbuds and Noise-Canceling Headphones both accelerating among repeat customers. Home is cooling, driven by a slowdown in Linen Throw and Ceramic Lamp — likely a seasonal shift away from cozy categories. Fashion is mixed: Linen Field Jacket is gaining first-time buyers, while Wool Beanie is rolling off as expected.",
  heating: [
    { sku: "P-1005", name: "Wireless Earbuds", change: "+38%", series: [12, 14, 13, 18, 22, 28, 35], driver: "Repeat customers · concentrated in Tier-1 cities" },
    { sku: "P-1017", name: "Noise-Canceling Headphones", change: "+24%", series: [9, 10, 11, 14, 16, 19, 22], driver: "Spike after the May banner push" },
    { sku: "P-1007", name: "Linen Field Jacket", change: "+19%", series: [4, 5, 6, 6, 8, 9, 11], driver: "Gaining first-time buyers — strong on weekends" },
    { sku: "P-1014", name: "Portable SSD 1TB", change: "+14%", series: [6, 7, 8, 9, 10, 11, 12], driver: "Cross-sell pull from Mechanical Keyboard" },
  ],
  cooling: [
    { sku: "P-1006", name: "Linen Throw", change: "-22%", series: [22, 20, 19, 17, 15, 13, 12], driver: "Seasonal — exits cozy-category window" },
    { sku: "P-1003", name: "Ceramic Lamp", change: "-16%", series: [18, 18, 16, 15, 14, 13, 12], driver: "View → cart ratio dropping" },
    { sku: "P-1010", name: "Wool Beanie", change: "-31%", series: [25, 22, 19, 16, 13, 11, 9], driver: "Expected end-of-winter falloff" },
  ],
} as const;

export const aiDailyBriefing = {
  date: "Today · 09:00",
  summary:
    "Revenue $48.2k yesterday (+12.4% vs 7-day avg). Biggest mover: Wireless Earbuds (+38%). Watch refund rate in Electronics — ticked up 1.8 pts. Recommended action: review the 2 open Anomaly Alerts before noon.",
  highlights: [
    { label: "Revenue vs plan", value: "$48,290", change: "+12.4%", tone: "mint" },
    { label: "Top mover", value: "Wireless Earbuds", change: "+38%", tone: "violet" },
    { label: "Top concern", value: "Refund rate (Electronics)", change: "+1.8pp", tone: "rose" },
    { label: "One action", value: "Triage Anomaly Alerts queue", change: "2 open", tone: "amber" },
  ],
  agenda: [
    "Confirm restock for 3 stockout-risk SKUs",
    "Approve Weekend Boost promotion (predicted +8.4%)",
    "Review 5 high-value at-risk customers",
  ],
} as const;

export const aiInventoryReorder = {
  reorder: [
    { sku: "P-1011", name: "4K Action Camera", stock: 12, velocity: 2.4, daysCover: 5, suggestQty: 80, severity: "critical" },
    { sku: "P-1022", name: "Cashmere Scarf", stock: 19, velocity: 1.8, daysCover: 11, suggestQty: 60, severity: "warning" },
    { sku: "P-1005", name: "Wireless Earbuds", stock: 22, velocity: 2.1, daysCover: 10, suggestQty: 100, severity: "warning" },
    { sku: "P-1021", name: "Aroma Diffuser", stock: 23, velocity: 1.6, daysCover: 14, suggestQty: 50, severity: "warning" },
  ],
  slowMovers: [
    { sku: "P-1020", name: "Smart Bulb 4-Pack", stock: 152, velocity: 0.4, daysCover: 380, suggestion: "Mark down 15%" },
    { sku: "P-1010", name: "Wool Beanie", stock: 134, velocity: 0.5, daysCover: 268, suggestion: "Bundle with jacket" },
    { sku: "P-1013", name: "Leather Card Holder", stock: 110, velocity: 0.6, daysCover: 183, suggestion: "Add to gift bundle" },
  ],
} as const;

export const aiSegments = [
  { id: "vip", name: "VIPs", count: 42, revenueShare: "31%", aov: "$248", desc: "Top 10% by lifetime value. Skew toward Electronics; respond to early-access offers." },
  { id: "loyal", name: "Loyal regulars", count: 186, revenueShare: "37%", aov: "$142", desc: "Steady cadence, broad category mix. Reward with multi-category bundles." },
  { id: "at-risk", name: "At risk", count: 78, revenueShare: "9%", aov: "$118", desc: "Cadence slipping vs their 90-day baseline. Personalized win-back works best." },
  { id: "one-done", name: "One-and-done", count: 314, revenueShare: "11%", aov: "$74", desc: "Bought once, never returned. Second-purchase nudge with category cross-sell." },
  { id: "churned", name: "Churned", count: 122, revenueShare: "4%", aov: "$96", desc: "No purchase in 120+ days. Hard win-back — reserve heavy discounts." },
  { id: "dealers", name: "Deal hunters", count: 96, revenueShare: "8%", aov: "$58", desc: "Only purchase during promotions. Exclude from full-price campaigns." },
] as const;

export const aiWinBack = [
  { id: "C-04", name: "Priya Sharma", lastOrder: "51d ago", baseline: "every 24d", risk: 92, draft: "Hi Priya — we noticed your favorite Cashmere Scarf is back in stock in two new colors. Here's 15% off, just for you." },
  { id: "C-06", name: "Sofia Marino", lastOrder: "47d ago", baseline: "every 18d", risk: 86, draft: "Hi Sofia — your Home essentials picks just got refreshed. Save 12% on your next order this week." },
  { id: "C-10", name: "Daniel Cho", lastOrder: "39d ago", baseline: "every 16d", risk: 78, draft: "Hi Daniel — the Mechanical Keyboard you viewed pairs perfectly with our new Portable SSD. Take 10% off the bundle." },
  { id: "C-03", name: "Jordan Miles", lastOrder: "34d ago", baseline: "every 14d", risk: 71, draft: "Hi Jordan — we miss you. Here's free shipping on your next order, no minimum." },
] as const;

export const aiBundles = [
  { id: "B1", items: ["Mechanical Keyboard", "Portable SSD 1TB"], lift: "+18%", attach: "27%", price: "$269", rationale: "67% of keyboard buyers add an SSD within 14 days. Bundle removes the second-trip friction." },
  { id: "B2", items: ["Minimal Backpack", "Leather Card Holder"], lift: "+12%", attach: "21%", price: "$169", rationale: "Strong everyday-carry co-purchase pattern. Anchor backpack drives the bundle visibility." },
  { id: "B3", items: ["Ceramic Lamp", "Aroma Diffuser", "Linen Throw"], lift: "+22%", attach: "14%", price: "$199", rationale: "Cozy-evening bundle. Lifts the cooling Linen Throw without a deep discount." },
  { id: "B4", items: ["Wireless Earbuds", "Smart Watch"], lift: "+16%", attach: "19%", price: "$329", rationale: "Fitness pairing — strong with the 'workout' search cohort." },
] as const;

export const aiPricing = [
  { sku: "P-1005", name: "Wireless Earbuds", current: "$149", recommended: "$159", deltaRev: "+$3,840/mo", confidence: "High", action: "increase" },
  { sku: "P-1023", name: "Bluetooth Speaker", current: "$99", recommended: "$94", deltaRev: "+$1,210/mo", confidence: "Medium", action: "decrease" },
  { sku: "P-1017", name: "Noise-Canceling Headphones", current: "$289", recommended: "$299", deltaRev: "+$2,420/mo", confidence: "High", action: "increase" },
  { sku: "P-1020", name: "Smart Bulb 4-Pack", current: "$49", recommended: "$42", deltaRev: "+$890/mo", confidence: "Medium", action: "decrease" },
] as const;

export const aiReturns = [
  { sku: "P-1004", name: "Oversized Tee", rate: "11.2%", topReason: "Sizing runs small", action: "Update size chart · flag for merchandising" },
  { sku: "P-1019", name: "Pleated Trousers", rate: "9.6%", topReason: "Color mismatch with listing", action: "Replace product photography" },
  { sku: "P-1024", name: "Hand-Blown Glass Vase", rate: "8.4%", topReason: "Shipping damage", action: "Switch to molded packaging · ops" },
  { sku: "P-1011", name: "4K Action Camera", rate: "6.1%", topReason: "Missing accessory in box", action: "Audit fulfillment kitting · vendor" },
] as const;

export const aiCartRecovery = {
  clusters: [
    { reason: "Shipping cost shock at checkout", share: "38%", suggestion: "Threshold-based free shipping nudge" },
    { reason: "Payment method failure (UPI 7-9pm)", share: "22%", suggestion: "Fallback to wallet, alert payments team" },
    { reason: "Price reconsider after coupon expiry", share: "18%", suggestion: "Auto-extend coupon window for high-LTV carts" },
    { reason: "Forgot / distracted (24h+)", share: "22%", suggestion: "Multi-channel recovery sequence (email + push)" },
  ],
  drafts: [
    { stage: "Hour 1", channel: "Email", text: "Still thinking it over? Your Minimal Backpack is waiting. Complete checkout in one tap." },
    { stage: "Hour 24", channel: "Push", text: "Your cart misses you. Free shipping if you check out today." },
    { stage: "Day 3", channel: "Email", text: "Last chance: 10% off your cart for the next 6 hours." },
  ],
} as const;

export const aiProductHealth = [
  { sku: "P-1011", name: "4K Action Camera", score: 62, signals: { reviews: "Battery life concerns", returns: "Missing accessory", support: "Setup questions trending up" } },
  { sku: "P-1002", name: "Smart Watch", score: 78, signals: { reviews: "Setup complexity", returns: "Low", support: "Pairing issues with older phones" } },
  { sku: "P-1004", name: "Oversized Tee", score: 71, signals: { reviews: "Sizing runs small", returns: "11.2%", support: "Size exchange requests" } },
  { sku: "P-1017", name: "Noise-Canceling Headphones", score: 91, signals: { reviews: "Strong on ANC, fit", returns: "Low", support: "Quiet — minimal tickets" } },
] as const;

export const aiRiskOrders = [
  { id: "ORD-8921", customer: "Theo Bauer", total: "$728", flags: ["High AOV first order", "Shipping ≠ billing country", "New device fingerprint"], score: 84 },
  { id: "ORD-8915", customer: "Aisha Bello", total: "$542", flags: ["3 orders in 2 hours", "Discount-stacking attempt"], score: 71 },
  { id: "ORD-8910", customer: "Daniel Cho", total: "$449", flags: ["Refund-rate >30% on this account"], score: 64 },
] as const;

export const aiCatalogAudit = [
  { sku: "P-1010", name: "Wool Beanie", issues: ["Title under 5 words", "Missing material spec", "No alt text on 2 images"] },
  { sku: "P-1003", name: "Ceramic Lamp", issues: ["Duplicate description (3 SKUs)", "Missing dimensions"] },
  { sku: "P-1020", name: "Smart Bulb 4-Pack", issues: ["Low-resolution hero image", "Missing wattage spec"] },
  { sku: "P-1013", name: "Leather Card Holder", issues: ["No translations for ES/FR/DE"] },
] as const;

export const aiVendors = [
  { id: "V-01", name: "Northwind Apparel", category: "Fashion", onTime: "94%", defect: "1.2%", lead: "12d", trend: "stable" },
  { id: "V-02", name: "Volt Electronics", category: "Electronics", onTime: "88%", defect: "2.4%", lead: "18d", trend: "declining" },
  { id: "V-03", name: "Hearth & Hand", category: "Home", onTime: "97%", defect: "0.8%", lead: "9d", trend: "improving" },
  { id: "V-04", name: "Atlas Audio", category: "Electronics", onTime: "91%", defect: "1.6%", lead: "14d", trend: "stable" },
] as const;

export const aiLocalization = [
  { sku: "P-1001", name: "Minimal Backpack", langs: { en: "done", es: "done", fr: "pending", de: "missing", ja: "missing" } },
  { sku: "P-1002", name: "Smart Watch", langs: { en: "done", es: "done", fr: "done", de: "pending", ja: "missing" } },
  { sku: "P-1017", name: "Noise-Canceling Headphones", langs: { en: "done", es: "pending", fr: "missing", de: "missing", ja: "missing" } },
] as const;

export const aiCampaigns = [
  { id: "CMP-01", target: "VIPs", channel: "Email + Push", subject: "Early access: the new Linen Field Jacket", body: "As one of our VIPs, you get first pick before public release. Tap to shop the drop." },
  { id: "CMP-02", target: "At-risk", channel: "Email", subject: "We saved your favorites", body: "Your top picks are back in stock. Plus, 12% off your next order — only this week." },
  { id: "CMP-03", target: "One-and-done", channel: "Push", subject: "Round out your set", body: "You loved your first pick. Here's what pairs perfectly — with free shipping on us." },
] as const;

export const aiLogistics = [
  { lane: "Mumbai → Bangalore", carrier: "Bluedart", onTime: "86%", avgDays: 2.4, suggestion: "Hold steady" },
  { lane: "Delhi → Kolkata", carrier: "Delhivery", onTime: "71%", avgDays: 4.1, suggestion: "Trial alternate carrier for this lane" },
  { lane: "Chennai → Hyderabad", carrier: "DTDC", onTime: "92%", avgDays: 1.8, suggestion: "Expand share in this lane" },
  { lane: "Pune → Ahmedabad", carrier: "Bluedart", onTime: "78%", avgDays: 3.2, suggestion: "Monitor — slipping vs last month" },
] as const;

/**
 * Route slug -> content shape.
 *
 * The seeder writes each of these into the `ai_content` table, so the admin
 * screens read them back from Postgres like everything else. The frontend
 * imports this map with `import type`, which TypeScript erases — the fixture
 * bodies never reach the browser bundle.
 */
export type AiContentMap = {
  "sales-copilot": typeof aiCopilotChats;
  "content-studio": typeof aiContentDrafts;
  "smart-search": typeof aiSearchSamples;
  "support-assistant": typeof aiSupportDrafts;
  "promotion-optimizer": typeof aiPromoIdeas;
  "anomaly-alerts": typeof aiAnomalies;
  "review-summarizer": typeof aiReviewSummary;
  "forecasting": typeof aiForecasts;
  "trend-spotter": typeof aiTrendSpotter;
  "daily-briefing": typeof aiDailyBriefing;
  "inventory-agent": typeof aiInventoryReorder;
  "segments": typeof aiSegments;
  "win-back": typeof aiWinBack;
  "bundles": typeof aiBundles;
  "pricing": typeof aiPricing;
  "returns-analyzer": typeof aiReturns;
  "cart-recovery": typeof aiCartRecovery;
  "product-health": typeof aiProductHealth;
  "risk": typeof aiRiskOrders;
  "catalog-audit": typeof aiCatalogAudit;
  "vendors": typeof aiVendors;
  "localization-agent": typeof aiLocalization;
  "campaigns": typeof aiCampaigns;
  "logistics": typeof aiLogistics;
};

export type AiCopilot = keyof AiContentMap;

/** Slug -> the exported const, for the seeder. */
export const aiContentBySlug: { [K in AiCopilot]: AiContentMap[K] } = {
  "sales-copilot": aiCopilotChats,
  "content-studio": aiContentDrafts,
  "smart-search": aiSearchSamples,
  "support-assistant": aiSupportDrafts,
  "promotion-optimizer": aiPromoIdeas,
  "anomaly-alerts": aiAnomalies,
  "review-summarizer": aiReviewSummary,
  "forecasting": aiForecasts,
  "trend-spotter": aiTrendSpotter,
  "daily-briefing": aiDailyBriefing,
  "inventory-agent": aiInventoryReorder,
  "segments": aiSegments,
  "win-back": aiWinBack,
  "bundles": aiBundles,
  "pricing": aiPricing,
  "returns-analyzer": aiReturns,
  "cart-recovery": aiCartRecovery,
  "product-health": aiProductHealth,
  "risk": aiRiskOrders,
  "catalog-audit": aiCatalogAudit,
  "vendors": aiVendors,
  "localization-agent": aiLocalization,
  "campaigns": aiCampaigns,
  "logistics": aiLogistics,
};
