import { Link } from "react-router-dom";
import { ArrowRight, Star, Truck, Undo2 } from "lucide-react";
import { categories, products } from "../mockdata";
import { Card } from "../components/ui/Card";
import HeroSlider from "../components/HeroSlider";
import AiHeroPrompt from "../components/AiHeroPrompt";

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

const browseCategories = categories.filter((c) => c.id !== "all");

export default function HomePage() {
  const featured = products.slice(0, 4);
  const trending = products
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <div className="space-y-12">
      <AiHeroPrompt />

      <HeroSlider />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Truck, title: "Free shipping over $50", body: "Standard delivery on us." },
          { icon: Undo2, title: "30-day returns", body: "No questions asked." },
          { icon: Star, title: "4.7★ average", body: "Across 1,200+ reviews." },
        ].map((b) => {
          const Icon = b.icon;
          return (
            <Card key={b.title} className="flex items-start gap-3">
              <span
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{
                  background: "color-mix(in oklab, var(--color-brand-500) 12%, transparent)",
                  color: "var(--color-brand-600)",
                }}
              >
                <Icon size={18} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">{b.title}</p>
                <p className="text-[12.5px] text-muted mt-0.5">{b.body}</p>
              </div>
            </Card>
          );
        })}
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Categories
            </p>
            <h2 className="font-display text-[24px] md:text-[28px] tracking-tight font-semibold mt-1">
              Shop by category
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {browseCategories.map((c) => {
            const accent = categoryAccent[c.id] ?? "var(--color-brand-500)";
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                to={`/shop?cat=${c.id}`}
                className="group relative overflow-hidden rounded-[20px] p-6 min-h-[160px] flex flex-col justify-end transition-transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, var(--color-surface-2)), var(--color-surface-2))`,
                }}
              >
                <span className="absolute inset-0 bg-grid opacity-40" aria-hidden />
                <span
                  className="absolute right-5 top-5 text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-md"
                  style={{
                    color: accent,
                    background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
                  }}
                >
                  {count} items
                </span>
                <div className="relative">
                  <p className="text-[22px] font-semibold tracking-tight">{c.name}</p>
                  <p className="text-[13px] text-muted mt-1 inline-flex items-center gap-1">
                    Explore <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Editors' picks
            </p>
            <h2 className="font-display text-[24px] md:text-[28px] tracking-tight font-semibold mt-1">
              Featured this month
            </h2>
          </div>
          <Link to="/shop" className="text-[13px] font-semibold text-[var(--color-brand-600)] hover:underline">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map((p) => (
            <ProductTile key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Top rated
            </p>
            <h2 className="font-display text-[24px] md:text-[28px] tracking-tight font-semibold mt-1">
              Loved by customers
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trending.map((p) => (
            <ProductTile key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductTile({ product }: { product: (typeof products)[number] }) {
  const accent = categoryAccent[product.categoryId] ?? "var(--color-brand-500)";
  const initials = product.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block rounded-[16px] overflow-hidden card-surface transition-transform hover:-translate-y-0.5"
    >
      <div
        className="aspect-square relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, var(--color-surface-2)), var(--color-surface-2))`,
        }}
      >
        <span className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <span
          className="absolute right-3 bottom-3 text-[44px] font-bold tracking-[-0.04em] leading-none transition-transform duration-500 group-hover:scale-110"
          style={{
            color: `color-mix(in oklab, ${accent} 38%, var(--color-text))`,
            opacity: 0.22,
          }}
          aria-hidden
        >
          {initials}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-[13.5px] font-semibold truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[12.5px] text-muted inline-flex items-center gap-1">
            <Star size={11} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
            <span className="tabular-nums">{product.rating}</span>
          </p>
          <p className="text-[13px] font-semibold tabular-nums">${product.price}</p>
        </div>
      </div>
    </Link>
  );
}
