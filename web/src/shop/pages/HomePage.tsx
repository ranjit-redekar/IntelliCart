import { Link } from "react-router-dom";
import { ArrowRight, Star, Truck, Undo2 } from "lucide-react";
import { categories, products } from "../mockdata";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
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
    <div className="space-y-8 md:space-y-10">
      <AiHeroPrompt />

      <HeroSlider />

      {/* Slim reassurance strip — one line instead of three cards. */}
      <section className="card-surface rounded-[14px] px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[12.5px]">
        {[
          { icon: Truck, label: "Free shipping over $50" },
          { icon: Undo2, label: "30-day returns, no questions" },
          { icon: Star, label: "4.7★ across 1,200+ reviews" },
        ].map((b) => {
          const Icon = b.icon;
          return (
            <span key={b.label} className="inline-flex items-center gap-2 text-muted">
              <Icon size={14} className="text-[var(--color-brand-600)] shrink-0" />
              {b.label}
            </span>
          );
        })}
        <Link
          to="/about"
          className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand-600)] hover:underline"
        >
          Our story <ArrowRight size={12} />
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-[19px] md:text-[21px] tracking-tight font-semibold">
            Shop by category
          </h2>
          <Link
            to="/shop"
            className="text-[12.5px] font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-1"
          >
            All products <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 fade-up-stagger">
          {browseCategories.map((c) => {
            const accent = categoryAccent[c.id] ?? "var(--color-brand-500)";
            const inCategory = products.filter((p) => p.categoryId === c.id);
            return (
              <Link
                key={c.id}
                to={`/shop?cat=${c.id}`}
                className="group card-surface rounded-[14px] overflow-hidden flex items-center gap-3 pr-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
              >
                <img
                  src={inCategory[0]?.image}
                  alt=""
                  loading="lazy"
                  className="w-[76px] h-[76px] object-cover shrink-0"
                  style={{ background: `color-mix(in oklab, ${accent} 18%, var(--color-surface-2))` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold tracking-tight truncate">
                    {c.name}
                  </span>
                  <span className="block text-[12px] text-subtle tabular-nums">
                    {inCategory.length} items
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-subtle transition-transform group-hover:translate-x-0.5"
                />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-stagger">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-stagger">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
