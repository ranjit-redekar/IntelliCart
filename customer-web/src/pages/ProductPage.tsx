import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  Gift,
  Heart,
  Minus,
  Package,
  Percent,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Undo2,
} from "lucide-react";
import { feedback, products, productExtras, promotions } from "../mockdata";
import type { PromotionTheme } from "../../../shared/types";
import { getProductExtra } from "../../../shared/productExtras";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { Avatar } from "../components/ui/Avatar";
import AiProductQA from "../components/AiProductQA";
import { useCart } from "../lib/cart";
import { cn } from "../lib/cn";
import NotFoundPage from "./NotFoundPage";

const themeAccent: Record<PromotionTheme, string> = {
  brand: "var(--color-brand-500)",
  violet: "var(--color-accent-violet)",
  mint: "var(--color-accent-mint)",
  amber: "var(--color-accent-amber)",
  rose: "var(--color-accent-rose)",
};

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= value
              ? "fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]"
              : "text-[var(--color-surface-3)]"
          )}
        />
      ))}
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useMemo(() => products.find((p) => p.id === id), [id]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const { add } = useCart();

  if (!product) return <NotFoundPage />;

  const extras = getProductExtra(product, productExtras);
  const reviews = feedback.filter((f) => f.productId === product.id);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating.toFixed(1);
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  // "Live" offers applicable to this product (all active web-visible promos for now).
  const offers = promotions.filter(
    (p) => p.status === "active" && (p.audience === "all" || p.audience === "web")
  );

  // Pricing display (mock discount on first active offer with a brand theme)
  const discountPromo = offers.find((o) => /\d+%\s*off/i.test(o.title));
  const discountPct = discountPromo ? Number(discountPromo.title.match(/(\d+)%/)?.[1] ?? 0) : 0;
  const listPrice = discountPct ? Math.round(product.price * (100 / (100 - discountPct))) : null;

  function addToCart() {
    add(product!.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  function buyNow() {
    add(product!.id, qty);
    navigate("/checkout");
  }

  const mainImage = extras.images[activeImage] ?? extras.images[0];
  const accent = themeAccent[mainImage.theme];

  return (
    <div className="space-y-10">
      <nav className="text-[12px] text-subtle inline-flex items-center gap-1.5">
        <Link to="/" className="hover:text-[var(--color-text)]">Home</Link>
        <span aria-hidden>›</span>
        <Link to="/shop" className="hover:text-[var(--color-text)]">Shop</Link>
        <span aria-hidden>›</span>
        <Link to={`/shop?cat=${product.categoryId}`} className="hover:text-[var(--color-text)]">
          {product.category}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-[var(--color-text)] truncate max-w-[160px]">{product.name}</span>
      </nav>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-[var(--color-text)] transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-start">
        {/* Image gallery */}
        <div>
          <div className="lg:hidden mb-4">
            <ProductHeader product={product} avgRating={avgRating} reviewCount={reviews.length} positiveCount={positiveCount} />
          </div>

          <div className="flex gap-3">
            <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
              {extras.images.map((img, i) => {
                const a = themeAccent[img.theme];
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "aspect-square rounded-[10px] overflow-hidden border-2 transition-all",
                      i === activeImage
                        ? "border-[var(--color-text)] scale-100"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    aria-label={img.caption ?? `Image ${i + 1}`}
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklab, ${a} 22%, var(--color-surface-2)), var(--color-surface-2))`,
                    }}
                  >
                    <span
                      className="w-full h-full flex items-center justify-center text-[11px] font-bold tracking-wider"
                      style={{ color: a }}
                    >
                      {img.initials}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-w-0">
              <div
                className="aspect-square rounded-[24px] relative overflow-hidden card-surface"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, var(--color-surface-2)), var(--color-surface-2))`,
                }}
              >
                <span className="absolute inset-0 bg-grid opacity-40" aria-hidden />
                <span
                  className="absolute top-5 left-5 text-[11px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-md backdrop-blur"
                  style={{
                    color: accent,
                    background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
                  }}
                >
                  {mainImage.caption ?? product.category}
                </span>
                <span
                  className="absolute right-8 bottom-8 text-[120px] font-bold tracking-[-0.04em] leading-none"
                  style={{
                    color: `color-mix(in oklab, ${accent} 38%, var(--color-text))`,
                    opacity: 0.22,
                  }}
                  aria-hidden
                >
                  {mainImage.initials}
                </span>
              </div>

              {/* Mobile thumbnails */}
              <div className="md:hidden flex gap-2 mt-3 overflow-x-auto -mx-1 px-1">
                {extras.images.map((img, i) => {
                  const a = themeAccent[img.theme];
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "w-14 h-14 rounded-[10px] overflow-hidden border-2 shrink-0 transition-all",
                        i === activeImage
                          ? "border-[var(--color-text)]"
                          : "border-transparent opacity-70"
                      )}
                      style={{
                        background: `linear-gradient(135deg, color-mix(in oklab, ${a} 22%, var(--color-surface-2)), var(--color-surface-2))`,
                      }}
                    >
                      <span
                        className="w-full h-full flex items-center justify-center text-[10.5px] font-bold tracking-wider"
                        style={{ color: a }}
                      >
                        {img.initials}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CTAs (sticky-ish on web) */}
          <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
            <button
              type="button"
              onClick={addToCart}
              className={cn(
                "btn btn-primary flex-1 min-w-[150px]",
                added && "!bg-[var(--color-accent-mint)]"
              )}
            >
              {added ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>Add to cart</>
              )}
            </button>
            <button type="button" onClick={buyNow} className="btn btn-ghost flex-1 min-w-[120px]">
              Buy now
            </button>
          </div>
        </div>

        {/* Info column */}
        <div>
          <div className="hidden lg:block">
            <ProductHeader product={product} avgRating={avgRating} reviewCount={reviews.length} positiveCount={positiveCount} />
          </div>

          {/* Pricing block */}
          <div className="mt-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-[32px] font-semibold tabular-nums">${product.price}</p>
              {listPrice && (
                <>
                  <p className="text-[15px] text-subtle line-through tabular-nums">${listPrice}</p>
                  <span className="text-[12.5px] font-semibold text-[var(--color-accent-mint)] inline-flex items-center gap-1">
                    <Percent size={12} /> {discountPct}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-[12px] text-subtle mt-1">Inclusive of all taxes</p>
          </div>

          {/* Offers strip */}
          {offers.length > 0 && (
            <div className="mt-5 rounded-[14px] border border-[var(--color-border)] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle inline-flex items-center gap-1.5">
                  <Gift size={12} /> Available offers
                </p>
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {offers.slice(0, 4).map((o) => (
                  <li key={o.id} className="px-4 py-3 flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: `color-mix(in oklab, var(--color-accent-${o.theme === "brand" ? "violet" : o.theme}) 14%, transparent)`,
                        color: o.theme === "brand" ? "var(--color-brand-600)" : `var(--color-accent-${o.theme})`,
                      }}
                    >
                      <Percent size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold">{o.title}</p>
                      <p className="text-[12px] text-muted mt-0.5">{o.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stock + qty + CTAs (desktop) */}
          <div className="mt-6 hidden lg:block">
            <Chip tone={product.stock < 20 ? "danger" : "success"}>
              {product.stock < 20 ? "Low stock" : "In stock"} · {product.stock} left
            </Chip>

            <div className="mt-4 flex items-end gap-3">
              <div>
                <p className="text-[12px] text-muted mb-1.5">Quantity</p>
                <div className="inline-flex items-center border border-[var(--color-border)] rounded-[10px] overflow-hidden">
                  <button
                    type="button"
                    className="px-2.5 py-2 hover:bg-[var(--color-surface-2)]"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-[13.5px] font-semibold tabular-nums min-w-[2ch] text-center">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="px-2.5 py-2 hover:bg-[var(--color-surface-2)]"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    aria-label="Increase"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addToCart}
                className={cn(
                  "btn btn-primary flex-1 min-w-[180px]",
                  added && "!bg-[var(--color-accent-mint)]"
                )}
              >
                {added ? (
                  <>
                    <Check size={14} /> Added to cart
                  </>
                ) : (
                  <>Add to cart · ${product.price * qty}</>
                )}
              </button>
              <button type="button" onClick={buyNow} className="btn btn-ghost">
                Buy now
              </button>
              <button type="button" aria-label="Save" className="btn btn-icon btn-ghost">
                <Heart size={15} />
              </button>
              <button type="button" aria-label="Share" className="btn btn-icon btn-ghost">
                <Share2 size={15} />
              </button>
            </div>
          </div>

          {/* Highlights */}
          {extras.highlights.length > 0 && (
            <div className="mt-7">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Highlights
              </p>
              <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed">
                {extras.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check size={14} className="mt-1 text-[var(--color-accent-mint)] shrink-0" />
                    <span className="text-[var(--color-text-muted)]">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trust strip */}
          <div className="mt-7 grid grid-cols-3 gap-3 text-[12.5px]">
            <div className="soft-surface p-3 text-center">
              <Truck size={14} className="mx-auto text-subtle" />
              <p className="mt-1.5 font-medium">Free shipping</p>
              <p className="text-subtle">Over $50</p>
            </div>
            <div className="soft-surface p-3 text-center">
              <Undo2 size={14} className="mx-auto text-subtle" />
              <p className="mt-1.5 font-medium">30-day returns</p>
              <p className="text-subtle">No questions</p>
            </div>
            <div className="soft-surface p-3 text-center">
              <ShieldCheck size={14} className="mx-auto text-subtle" />
              <p className="mt-1.5 font-medium">2-year warranty</p>
              <p className="text-subtle">IntelliCart-backed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Details
            </p>
            <h2 className="font-display text-[22px] md:text-[26px] tracking-tight font-semibold mt-1">
              Specifications
            </h2>
          </div>
        </div>
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-[13.5px]">
            <tbody>
              {extras.specs.map((s, i) => (
                <tr
                  key={s.key}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-0",
                    i % 2 === 0 && "bg-[var(--color-surface)]",
                    i % 2 === 1 && "bg-[var(--color-surface-2)]"
                  )}
                >
                  <td className="px-5 py-3 font-medium text-muted w-1/3 align-top">{s.key}</td>
                  <td className="px-5 py-3 text-[var(--color-text)]">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {extras.inBox && extras.inBox.length > 0 && (
          <div className="mt-4">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle mb-2">
              What's in the box
            </p>
            <ul className="flex flex-wrap gap-2">
              {extras.inBox.map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                >
                  <Package size={11} className="text-subtle" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <AiProductQA productName={product.name} category={product.category} />
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
              Voice of customer
            </p>
            <h2 className="font-display text-[22px] md:text-[26px] tracking-tight font-semibold mt-1">
              What customers are saying
            </h2>
          </div>
        </div>
        {reviews.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-muted">No reviews yet. Be the first to leave one.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.slice(0, 4).map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={r.customerName} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-semibold truncate">{r.title}</p>
                      <Stars value={r.rating} size={11} />
                    </div>
                    <p className="text-[11.5px] text-subtle">
                      {r.customerName} · <span className="tabular-nums">{r.createdAt}</span>
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{r.body}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
                You might also like
              </p>
              <h2 className="font-display text-[22px] md:text-[26px] tracking-tight font-semibold mt-1">
                More in {product.category}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => {
              const ext = getProductExtra(p, productExtras);
              const a = themeAccent[ext.images[0].theme];
              const init = ext.images[0].initials;
              return (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="group block rounded-[16px] overflow-hidden card-surface transition-transform hover:-translate-y-0.5"
                >
                  <div
                    className="aspect-square relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklab, ${a} 18%, var(--color-surface-2)), var(--color-surface-2))`,
                    }}
                  >
                    <span className="absolute inset-0 bg-grid opacity-50" aria-hidden />
                    <span
                      className="absolute right-3 bottom-3 text-[40px] font-bold tracking-[-0.04em] leading-none"
                      style={{
                        color: `color-mix(in oklab, ${a} 38%, var(--color-text))`,
                        opacity: 0.22,
                      }}
                      aria-hidden
                    >
                      {init}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="text-[13.5px] font-semibold truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
                        <Star size={11} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
                        <span className="tabular-nums">{p.rating}</span>
                      </span>
                      <p className="text-[13px] font-semibold tabular-nums">${p.price}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductHeader({
  product,
  avgRating,
  reviewCount,
  positiveCount,
}: {
  product: { name: string; category: string; id: string };
  avgRating: string;
  reviewCount: number;
  positiveCount: number;
}) {
  return (
    <div>
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
        {product.category} · {product.id}
      </p>
      <h1 className="font-display text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em] font-semibold mt-1.5">
        {product.name}
      </h1>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
          <Stars value={Math.round(Number(avgRating))} />
          <span className="tabular-nums font-semibold text-[var(--color-text)] ml-1">{avgRating}</span>
          <span className="text-subtle">({reviewCount || "no"} reviews)</span>
        </span>
        {reviewCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-accent-mint)]">
            <Sparkles size={11} /> {Math.round((positiveCount / reviewCount) * 100)}% positive
          </span>
        )}
      </div>
    </div>
  );
}
