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
