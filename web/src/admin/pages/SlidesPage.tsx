import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Globe,
  Plus,
  RefreshCcw,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { slidesStore, useSlides } from "../lib/slidesStore";
import type { HeroSlide, SlideAudience, SlideTheme } from "../types";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import { cn } from "../lib/cn";

const audiences: { id: SlideAudience; label: string; icon: typeof Globe; hint: string }[] = [
  { id: "all", label: "All surfaces", icon: Users, hint: "Web + mobile" },
  { id: "web", label: "Web only", icon: Globe, hint: "Customer portal" },
  { id: "mobile", label: "Mobile only", icon: Smartphone, hint: "iOS + Android app" },
];

const themes: { id: SlideTheme; label: string; color: string }[] = [
  { id: "brand", label: "Brand", color: "var(--color-brand-500)" },
  { id: "violet", label: "Violet", color: "var(--color-accent-violet)" },
  { id: "mint", label: "Mint", color: "var(--color-accent-mint)" },
  { id: "amber", label: "Amber", color: "var(--color-accent-amber)" },
  { id: "rose", label: "Rose", color: "var(--color-accent-rose)" },
];

const themeAccent: Record<SlideTheme, string> = {
  brand: "var(--color-brand-500)",
  violet: "var(--color-accent-violet)",
  mint: "var(--color-accent-mint)",
  amber: "var(--color-accent-amber)",
  rose: "var(--color-accent-rose)",
};

const statusTone: Record<HeroSlide["status"], "success" | "neutral" | "info"> = {
  active: "success",
  draft: "neutral",
  scheduled: "info",
};

