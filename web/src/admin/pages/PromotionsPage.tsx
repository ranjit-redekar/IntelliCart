import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  Globe,
  Plus,
  RefreshCcw,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { promotionsStore, usePromotions } from "../lib/promotionsStore";
import type { Promotion, PromotionAudience, PromotionTheme } from "../types";
import { Card, CardHeader } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import PromoBanner from "../components/PromoBanner";
import { cn } from "../lib/cn";

const audiences: { id: PromotionAudience; label: string; icon: typeof Globe; hint: string }[] = [
  { id: "all", label: "All surfaces", icon: Users, hint: "Web + mobile" },
  { id: "web", label: "Web only", icon: Globe, hint: "Customer portal" },
  { id: "mobile", label: "Mobile only", icon: Smartphone, hint: "iOS + Android app" },
];

const themes: { id: PromotionTheme; label: string; color: string }[] = [
  { id: "brand", label: "Brand", color: "var(--color-brand-500)" },
  { id: "violet", label: "Violet", color: "var(--color-accent-violet)" },
  { id: "mint", label: "Mint", color: "var(--color-accent-mint)" },
  { id: "amber", label: "Amber", color: "var(--color-accent-amber)" },
  { id: "rose", label: "Rose", color: "var(--color-accent-rose)" },
];

const statusTone: Record<Promotion["status"], "success" | "neutral" | "info"> = {
  active: "success",
  draft: "neutral",
  scheduled: "info",
};

