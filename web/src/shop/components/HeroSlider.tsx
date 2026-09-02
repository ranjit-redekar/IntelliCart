import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { HeroSlide, SlideTheme } from "../../../../shared/types";
import { cn } from "../lib/cn";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { useLiveMerch } from "../../lib/useLiveMerch";

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
  // Active/audience filtering and ordering happen server-side, so an admin
  // publishing a slide changes what ships here without a redeploy.
  const state = useApi(() => api.get<{ items: HeroSlide[] }>("/slides?surface=web"), []);
  useLiveMerch(state.reload);
  const visible = state.data?.items ?? [];

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

  // No skeleton: an empty band is less jarring than a grey box that becomes
  // a hero. The rest of the page renders immediately either way.
  if (visible.length === 0) return null;

  const safeIndex = Math.min(index, visible.length - 1);
  const current = visible[safeIndex];

  return (
    <section
      className="group/hero relative overflow-hidden rounded-[24px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div className="relative" style={{ minHeight: 260 }}>
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
            className="hidden sm:flex absolute top-1/2 left-4 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur border border-[var(--color-border)] opacity-0 group-hover/hero:opacity-100 hover:scale-105 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % visible.length)}
            aria-label="Next slide"
            className="hidden sm:flex absolute top-1/2 right-4 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] backdrop-blur border border-[var(--color-border)] opacity-0 group-hover/hero:opacity-100 hover:scale-105 transition-all"
          >
            <ChevronRight size={16} />
          </button>

          <div
            key={safeIndex}
            className="absolute top-0 left-0 h-[3px] rounded-r-full"
            style={{
              background: themeAccent[current.theme],
              animation: paused ? "none" : `hero-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
              width: paused ? "100%" : undefined,
              opacity: 0.85,
            }}
            aria-hidden
          />

          <div className="absolute bottom-5 right-6 md:right-10 flex items-center gap-1.5">
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
        "absolute inset-0 px-6 md:px-10 py-6 flex items-center transition-opacity duration-700 ease-out",
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!active}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, var(--color-surface)), color-mix(in oklab, ${accent} 6%, var(--color-surface)))`,
      }}
    >
      <span className="absolute inset-0 bg-grid opacity-30" aria-hidden />

      {slide.image ? (
        <div className="absolute inset-0" aria-hidden>
          <img
            src={slide.image}
            alt=""
            className={cn(
              "w-full h-full object-cover object-center transition-transform duration-[6000ms] ease-out",
              active ? "scale-105" : "scale-100"
            )}
          />
          <span
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, color-mix(in oklab, ${accent} 22%, var(--color-surface)) 0%, color-mix(in oklab, ${accent} 20%, var(--color-surface)) 34%, color-mix(in oklab, ${accent} 8%, transparent) 62%, transparent 88%)`,
            }}
          />
        </div>
      ) : (
        <span
          className="absolute right-6 md:right-12 bottom-4 md:bottom-8 font-bold tracking-[-0.04em] leading-none text-[92px] md:text-[130px]"
          style={{
            color: `color-mix(in oklab, ${accent} 38%, var(--color-text))`,
            opacity: 0.22,
          }}
          aria-hidden
        >
          {initials}
        </span>
      )}
      <div className="relative max-w-[62%] sm:max-w-[48%] lg:max-w-[440px]">
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
        <h1 className="font-display text-[28px] md:text-[40px] leading-[1.06] tracking-[-0.02em] font-semibold whitespace-pre-line">
          {slide.title}
        </h1>
        <p className="mt-2.5 text-[13.5px] md:text-[15px] text-[var(--color-text-muted)] max-w-lg">
          {slide.subtitle}
        </p>
        {slide.ctaText && (
          <div className="mt-4">
            {slide.ctaUrl ? (
              <Link to={slide.ctaUrl} className="btn btn-primary">
                {slide.ctaText} <ArrowRight size={14} />
              </Link>
            ) : (
              <Link to="/shop" className="btn btn-primary">
                {slide.ctaText} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
