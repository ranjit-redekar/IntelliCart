import type {
  Product,
  ProductExtra,
  ProductImage,
  ProductSpec,
  PromotionTheme,
} from "./types";

const defaultThemeByCategory: Record<string, PromotionTheme> = {
  fashion: "brand",
  electronics: "violet",
  home: "mint",
};

const themeRotation: PromotionTheme[] = ["brand", "violet", "mint", "amber"];

function initials(name: string, fallback = "•") {
  return (
    name
      .replace(/\n/g, " ")
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || fallback
  );
}

function defaultImages(product: Product): ProductImage[] {
  const base = initials(product.name);
  return themeRotation.map((theme, i) => ({
    id: `derived-${i + 1}`,
    initials: i === 0 ? base : i === 1 ? "SD" : i === 2 ? "BK" : "DT",
    theme,
    caption: ["Front", "Side", "Back", "Detail"][i],
  }));
}

function defaultSpecs(product: Product): ProductSpec[] {
  const common: ProductSpec[] = [
    { key: "SKU", value: product.id },
    { key: "Category", value: product.category },
    { key: "In stock", value: `${product.stock} units` },
  ];
  if (product.categoryId === "fashion") {
    return [
      ...common,
      { key: "Material", value: "Specialty woven blend" },
      { key: "Care", value: "Cold wash, hang dry" },
      { key: "Country of origin", value: "India" },
    ];
  }
  if (product.categoryId === "electronics") {
    return [
      ...common,
      { key: "Connectivity", value: "Bluetooth 5.0 +" },
      { key: "Warranty", value: "2 years" },
      { key: "Charging", value: "USB-C" },
    ];
  }
  return [
    ...common,
    { key: "Material", value: "Hand-finished natural materials" },
    { key: "Care", value: "Wipe with a soft cloth" },
    { key: "Country of origin", value: "Multiple" },
  ];
}

function defaultHighlights(product: Product): string[] {
  if (product.categoryId === "fashion") {
    return [
      "Materials sourced from named workshops",
      "Built to soften and improve with wear",
      "Sized for an easy, relaxed fit",
      "30-day fit guarantee",
    ];
  }
  if (product.categoryId === "electronics") {
    return [
      "Engineered for daily reliability",
      "Updated firmware quarterly",
      "Compatible with iOS and Android",
      "2-year warranty included",
    ];
  }
  return [
    "Made by independent makers",
    "Each piece varies slightly — that's the point",
    "Packaged safely for international shipping",
    "Gift-ready presentation",
  ];
}

export function getProductExtra(product: Product, seeded: readonly ProductExtra[]): ProductExtra {
  const match = seeded.find((e) => e.productId === product.id);
  if (match) return match;
  const theme = defaultThemeByCategory[product.categoryId] ?? "brand";
  return {
    productId: product.id,
    images: defaultImages(product).map((img, i) =>
      i === 0 ? { ...img, theme } : img
    ),
    specs: defaultSpecs(product),
    highlights: defaultHighlights(product),
  };
}
