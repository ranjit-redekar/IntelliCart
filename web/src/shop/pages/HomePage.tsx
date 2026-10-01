import { Link } from "react-router-dom";
import { ArrowRight, Star, Truck, Undo2 } from "lucide-react";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import AiHeroPrompt from "../components/AiHeroPrompt";
import { api, qs } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { Skeleton } from "../../lib/AsyncBoundary";
import type { Product } from "../types";

interface CategoryTile {
  id: string;
  name: string;
  productCount: number;
  image: string | null;
}

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

export default function HomePage() {
  // Three independent calls so a slow one does not hold up the others.
  const cats = useApi(() => api.get<{ items: CategoryTile[] }>("/categories"), []);
  const featuredState = useApi(
    () => api.get<{ items: Product[] }>(`/products${qs({ pageSize: 4 })}`),
    [],
  );
  const trendingState = useApi(
    () => api.get<{ items: Product[] }>(`/products${qs({ sort: "rating", pageSize: 8 })}`),
    [],
  );

  const browseCategories = cats.data?.items ?? [];
  const featured = featuredState.data?.items ?? [];
  const trending = trendingState.data?.items ?? [];

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
        {cats.loading && browseCategories.length === 0 && <Skeleton rows={1} />}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 fade-up-stagger">
          {browseCategories.map((c) => {
            const accent = categoryAccent[c.id] ?? "var(--color-brand-500)";
            return (
              <Link
                key={c.id}
                to={`/shop?cat=${c.id}`}
                className="group card-surface rounded-[14px] overflow-hidden flex items-center gap-3 pr-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
              >
                <img
                  src={c.image ?? undefined}
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
                    {c.productCount} items
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
        {featuredState.loading && featured.length === 0 ? (
          <Skeleton rows={2} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-stagger">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {(trendingState.loading || trending.length > 0) && (
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
        {trending.length === 0 ? (
          <Skeleton rows={2} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-stagger">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
