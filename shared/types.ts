export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  rating: number;
}

export interface Order {
  id: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  placedAt: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  trend: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
}

export type FeedbackStatus = "new" | "replied" | "flagged" | "archived";
export type FeedbackSentiment = "positive" | "neutral" | "negative";

export interface Feedback {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  status: FeedbackStatus;
  sentiment: FeedbackSentiment;
  reply?: string;
  repliedAt?: string;
  helpfulVotes: number;
}

export type PromotionAudience = "all" | "web" | "mobile";
export type PromotionStatus = "active" | "draft" | "scheduled";
export type PromotionTheme = "brand" | "violet" | "mint" | "amber" | "rose";

export type SlideStatus = PromotionStatus;
export type SlideAudience = PromotionAudience;
export type SlideTheme = PromotionTheme;

export interface ProductImage {
  id: string;
  initials: string;
  theme: PromotionTheme;
  caption?: string;
  url?: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface ProductExtra {
  productId: string;
  images: readonly ProductImage[];
  specs: readonly ProductSpec[];
  highlights: readonly string[];
  inBox?: readonly string[];
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  eyebrow?: string;
  ctaText?: string;
  ctaUrl?: string;
  audience: SlideAudience;
  status: SlideStatus;
  theme: SlideTheme;
  imageInitials?: string;
  order: number;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  audience: PromotionAudience;
  status: PromotionStatus;
  theme: PromotionTheme;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}
