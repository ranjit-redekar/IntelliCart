import { Link } from "react-router-dom";
import { ArrowRight, Heart, Leaf, Sparkles } from "lucide-react";
import { Card } from "../components/ui/Card";

const values = [
  {
    icon: Sparkles,
    title: "Considered, not crowded",
    body: "A small catalog of pieces we'd actually buy ourselves. Every SKU earns its place by surviving daily use across several seasons.",
  },
  {
    icon: Leaf,
    title: "Materials with provenance",
    body: "We source from small mills and workshops we can name. Where we can, we tell you exactly where the linen, walnut, or leather came from.",
  },
  {
    icon: Heart,
    title: "Long-term, not transactional",
    body: "Free returns, real repairs, and a two-year warranty. We'd rather lose a sale than ship something we wouldn't keep.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <section
        className="relative overflow-hidden rounded-[24px] p-8 md:p-12"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--color-accent-mint) 14%, var(--color-surface)), var(--color-surface))",
        }}
      >
        <span className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Our story
          </p>
          <h1 className="font-display text-[36px] md:text-[44px] leading-[1.1] tracking-[-0.02em] font-semibold mt-2">
            Made with restraint,
            <br />
            sold with patience.
          </h1>
          <p className="mt-5 text-[15px] text-muted max-w-xl">
            IntelliCart started in 2021 in a small Mumbai studio, with one rule: only sell things we
            still want a year after the launch photo. Five seasons in, the rule is the only one
            that hasn't changed.
          </p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.title}>
                <span
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-3"
                  style={{
                    background: "color-mix(in oklab, var(--color-brand-500) 12%, transparent)",
                    color: "var(--color-brand-600)",
                  }}
                >
                  <Icon size={18} />
                </span>
                <p className="font-semibold text-[15px]">{v.title}</p>
                <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{v.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div
          className="aspect-[4/3] rounded-[20px] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--color-brand-500) 20%, var(--color-surface-2)), var(--color-surface-2))",
          }}
        >
          <span className="absolute inset-0 bg-grid opacity-40" aria-hidden />
          <span
            className="absolute right-8 bottom-8 text-[120px] font-bold tracking-[-0.04em] leading-none"
            style={{
              color: "color-mix(in oklab, var(--color-brand-500) 38%, var(--color-text))",
              opacity: 0.22,
            }}
            aria-hidden
          >
            A
          </span>
        </div>
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">
            The team
          </p>
          <h2 className="font-display text-[26px] tracking-tight font-semibold mt-1">
            A small group, working slowly
          </h2>
          <p className="text-[14px] text-muted mt-3 leading-relaxed">
            Twelve people across design, sourcing, and customer care. We ship one or two new pieces
            a season — never more — and improve the rest in place. If something arrives less than
            perfect, we want to know.
          </p>
          <Link to="/shop" className="btn btn-primary mt-5 inline-flex">
            Browse the collection <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
