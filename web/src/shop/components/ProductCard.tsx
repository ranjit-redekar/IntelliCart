import { Link } from "react-router-dom";
import { Heart, Plus, Star } from "lucide-react";
import type { Product } from "../../../../shared/types";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { useToast } from "../lib/toast";
import { cn } from "../lib/cn";

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};

export default function ProductCard({
  product,
  showCategory = false,
}: {
  product: Product;
  showCategory?: boolean;
}) {
  const accent = categoryAccent[product.categoryId] ?? "var(--color-brand-500)";
  const { add } = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const saved = wishlist.has(product.id);

  return (
    // ponytail: stretched-link card — the <Link> overlay keeps the buttons out of the anchor,
    // which nesting them inside it would make invalid (and unreachable by keyboard).
    <article className="group relative rounded-[16px] overflow-hidden card-surface transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] focus-within:-translate-y-0.5">
      <div
        className="aspect-square relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, var(--color-surface-2)), var(--color-surface-2))`,
        }}
      >
        <span className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <img
          src={product.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {showCategory && (
          <span
            className="absolute top-3 left-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-md backdrop-blur"
            style={{
              color: accent,
              background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
            }}
          >
            {product.category}
          </span>
        )}

        <button
          type="button"
          onClick={async () => {
            const saved = await wishlist.toggle(product.id);
            // null means not signed in — the wishlist belongs to the account
            // now, not the browser.
            if (saved === null) {
              toast("Sign in to save items");
              return;
            }
            toast(saved ? `Saved ${product.name}` : `Removed ${product.name} from saved`);
          }}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          aria-pressed={saved}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full inline-flex items-center justify-center backdrop-blur transition-transform hover:scale-110"
          style={{ background: "color-mix(in oklab, var(--color-surface) 85%, transparent)" }}
        >
          <Heart
            size={14}
            className={cn(
              saved
                ? "fill-[var(--color-accent-rose)] text-[var(--color-accent-rose)]"
                : "text-[var(--color-text-muted)]"
            )}
          />
        </button>

        <button
          type="button"
          onClick={() => {
            add(product.id, 1);
            toast(`${product.name} added to cart`, "success");
          }}
          className="btn btn-primary btn-sm absolute left-3 right-3 bottom-3 z-10 transition-all duration-200 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:focus-visible:opacity-100 md:focus-visible:translate-y-0"
        >
          <Plus size={13} /> Add to cart
        </button>
      </div>

      <div className="p-3.5">
        <p className="text-[13.5px] font-semibold truncate group-hover:text-[var(--color-brand-600)] transition-colors">
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[12.5px] text-muted inline-flex items-center gap-1">
            <Star size={11} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
            <span className="tabular-nums">{product.rating}</span>
          </span>
          <p className="text-[13px] font-semibold tabular-nums">${product.price}</p>
        </div>
      </div>

      <Link to={`/products/${product.id}`} className="absolute inset-0" aria-label={product.name} />
    </article>
  );
}
