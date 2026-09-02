/**
 * Every Redis key the system uses, in one place.
 *
 * Rule this file enforces: no string keys are built inline anywhere else.
 * A typo in a key name is otherwise silent — you get a permanent cache miss,
 * not an error.
 *
 * The 24 families from the architecture doc (§07), grouped as they are there.
 */

export const TTL = {
  session: 60 * 60 * 24 * 30, // 30d, slides on use
  loginFail: 60 * 15,
  otp: 60 * 15,
  apiKey: 60 * 60,
  product: 60 * 60,
  productList: 60 * 5,
  lock: 5,
  guestCart: 60 * 60 * 24 * 7,
  hold: 60 * 15,
  idempotency: 60 * 60 * 24,
  recentViewed: 60 * 60 * 24 * 30,
  analytics: 60 * 60 * 6,
  ai: 60 * 60 * 24,
  settings: 60 * 60 * 24,
} as const;

/** Jitter so a whole category cannot expire on the same second. */
export const jitter = (base: number) => base + Math.floor(Math.random() * (base * 0.1));

/* ------------------------------------------------ 1-5  identity & security */
export const k = {
  session: (token: string) => `sess:${token}`,
  sessionsOfUser: (userId: string) => `sess:user:${userId}`,
  rateLimit: (route: string, who: string) => `rl:${route}:${who}`,
  loginFail: (email: string) => `login:fail:${email.toLowerCase()}`,
  otp: (purpose: string, token: string) => `otp:${purpose}:${token}`,
  apiKey: (hash: string) => `apikey:${hash}`,

  /* --------------------------------------------- 6-10 catalog & read cache */
  product: (id: string) => `product:${id}`,
  productExtras: (id: string) => `product:extras:${id}`,
  productList: (queryHash: string) => `products:list:${queryHash}`,
  categories: () => `categories:all`,
  /** Tag set: which cached list keys depend on this product. */
  tagProduct: (id: string) => `tag:product:${id}`,
  cacheLock: (key: string) => `lock:cache:${key}`,
  searchPopular: () => `search:popular`,
  recentViewed: (userId: string) => `recent:${userId}`,
  bestsellers: (period: string) => `bestsellers:${period}`,
  productViews: (id: string) => `views:product:${id}`,
  helpfulVotes: (feedbackId: string) => `helpful:${feedbackId}`,

  /* ------------------------------------------------ 11-15 cart & checkout */
  guestCart: (cartId: string) => `cart:${cartId}`,
  userCart: (userId: string) => `cart:user:${userId}`,
  stockHold: (productId: string, orderId: string) => `hold:${productId}:${orderId}`,
  stockLock: (productId: string) => `lock:stock:${productId}`,
  idempotency: (key: string) => `idem:${key}`,

  /* ------------------------------------------ 16-20 realtime & background */
  chanInvalidate: () => `chan:invalidate`,
  chanMerch: () => `chan:merch`,
  streamOrder: (orderId: string) => `stream:order:${orderId}`,
  streamAudit: () => `stream:audit`,

  /* --------------------------------------------------- 21-24 dashboard & AI */
  metrics: (range: string) => `metrics:${range}`,
  revenueSeries: (range: string) => `revenue:series:${range}`,
  categoryShare: (range: string) => `category:share:${range}`,
  topProducts: (range: string) => `top:products:${range}`,
  countLowStock: () => `count:lowstock`,
  countPendingOrders: () => `count:pending`,
  countNewFeedback: () => `count:feedback`,
  ai: (route: string, promptHash: string) => `ai:${route}:${promptHash}`,
  aiSpend: (yearMonth: string) => `ai:spend:${yearMonth}`,
  settings: (scope: string) => `settings:${scope}`,
} as const;

/** Queue names (BullMQ prefixes these with `bull:`). */
export const QUEUE = {
  email: "email",
  media: "media",
  analytics: "analytics",
  webhooks: "webhooks",
  cartRecovery: "cart-recovery",
} as const;