function nextId(existing: HeroSlide[]) {
  const max = existing
    .map((s) => Number(s.id.replace(/[^0-9]/g, "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 300);
  return `HS-${max + 1}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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

export default function SlidesPage() {
  const slides = useSlides();
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id ?? null);

  useEffect(() => {
    if (selectedId && !slides.find((s) => s.id === selectedId)) {
      setSelectedId(slides[0]?.id ?? null);
    }
  }, [slides, selectedId]);

  const selected = useMemo(
    () => slides.find((s) => s.id === selectedId) ?? null,
    [slides, selectedId]
  );

  const activeCount = slides.filter((s) => s.status === "active").length;
  const draftCount = slides.filter((s) => s.status === "draft").length;
  const webActive = slides.filter(
    (s) => s.status === "active" && (s.audience === "all" || s.audience === "web")
  ).length;
  const mobileActive = slides.filter(
    (s) => s.status === "active" && (s.audience === "all" || s.audience === "mobile")
  ).length;

  function createNew() {
    const slide: HeroSlide = {
      id: nextId(slides),
      title: "Untitled slide",
      subtitle: "Add a short, customer-facing message.",
      eyebrow: "New",
      ctaText: "Shop now",
      ctaUrl: "/shop",
      audience: "all",
      status: "draft",
      theme: "brand",
      order: slides.length + 1,
      createdAt: todayISO(),
    };
    slidesStore.add(slide);
    setSelectedId(slide.id);
  }

  function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this slide?")) return;
    slidesStore.remove(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Hero slides"
        description={`${activeCount} live · ${draftCount} draft · shown on ${webActive} web + ${mobileActive} mobile surface${webActive + mobileActive === 1 ? "" : "s"}`}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && !window.confirm("Reset slides to defaults?")) return;
                slidesStore.reset();
              }}
              className="btn btn-ghost btn-sm"
            >
              <RefreshCcw size={14} /> Reset
            </button>
            <button type="button" onClick={createNew} className="btn btn-primary btn-sm">
              <Plus size={14} /> New slide
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up-stagger">
        <Card interactive>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
              style={{
                background: "color-mix(in oklab, var(--color-accent-mint) 14%, transparent)",
                color: "var(--color-accent-mint)",
              }}
            >
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] text-muted">Live</p>
              <p className="text-[22px] font-semibold tabular-nums">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Web carousel</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{webActive}</p>
          <p className="text-[12px] text-subtle mt-1">Slides on storefront</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Mobile carousel</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{mobileActive}</p>
          <p className="text-[12px] text-subtle mt-1">Slides in app</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Drafts</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{draftCount}</p>
          <p className="text-[12px] text-subtle mt-1">Saved but hidden</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 fade-up">
        <Card padded={false} className="overflow-hidden">
          <CardHeader
            eyebrow="Carousel"
            title="Slide order"
            subtitle="Reorder, toggle, or edit copy"
            className="px-5 pt-5"
          />
          {slides.length === 0 ? (
            <div className="px-5 pb-5">
              <p className="text-[13px] text-muted">No slides yet. Create one to start.</p>
            </div>
          ) : (
            <ul>
              {slides.map((s, idx) => {
                const isSelected = s.id === selectedId;
                const audienceMeta = audiences.find((a) => a.id === s.audience);
                const Icon = audienceMeta?.icon ?? Users;
                const accent = themeAccent[s.theme];
                const initials = deriveInitials(s.title, s.imageInitials);
                return (
                  <li
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "border-b border-[var(--color-border)] last:border-0 cursor-pointer transition-colors px-5 py-4 flex items-start gap-3",
                      isSelected
                        ? "bg-[var(--color-surface-2)]"
                        : "hover:bg-[var(--color-surface-2)]"
                    )}
                  >
                    <span
                      className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[14px] font-bold shrink-0"
                      style={{
                        background: `color-mix(in oklab, ${accent} 22%, var(--color-surface-2))`,
                        color: accent,
                      }}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11.5px] text-subtle tabular-nums">#{idx + 1}</span>
                        <p className="text-[13.5px] font-semibold tracking-tight truncate">
                          {s.title.split("\n")[0]}
                        </p>
                        <Chip tone={statusTone[s.status]} className="capitalize">
                          {s.status}
                        </Chip>
                      </div>
                      <p className="text-[12px] text-subtle mt-0.5 inline-flex items-center gap-1.5">
                        <Icon size={11} /> {audienceMeta?.label}
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">{s.id}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          slidesStore.move(s.id, "up");
                        }}
                        disabled={idx === 0}
                        className={cn(
                          "btn btn-icon btn-sm btn-ghost",
                          idx === 0 && "opacity-30 cursor-not-allowed"
                        )}
                        aria-label="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          slidesStore.move(s.id, "down");
                        }}
                        disabled={idx === slides.length - 1}
                        className={cn(
                          "btn btn-icon btn-sm btn-ghost",
                          idx === slides.length - 1 && "opacity-30 cursor-not-allowed"
                        )}
                        aria-label="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <label
                        className="inline-flex items-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={s.status === "active"}
                          onChange={(e) => slidesStore.toggle(s.id, e.target.checked)}
                        />
                        <span
                          className={cn(
                            "w-9 h-5 rounded-full transition-colors relative",
                            s.status === "active"
                              ? "bg-[var(--color-accent-mint)]"
                              : "bg-[var(--color-surface-3)]"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                              s.status === "active" ? "translate-x-4" : "translate-x-0.5"
                            )}
                          />
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(s.id);
                        }}
                        aria-label="Delete slide"
                        className="btn btn-icon btn-sm btn-ghost text-subtle hover:text-[var(--color-accent-rose)]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selected ? (
          <Editor key={selected.id} slide={selected} />
        ) : (
          <Card className="flex items-center justify-center text-center min-h-[300px]">
            <div>
              <p className="text-[13px] text-muted">Pick a slide to edit, or create a new one.</p>
              <button type="button" onClick={createNew} className="btn btn-primary btn-sm mt-3">
                <Plus size={14} /> New slide
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Editor({ slide }: { slide: HeroSlide }) {
  const [draft, setDraft] = useState<HeroSlide>(slide);

  useEffect(() => {
    setDraft(slide);
  }, [slide]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(slide), [draft, slide]);

  function field<K extends keyof HeroSlide>(key: K, value: HeroSlide[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save() {
    slidesStore.update(slide.id, draft);
  }

  function publish() {
    slidesStore.update(slide.id, { ...draft, status: "active" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader eyebrow="Edit" title="Slide details" subtitle={slide.id} />
        <div className="space-y-4">
          <div>
            <label className="text-[12.5px] font-semibold">Eyebrow</label>
            <input
              className="input mt-1.5"
              placeholder="Small label above the title"
              value={draft.eyebrow ?? ""}
              onChange={(e) => field("eyebrow", e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold">Title</label>
            <textarea
              rows={2}
              className="input resize-none mt-1.5"
              placeholder="Headline (use \n for a line break)"
              value={draft.title}
              onChange={(e) => field("title", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold">Subtitle</label>
            <textarea
              rows={2}
              className="input resize-none mt-1.5"
              value={draft.subtitle}
              onChange={(e) => field("subtitle", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] font-semibold">CTA text</label>
              <input
                className="input mt-1.5"
                value={draft.ctaText ?? ""}
                onChange={(e) => field("ctaText", e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="text-[12.5px] font-semibold">CTA URL</label>
              <input
                className="input mt-1.5"
                placeholder="/shop"
                value={draft.ctaUrl ?? ""}
                onChange={(e) => field("ctaUrl", e.target.value || undefined)}
              />
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-semibold">Audience</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {audiences.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => field("audience", a.id)}
                    className={cn(
                      "rounded-[10px] border px-3 py-2 text-left transition-colors",
                      draft.audience === a.id
                        ? "border-[var(--color-brand-400)] bg-[color-mix(in_oklab,var(--color-brand-500)_8%,transparent)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <Icon size={12} /> {a.label}
                    </span>
                    <p className="text-[11px] text-subtle mt-0.5">{a.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] font-semibold">Theme</label>
              <div className="flex items-center gap-2 mt-1.5">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => field("theme", t.id)}
                    aria-label={t.label}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-transform",
                      draft.theme === t.id
                        ? "border-[var(--color-text)] scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ background: t.color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12.5px] font-semibold">Image initials</label>
              <input
                className="input mt-1.5"
                placeholder="Auto from title"
                maxLength={3}
                value={draft.imageInitials ?? ""}
                onChange={(e) => field("imageInitials", e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]">
            <p className="text-[11.5px] text-subtle">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={!dirty}
                className={cn("btn btn-ghost btn-sm", !dirty && "opacity-60 cursor-not-allowed")}
              >
                Save changes
              </button>
              <button type="button" onClick={publish} className="btn btn-primary btn-sm">
                <Sparkles size={13} /> {slide.status === "active" ? "Republish" : "Publish live"}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Preview"
          title="How it renders"
          subtitle="Each surface re-renders this with its own native UI"
        />
        <div className="space-y-5">
          {(draft.audience === "all" || draft.audience === "web") && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={12} className="text-subtle" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  Customer portal
                </span>
              </div>
              <WebSlidePreview slide={draft} />
            </div>
          )}
          {(draft.audience === "all" || draft.audience === "mobile") && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={12} className="text-subtle" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  Mobile app
                </span>
              </div>
              <div className="max-w-[300px] mx-auto p-3 rounded-[28px] border border-[var(--color-border-strong)] bg-[var(--color-surface-2)]">
                <MobileSlidePreview slide={draft} />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function WebSlidePreview({ slide }: { slide: HeroSlide }) {
  const accent = themeAccent[slide.theme];
  const initials = deriveInitials(slide.title, slide.imageInitials);
  return (
    <div
      className="relative rounded-[20px] overflow-hidden p-6 min-h-[180px] flex items-end"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, var(--color-surface-2)), var(--color-surface-2))`,
      }}
    >
      <span className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <span
        className="absolute right-5 top-5 text-[64px] font-bold tracking-[-0.04em] leading-none"
        style={{
          color: `color-mix(in oklab, ${accent} 38%, var(--color-text))`,
          opacity: 0.22,
        }}
        aria-hidden
      >
        {initials}
      </span>
      <div className="relative max-w-md">
        {slide.eyebrow && (
          <span
            className="inline-block text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-md mb-2"
            style={{
              color: accent,
              background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
            }}
          >
            {slide.eyebrow}
          </span>
        )}
        <p className="text-[20px] font-semibold tracking-tight leading-tight whitespace-pre-line">
          {slide.title}
        </p>
        <p className="text-[12.5px] text-muted mt-1.5">{slide.subtitle}</p>
        {slide.ctaText && (
          <span
            className="inline-block mt-3 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold"
            style={{ background: accent, color: "white" }}
          >
            {slide.ctaText}
          </span>
        )}
      </div>
    </div>
  );
}

function MobileSlidePreview({ slide }: { slide: HeroSlide }) {
  const accent = themeAccent[slide.theme];
  const initials = deriveInitials(slide.title, slide.imageInitials);
  return (
    <div
      className="rounded-[18px] p-4 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, black))`,
      }}
    >
      <span className="absolute inset-0 bg-grid opacity-15" aria-hidden />
      <div className="relative">
        {slide.eyebrow && (
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] opacity-80">
            {slide.eyebrow}
          </span>
        )}
        <p className="text-[15px] font-semibold leading-tight mt-1 whitespace-pre-line">
          {slide.title}
        </p>
        <p className="text-[11px] mt-1.5 opacity-80 leading-snug">{slide.subtitle}</p>
        {slide.ctaText && (
          <span className="inline-block mt-3 bg-white/90 text-[var(--color-text)] text-[11px] font-semibold rounded-full px-2.5 py-1">
            {slide.ctaText}
          </span>
        )}
        <span
          className="absolute right-0 bottom-0 text-[44px] font-bold tracking-[-0.04em] leading-none opacity-25"
          aria-hidden
        >
          {initials}
        </span>
      </div>
    </div>
  );
}
