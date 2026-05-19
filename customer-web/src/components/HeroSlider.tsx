import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { heroSlides } from "../mockdata";
import type { HeroSlide, SlideTheme } from "../../../shared/types";
import { cn } from "../lib/cn";

const themeAccent: Record<SlideTheme, string> = {
  brand: "var(--color-brand-500)",
  violet: "var(--color-accent-violet)",
  mint: "var(--color-accent-mint)",
  amber: "var(--color-accent-amber)",
  rose: "var(--color-accent-rose)",
};

function deriveInitials(title: string, override?: string) {
  if (override) return override.slice(0, 2).toUpperCase();
  return (
    title
      .replace(/\n/g, " ")
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "•"
  );
}

const AUTO_ADVANCE_MS = 6000;

export default function HeroSlider() {
  const visible = heroSlides
    .filter((s) => s.status === "active" && (s.audience === "all" || s.audience === "web"))
    .slice()
    .sort((a, b) => a.order - b.order);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to first slide if the list shrinks below our index.
  useEffect(() => {
    if (index >= visible.length) setIndex(0);
  }, [visible.length, index]);

  // Auto-advance.
  useEffect(() => {
    if (paused || visible.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(t);
  }, [paused, visible.length]);

  if (visible.length === 0) return null;

  const safeIndex = Math.min(index, visible.length - 1);
  const current = visible[safeIndex];

  return (
    <section
      className="relative overflow-hidden rounded-[28px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div className="relative" style={{ minHeight: 360 }}>
        {visible.map((slide, i) => (
          <Slide key={slide.id} slide={slide} active={i === safeIndex} />
        ))}
      </div>

      {visible.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + visible.length) % visible.length)}
            aria-label="Previous slide"
            className="hidden sm:flex absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur border border-[var(--color-border)] hover:scale-105 transition-transform"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % visible.length)}
            aria-label="Next slide"
            className="hidden sm:flex absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur border border-[var(--color-border)] hover:scale-105 transition-transform"
          >
            <ChevronRight size={16} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {visible.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === safeIndex}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === safeIndex
                    ? "w-6 bg-[var(--color-text)]"
                    : "w-1.5 bg-[var(--color-text)]/30 hover:bg-[var(--color-text)]/55"
                )}
              />
            ))}
          </div>

          <span className="sr-only" aria-live="polite">
            Slide {safeIndex + 1} of {visible.length}: {current.title}
          </span>
        </>
      )}
    </section>
  );
}

function Slide({ slide, active }: { slide: HeroSlide; active: boolean }) {
  const accent = themeAccent[slide.theme];
  const initials = deriveInitials(slide.title, slide.imageInitials);
  return (
    <div
      className={cn(
        "absolute inset-0 p-8 md:p-14 flex items-center transition-opacity duration-700 ease-out",
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!active}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, var(--color-surface)), color-mix(in oklab, ${accent} 6%, var(--color-surface)))`,
      }}
    >
      <span className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <span
        className="absolute right-6 md:right-12 bottom-6 md:bottom-12 font-bold tracking-[-0.04em] leading-none text-[120px] md:text-[180px]"
        style={{
          color: `color-mix(in oklab, ${accent} 38%, var(--color-text))`,
          opacity: 0.22,
        }}
        aria-hidden
      >
        {initials}
      </span>
      <div className="relative max-w-2xl">
        {slide.eyebrow && (
          <span
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.06em] uppercase rounded-full px-2.5 py-1 mb-4"
            style={{
              color: accent,
              background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
            }}
          >
            <Sparkles size={11} /> {slide.eyebrow}
          </span>
        )}
        <h1 className="font-display text-[36px] md:text-[52px] leading-[1.05] tracking-[-0.02em] font-semibold whitespace-pre-line">
          {slide.title}
        </h1>
        <p className="mt-4 text-[14.5px] md:text-[16px] text-[var(--color-text-muted)] max-w-lg">
          {slide.subtitle}
        </p>
        {slide.ctaText && (
          <div className="mt-6">
            {slide.ctaUrl ? (
              <Link to={slide.ctaUrl} className="btn btn-primary">
                {slide.ctaText} <ArrowRight size={14} />
              </Link>
            ) : (
              <button type="button" className="btn btn-primary">
                {slide.ctaText} <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
