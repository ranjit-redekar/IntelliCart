import * as raw from "../../mockdata/index";
import type { Feedback, HeroSlide, ProductExtra, Promotion } from "./types";

export const { metrics, categories, products, orders, customers, cartItems } = raw;
export const feedback: readonly Feedback[] = raw.feedback;
export const promotions: readonly Promotion[] = raw.promotions;
export const heroSlides: readonly HeroSlide[] = raw.heroSlides;
export const productExtras: readonly ProductExtra[] = raw.productExtras;
