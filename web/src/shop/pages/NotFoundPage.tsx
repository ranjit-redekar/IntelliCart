import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card";

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto">
      <Card className="text-center py-12">
        <p className="font-display text-[64px] font-semibold tracking-[-0.04em] leading-none text-subtle">
          404
        </p>
        <h1 className="text-[18px] font-semibold mt-3">We couldn't find that page</h1>
        <p className="text-[13px] text-muted mt-1">
          The link may have moved, or the item is no longer available.
        </p>
        <Link to="/" className="btn btn-primary btn-sm mt-5 inline-flex">
          Back to home <ArrowRight size={13} />
        </Link>
      </Card>
    </div>
  );
}