function nextId(existing: Promotion[]) {
  const max = existing
    .map((p) => Number(p.id.replace(/[^0-9]/g, "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 100);
  return `PR-${max + 1}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PromotionsPage() {
  const promotions = usePromotions();
  const dirtyRef = useRef(false);
  const leaveEditor = () => {
    if (dirtyRef.current && !window.confirm("Discard unsaved changes?")) return false;
    dirtyRef.current = false;
    return true;
  };
  const select = (id: string) => {
    if (leaveEditor()) setSelectedId(id);
  };
  const [selectedId, setSelectedId] = useState<string | null>(promotions[0]?.id ?? null);

  // If the selected promotion was deleted, fall back to the first one.
  useEffect(() => {
    if (selectedId && !promotions.find((p) => p.id === selectedId)) {
      setSelectedId(promotions[0]?.id ?? null);
    }
  }, [promotions, selectedId]);

  const selected = useMemo(
    () => promotions.find((p) => p.id === selectedId) ?? null,
    [promotions, selectedId]
  );

  const activeCount = promotions.filter((p) => p.status === "active").length;
  const scheduledCount = promotions.filter((p) => p.status === "scheduled").length;
  const draftCount = promotions.filter((p) => p.status === "draft").length;
  const webActive = promotions.filter(
    (p) => p.status === "active" && (p.audience === "all" || p.audience === "web")
  ).length;
  const mobileActive = promotions.filter(
    (p) => p.status === "active" && (p.audience === "all" || p.audience === "mobile")
  ).length;

  function createNew() {
    if (!leaveEditor()) return;
    const promo: Promotion = {
      id: nextId(promotions),
      title: "Untitled promotion",
      message: "Add a short, customer-facing message.",
      ctaText: "Shop now",
      ctaUrl: "/products",
      audience: "all",
      status: "draft",
      theme: "brand",
      createdAt: todayISO(),
    };
    promotionsStore.add(promo);
    setSelectedId(promo.id);
  }

  function remove(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this promotion?")) return;
    promotionsStore.remove(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Promotions"
        description={`${activeCount} live · ${scheduledCount} scheduled · ${draftCount} draft · shown to ${webActive + mobileActive} live surface${webActive + mobileActive === 1 ? "" : "s"}`}
        actions={
          <>
            <button
              type="button"
              onClick={() => promotionsStore.reset()}
              className="btn btn-ghost btn-sm"
            >
              <RefreshCcw size={14} /> Refresh
            </button>
            <button type="button" onClick={createNew} className="btn btn-primary btn-sm">
              <Plus size={14} /> New promotion
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
              <p className="text-[12px] text-muted">Live now</p>
              <p className="text-[22px] font-semibold tabular-nums">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Web surfaces</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{webActive}</p>
          <p className="text-[12px] text-subtle mt-1">Visible on customer portal</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Mobile surfaces</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{mobileActive}</p>
          <p className="text-[12px] text-subtle mt-1">Visible in the app</p>
        </Card>
        <Card interactive>
          <p className="text-[12px] text-muted">Scheduled</p>
          <p className="text-[22px] font-semibold tabular-nums mt-1">{scheduledCount}</p>
          <p className="text-[12px] text-subtle mt-1">Future activations</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 fade-up">
        <Card padded={false} className="overflow-hidden">
          <CardHeader
            eyebrow="Campaigns"
            title="All promotions"
            subtitle="Toggle live, edit copy, or schedule"
            className="px-5 pt-5"
          />
          {promotions.length === 0 ? (
            <div className="px-5 pb-5">
              <p className="text-[13px] text-muted">
                No promotions yet. Create one to start.
              </p>
            </div>
          ) : (
            <ul>
              {promotions.map((p) => {
                const isSelected = p.id === selectedId;
                const audienceMeta = audiences.find((a) => a.id === p.audience);
                const Icon = audienceMeta?.icon ?? Users;
                return (
                  <li
                    key={p.id}
                    onClick={() => select(p.id)}
                    className={cn(
                      "border-b border-[var(--color-border)] last:border-0 cursor-pointer transition-colors px-5 py-4",
                      isSelected
                        ? "bg-[var(--color-surface-2)]"
                        : "hover:bg-[var(--color-surface-2)]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13.5px] font-semibold tracking-tight truncate">
                            {p.title}
                          </p>
                          <Chip tone={statusTone[p.status]} className="capitalize">
                            {p.status}
                          </Chip>
                        </div>
                        <p className="text-[12px] text-subtle mt-0.5 inline-flex items-center gap-1.5">
                          <Icon size={11} /> {audienceMeta?.label}
                          <span aria-hidden>·</span>
                          <span className="tabular-nums">{p.id}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          className="inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={p.status === "active"}
                            onChange={(e) => promotionsStore.toggle(p.id, e.target.checked)}
                          />
                          <span
                            className={cn(
                              "w-9 h-5 rounded-full transition-colors relative",
                              p.status === "active"
                                ? "bg-[var(--color-accent-mint)]"
                                : "bg-[var(--color-surface-3)]"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                p.status === "active" ? "translate-x-4" : "translate-x-0.5"
                              )}
                            />
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(p.id);
                          }}
                          aria-label="Delete promotion"
                          className="btn btn-icon btn-sm btn-ghost text-subtle hover:text-[var(--color-accent-rose)]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selected ? (
          <Editor key={selected.id} promotion={selected} dirtyRef={dirtyRef} />
        ) : (
          <Card className="flex items-center justify-center text-center min-h-[300px]">
            <div>
              <p className="text-[13px] text-muted">Pick a promotion to edit, or create a new one.</p>
              <button type="button" onClick={createNew} className="btn btn-primary btn-sm mt-3">
                <Plus size={14} /> New promotion
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Editor({ promotion, dirtyRef }: { promotion: Promotion; dirtyRef: MutableRefObject<boolean> }) {
  // null = no local edits, so the editor follows the server copy. Edits stay
  // put when another row's toggle refreshes the list.
  const [edits, setEdits] = useState<Promotion | null>(null);
  const draft = edits ?? promotion;

  const dirty = useMemo(() => edits !== null && JSON.stringify(edits) !== JSON.stringify(promotion), [edits, promotion]);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty, dirtyRef]);

  function field<K extends keyof Promotion>(key: K, value: Promotion[K]) {
    setEdits((d) => ({ ...(d ?? promotion), [key]: value }));
  }

  // Keep the edits if the write fails, so nothing typed is lost.
  async function save() {
    if (await promotionsStore.update(promotion.id, draft)) setEdits(null);
  }

  async function publish() {
    if (await promotionsStore.update(promotion.id, { ...draft, status: "active" })) setEdits(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader eyebrow="Edit" title="Promotion details" subtitle={promotion.id} />
        <div className="space-y-4">
          <div>
            <label className="text-[12.5px] font-semibold">Title</label>
            <input
              className="input mt-1.5"
              value={draft.title}
              onChange={(e) => field("title", e.target.value)}
            />
          </div>
          <div>
            <label className="text-[12.5px] font-semibold">Message</label>
            <textarea
              rows={3}
              className="input resize-none mt-1.5"
              value={draft.message}
              onChange={(e) => field("message", e.target.value)}
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
                placeholder="/products"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] font-semibold">Starts</label>
              <input
                type="date"
                className="input mt-1.5"
                value={draft.startsAt ?? ""}
                onChange={(e) => field("startsAt", e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="text-[12.5px] font-semibold">Ends</label>
              <input
                type="date"
                className="input mt-1.5"
                value={draft.endsAt ?? ""}
                onChange={(e) => field("endsAt", e.target.value || undefined)}
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
              <button
                type="button"
                onClick={publish}
                className="btn btn-primary btn-sm"
              >
                <Sparkles size={13} /> {promotion.status === "active" ? "Republish" : "Publish live"}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Preview"
          title="What customers will see"
          subtitle="Each surface renders its own native UI from the same data"
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
              <PromoBanner promotion={draft} surface="web" />
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
                <PromoBanner promotion={draft} surface="mobile" dismissible={false} />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
