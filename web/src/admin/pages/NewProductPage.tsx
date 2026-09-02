import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  DollarSign,
  Image as ImageIcon,
  ListChecks,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { ProductImage, ProductSpec } from "../types";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import { ErrorState, Skeleton } from "../../lib/AsyncBoundary";

interface EditingProduct {
  id: string; name: string; description: string; sku: string; categoryId: string;
  price: number; comparePrice: number | null; cost: number | null;
  stock: number; lowStock: number; trackInventory: boolean; image: string;
  status: "draft" | "active" | "archived"; tags: string[];
  images: ProductImage[]; specs: ProductSpec[]; highlights: string[]; inBox: string[];
}
import { Card, CardHeader } from "../components/ui/Card";
import { Chip } from "../components/ui/StatusChip";
import { PageHeader } from "../components/ui/PageHeader";
import AiDraftDialog from "../components/AiDraftDialog";
import TagMultiSelect from "../components/TagMultiSelect";
import MediaUploader from "../components/MediaUploader";
import { cn } from "../lib/cn";

const commonTagSuggestions = [
  "new arrival",
  "bestseller",
  "sale",
  "limited edition",
  "eco-friendly",
  "handmade",
  "premium",
  "exclusive",
];

const tagsByCategory: Record<string, string[]> = {
  fashion: ["casual", "formal", "summer", "winter", "unisex", "vintage", "streetwear"],
  electronics: ["wireless", "smart", "rechargeable", "portable", "bluetooth", "energy-efficient"],
  home: ["minimal", "scandinavian", "decor", "lighting", "sustainable", "ceramic"],
};

const categoryAccent: Record<string, string> = {
  fashion: "var(--color-brand-500)",
  electronics: "var(--color-accent-violet)",
  home: "var(--color-accent-mint)",
};


const statuses = [
  { id: "draft", label: "Draft", tone: "neutral" as const, hint: "Hidden from storefront" },
  { id: "active", label: "Active", tone: "success" as const, hint: "Live and purchasable" },
  { id: "scheduled", label: "Scheduled", tone: "info" as const, hint: "Goes live at a later date" },
];

function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[12.5px] font-semibold flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-accent-rose)]">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11.5px] text-subtle mt-1">{hint}</p>}
    </label>
  );
}

/** SKU placeholder for a new product. The server assigns the real id. */
function nextProductId() {
  return `SKU-${Date.now().toString(36).toUpperCase()}`;
}

