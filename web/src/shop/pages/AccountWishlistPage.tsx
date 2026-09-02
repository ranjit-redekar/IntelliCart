import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Card } from "../components/ui/Card";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../lib/wishlist";
import { useCart } from "../lib/cart";
import { useToast } from "../lib/toast";
import { Skeleton } from "../../lib/AsyncBoundary";

export default function AccountWishlistPage() {
  // The provider holds the full products, not just ids — the client no longer
  // has a catalog to look them up in.
  const { items: saved, loading } = useWishlist();
  const { add } = useCart();
  const toast = useToast();

  async function addAll() {
    // Sequential: each add returns the recomputed cart, and firing them in
    // parallel would race on the same cart key.
    for (const p of saved) await add(p.id, 1);
    toast(`${saved.length} saved item${saved.length === 1 ? "" : "s"} added to cart`, "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">Saved</p>
          <h2 className="text-[18px] font-semibold tracking-tight">
            Wishlist{saved.length > 0 && ` · ${saved.length}`}
          </h2>
        </div>
        {saved.length > 0 && (
          <button type="button" onClick={addAll} className="btn btn-primary btn-sm">
            <ShoppingBag size={14} /> Add all to cart
          </button>
        )}
      </div>

      {loading && saved.length === 0 ? (
        <Skeleton rows={2} />
      ) : saved.length === 0 ? (
        <Card className="text-center py-12">
          <Heart size={28} className="mx-auto text-subtle" />
          <p className="font-semibold text-[14px] mt-2">Nothing saved yet</p>
          <p className="text-[12.5px] text-muted mt-1">
            Tap the heart on any product to keep it here.
          </p>
          <Link to="/shop" className="btn btn-ghost btn-sm mt-4 inline-flex">
            Browse the shop
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} showCategory />
          ))}
        </div>
      )}
    </div>
  );
}