export default function NewProductPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();

  const catState = useApi(
    () => api.get<{ items: { id: string; name: string }[] }>("/categories"),
    [],
  );
  const editState = useApi(
    () =>
      routeId
        ? api.get<EditingProduct>(`/admin/products/${routeId}`)
        : Promise.resolve(null),
    [routeId],
  );
  const editing = editState.data;
  const isEditMode = Boolean(routeId);
  const selectableCategories = catState.data?.items ?? [];

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [name, setName] = useState("");
  const [sku, setSku] = useState(nextProductId());
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [comparePrice, setComparePrice] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [lowStock, setLowStock] = useState<string>("10");
  const [trackInventory, setTrackInventory] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<string>(isEditMode ? "active" : "draft");
  const [tags, setTags] = useState<string[]>([]);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiBannerDismissed, setAiBannerDismissed] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([
    { id: "i1", initials: "P1", theme: "brand", caption: "Front" },
  ]);
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { key: "Material", value: "" },
    { key: "Country of origin", value: "" },
  ]);
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Fill the form once, when the product arrives, and never again — a refetch
  // must not overwrite what the operator has typed. Adjusting state during
  // render is React's documented pattern for this; an effect would render
  // twice and briefly show empty fields.
  if (editing && seededFor !== editing.id) {
    setSeededFor(editing.id);
    setName(editing.name);
    setSku(editing.sku);
    setDescription(editing.description);
    setPrice(String(editing.price));
    setComparePrice(editing.comparePrice == null ? "" : String(editing.comparePrice));
    setCost(editing.cost == null ? "" : String(editing.cost));
    setStock(String(editing.stock));
    setLowStock(String(editing.lowStock));
    setTrackInventory(editing.trackInventory);
    setCategoryId(editing.categoryId);
    setStatus(editing.status);
    setTags(editing.tags);
    if (editing.images.length) setImages(editing.images.map((img) => ({ ...img })));
    if (editing.specs.length) setSpecs(editing.specs.map((sp) => ({ ...sp })));
    if (editing.highlights.length) setHighlights([...editing.highlights]);
  }

  // Default the category once the list loads.
  const firstCategoryId = selectableCategories[0]?.id;
  if (!categoryId && firstCategoryId) setCategoryId(firstCategoryId);

  const accent = categoryAccent[categoryId] ?? "var(--color-brand-500)";
  const initials = useMemo(
    () =>
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?",
    [name]
  );

  const priceNum = Number(price) || 0;
  const costNum = Number(cost) || 0;
  const margin = priceNum > 0 && costNum > 0 ? Math.round(((priceNum - costNum) / priceNum) * 100) : null;

  const tagSuggestions = useMemo(
    () => [...(tagsByCategory[categoryId] ?? []), ...commonTagSuggestions],
    [categoryId]
  );

  const backHref = isEditMode ? `/products/${routeId}` : "/products";
  const backLabel = isEditMode ? "Back to product" : "Back to products";

  /**
   * Actually saves. This used to validate and then call navigate() — a
   * 676-line form that discarded everything the operator typed.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !price || saving) return;
    setSaving(true);
    setSaveError(null);
    setFieldErrors({});

    const body = {
      name: name.trim(),
      description,
      sku: sku.trim(),
      categoryId,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      cost: cost ? Number(cost) : null,
      stock: Number(stock) || 0,
      lowStock: Number(lowStock) || 0,
      trackInventory,
      image: images.find((i) => i.url)?.url ?? editing?.image ?? "",
      status,
      tags,
      images,
      specs: specs.filter((sp) => sp.key.trim() && sp.value.trim()),
      highlights: highlights.filter((h) => h.trim()),
      inBox: editing?.inBox ?? [],
    };

    try {
      if (isEditMode && routeId) {
        await api.put(`/admin/products/${routeId}`, body);
        navigate(`/products/${routeId}`);
      } else {
        const created = await api.post<{ id: string }>("/admin/products", body);
        navigate(`/products/${created.id}`);
      }
    } catch (err) {
      const e2 = err as { message?: string; details?: Record<string, string[]> };
      setSaveError(e2.message ?? "Could not save the product.");
      if (e2.details) setFieldErrors(e2.details);
    } finally {
      setSaving(false);
    }
  }

  if (isEditMode && editState.loading && !editing) return <Skeleton rows={6} />;
  if (isEditMode && editState.error) {
    return <ErrorState error={editState.error} onRetry={editState.reload} />;
  }

  const canSave = name.trim().length > 0 && Number(price) > 0 && !saving;

  const saveBanner = saveError ? (
    <div
      role="alert"
      className="rounded-[10px] px-3.5 py-2.5 text-[13px]"
      style={{
        color: "var(--color-accent-rose)",
        background: "color-mix(in oklab, var(--color-accent-rose) 10%, transparent)",
      }}
    >
      {saveError}
      {Object.entries(fieldErrors).length > 0 && (
        <ul className="mt-1.5 list-disc pl-4">
          {Object.entries(fieldErrors).map(([field, messages]) => (
            <li key={field}>
              <span className="font-medium">{field}</span>: {messages.join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveBanner}
      <div className="fade-up">
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-3"
        >
          <ArrowLeft size={14} /> {backLabel}
        </Link>
      </div>

      <PageHeader
        eyebrow={isEditMode ? `Catalog · Editing ${routeId}` : "Catalog · New product"}
        title={name.trim() || (isEditMode ? (editing?.name ?? "Product") : "Untitled product")}
        description={
          isEditMode
            ? "Update the details below. Changes save to this product instantly."
            : "Add a new item to your catalog. You can save it as a draft and publish when ready."
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate(backHref)}
              className="btn btn-ghost btn-sm"
            >
              {isEditMode ? "Cancel" : "Discard"}
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={cn("btn btn-primary btn-sm", !canSave && "opacity-60 cursor-not-allowed")}
            >
              <Save size={14} /> {isEditMode ? "Save changes" : "Save product"}
            </button>
          </>
        }
      />

      {!aiBannerDismissed && (
        <div
          className="relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-[14px] border p-4 fade-up overflow-hidden"
          style={{
            borderColor: "color-mix(in oklab, var(--color-accent-violet) 28%, var(--color-border))",
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--color-accent-violet) 10%, var(--color-surface)), var(--color-surface))",
          }}
        >
          <span
            className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
            style={{
              background: "color-mix(in oklab, var(--color-accent-violet) 18%, transparent)",
              color: "var(--color-accent-violet)",
            }}
          >
            <Sparkles size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold tracking-tight">Start with an AI draft</p>
            <p className="text-[12px] text-muted mt-0.5">
              {name.trim()
                ? `Generate a polished description for "${name.trim()}" — pick a tone, choose a length, and we'll draft three variants.`
                : "Add a product name, then we'll generate a polished description in your brand voice."}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setAiDraftOpen(true)}
              disabled={!name.trim()}
              className={cn("btn btn-primary btn-sm", !name.trim() && "opacity-60 cursor-not-allowed")}
            >
              <Sparkles size={13} /> Draft with AI
            </button>
            <button
              type="button"
              onClick={() => setAiBannerDismissed(true)}
              aria-label="Dismiss"
              className="btn btn-icon btn-sm btn-ghost"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 fade-up-stagger">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader
              eyebrow="Basics"
              title="Product details"
              subtitle="Customers see this on the product page and search results"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" required className="md:col-span-2">
                <input
                  className="input"
                  placeholder="e.g. Linen Field Jacket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="SKU" hint="Auto-generated. Edit to match your inventory system.">
                <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} />
              </Field>
              <Field label="Category" required>
                <select
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {selectableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="product-description" className="text-[12.5px] font-semibold">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={() => setAiDraftOpen(true)}
                    disabled={!name.trim()}
                    className={cn(
                      "inline-flex items-center gap-1 text-[11.5px] font-semibold rounded-md px-1.5 py-0.5 transition-colors",
                      !name.trim()
                        ? "text-subtle cursor-not-allowed"
                        : "text-[var(--color-accent-violet)] hover:bg-[color-mix(in_oklab,var(--color-accent-violet)_12%,transparent)]"
                    )}
                  >
                    <Sparkles size={11} />
                    {description ? "Redraft" : "Draft"} with AI
                  </button>
                </div>
                <div className="mt-1.5">
                  <textarea
                    id="product-description"
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell the story of this product — materials, fit, and what makes it special."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <p className="text-[11.5px] text-subtle mt-1">Markdown is supported</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Pricing"
              title="Price & cost"
              subtitle="Compare-at price shows as a strikethrough on the storefront"
              action={
                margin !== null ? (
                  <Chip tone={margin > 40 ? "success" : margin > 15 ? "info" : "pending"}>
                    {margin}% margin
                  </Chip>
                ) : undefined
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Price" required>
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input pl-9"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Compare at" hint="Original price for sales">
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input pl-9"
                    placeholder="0.00"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Cost per item" hint="Used for margin & reports">
                <div className="relative">
                  <DollarSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input pl-9"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Inventory"
              title="Stock & alerts"
              subtitle="Track quantities and get notified when you're running low"
              action={
                <label className="inline-flex items-center gap-2 text-[12.5px] font-medium text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-brand-500)]"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                  />
                  Track inventory
                </label>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="On-hand quantity">
                <div className="relative">
                  <Boxes
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    type="number"
                    min={0}
                    step="1"
                    className="input pl-9"
                    placeholder="0"
                    disabled={!trackInventory}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Low-stock threshold" hint="Show a warning when stock drops below this">
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="input"
                  disabled={!trackInventory}
                  value={lowStock}
                  onChange={(e) => setLowStock(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Discovery"
              title="Tags"
              subtitle="Pick from suggestions or type to create your own"
            />
            <TagMultiSelect
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
              placeholder="Search or create a tag…"
            />
          </Card>

          <Card>
            <CardHeader
              eyebrow="Media"
              title="Product images"
              subtitle="Drop images or browse. The first one is used as the cover everywhere."
            />
            <MediaUploader value={images} onChange={setImages} />
          </Card>

          <Card>
            <CardHeader
              eyebrow="Highlights"
              title="Key selling points"
              subtitle="Short bullets shown beneath the price on the product page"
              action={
                <button
                  type="button"
                  onClick={() => setHighlights((c) => [...c, ""])}
                  className="btn btn-ghost btn-sm"
                  disabled={highlights.length >= 8}
                >
                  <Plus size={13} /> Add
                </button>
              }
            />
            <ul className="space-y-2">
              {highlights.map((h, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-[12px] text-subtle tabular-nums w-6">{idx + 1}.</span>
                  <input
                    className="input h-10 flex-1"
                    placeholder="e.g. Heavyweight Belgian linen, garment-washed for softness"
                    value={h}
                    onChange={(e) =>
                      setHighlights((c) => c.map((x, i) => (i === idx ? e.target.value : x)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setHighlights((c) => c.filter((_, i) => i !== idx))}
                    disabled={highlights.length <= 1}
                    aria-label="Remove highlight"
                    className="btn btn-icon btn-sm btn-ghost text-subtle hover:text-[var(--color-accent-rose)] disabled:opacity-40"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              eyebrow="Custom fields"
              title="Specifications"
              subtitle="Key/value pairs shown in the spec sheet"
              action={
                <button
                  type="button"
                  onClick={() => setSpecs((c) => [...c, { key: "", value: "" }])}
                  className="btn btn-ghost btn-sm"
                  disabled={specs.length >= 20}
                >
                  <Plus size={13} /> Add field
                </button>
              }
            />
            <div className="space-y-2">
              {specs.map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2">
                  <input
                    className="input h-10"
                    placeholder="Field name"
                    value={s.key}
                    onChange={(e) =>
                      setSpecs((c) =>
                        c.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x))
                      )
                    }
                  />
                  <input
                    className="input h-10"
                    placeholder="Value"
                    value={s.value}
                    onChange={(e) =>
                      setSpecs((c) =>
                        c.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x))
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs((c) => c.filter((_, i) => i !== idx))}
                    disabled={specs.length <= 1}
                    aria-label="Remove field"
                    className="btn btn-icon btn-sm btn-ghost text-subtle hover:text-[var(--color-accent-rose)] disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-subtle mt-3 inline-flex items-center gap-1.5">
              <ListChecks size={12} /> Add anything that doesn't fit the standard fields — dimensions, certifications, region, materials, etc.
            </p>
          </Card>
        </div>

        <aside className="space-y-6 min-w-0">
          <Card padded={false} className="overflow-hidden">
            <div
              className="h-44 relative overflow-hidden"
              style={{
                background: images[0]?.url
                  ? "var(--color-surface-2)"
                  : `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, var(--color-surface-2)), var(--color-surface-2))`,
              }}
            >
              {images[0]?.url ? (
                <img
                  src={images[0].url}
                  alt={images[0].caption || "Product preview"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <span className="absolute inset-0 bg-grid opacity-50" aria-hidden />
                  <span
                    className="absolute right-3 bottom-3 text-[56px] font-bold tracking-[-0.04em] leading-none"
                    style={{
                      color: `color-mix(in oklab, ${accent} 38%, var(--color-text))`,
                      opacity: 0.22,
                    }}
                    aria-hidden
                  >
                    {initials}
                  </span>
                </>
              )}
              <span
                className="absolute top-3 left-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-md backdrop-blur"
                style={{
                  color: accent,
                  background: "color-mix(in oklab, var(--color-surface) 85%, transparent)",
                }}
              >
                {selectableCategories.find((c) => c.id === categoryId)?.name ?? "Uncategorized"}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold truncate">
                    {name.trim() || "Untitled product"}
                  </p>
                  <p className="text-[12px] text-subtle">{sku}</p>
                </div>
                <p className="text-[15px] font-semibold tabular-nums">
                  ${priceNum.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-soft btn-sm w-full justify-center"
              >
                <ImageIcon size={13} /> Upload images
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Visibility" title="Status" />
            <div className="space-y-2">
              {statuses.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    "flex items-start gap-3 rounded-[10px] border p-3 cursor-pointer transition-colors",
                    status === s.id
                      ? "border-[var(--color-border-strong)] bg-[var(--color-surface-2)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s.id}
                    checked={status === s.id}
                    onChange={() => setStatus(s.id)}
                    className="mt-0.5 accent-[var(--color-brand-500)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">{s.label}</span>
                      <Chip tone={s.tone}>{s.id}</Chip>
                    </div>
                    <p className="text-[11.5px] text-subtle mt-0.5">{s.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>

        </aside>
      </div>

      <AiDraftDialog
        open={aiDraftOpen}
        productName={name}
        category={selectableCategories.find((c) => c.id === categoryId)?.name ?? ""}
        onClose={() => setAiDraftOpen(false)}
        onInsert={(text) => setDescription(text)}
      />
    </form>
  );
}
