import { useCallback, useRef, useState } from "react";
import {
  ArrowUp,
  Image as ImageIcon,
  Star,
  UploadCloud,
  X,
} from "lucide-react";
import type { ProductImage, PromotionTheme } from "../types";
import { cn } from "../lib/cn";

const themeAccent: Record<PromotionTheme, string> = {
  brand: "var(--color-brand-500)",
  violet: "var(--color-accent-violet)",
  mint: "var(--color-accent-mint)",
  amber: "var(--color-accent-amber)",
  rose: "var(--color-accent-rose)",
};

const themeRotation: PromotionTheme[] = ["brand", "violet", "mint", "amber", "rose"];

const MAX_IMAGES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB soft limit (warning only)
const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp,image/avif,image/gif";

interface Props {
  value: ProductImage[];
  onChange: (next: ProductImage[]) => void;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function deriveInitialsFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const letters = base
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return (letters || base.slice(0, 2)).toUpperCase();
}

export default function MediaUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setWarning(null);
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) {
        setWarning("Only image files are supported.");
        return;
      }
      const room = MAX_IMAGES - value.length;
      if (room <= 0) {
        setWarning(`Limit of ${MAX_IMAGES} images reached.`);
        return;
      }
      const toAdd = arr.slice(0, room);
      const oversize = toAdd.find((f) => f.size > MAX_FILE_BYTES);
      if (oversize) {
        setWarning(`"${oversize.name}" is over 5 MB. It was added but should be compressed before publishing.`);
      }

      const next: ProductImage[] = [...value];
      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
        try {
          const url = await fileToDataURL(file);
          next.push({
            id: `i-${Date.now()}-${i}`,
            initials: deriveInitialsFromName(file.name),
            theme: themeRotation[(value.length + i) % themeRotation.length],
            caption: "",
            url,
          });
        } catch {
          // skip files that fail to read
        }
      }
      onChange(next);
      if (arr.length > room) {
        setWarning(`Only added ${room} — limit of ${MAX_IMAGES} reached.`);
      }
    },
    [onChange, value]
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function remove(id: string) {
    onChange(value.filter((x) => x.id !== id));
  }

  function setPrimary(id: string) {
    const idx = value.findIndex((x) => x.id === id);
    if (idx <= 0) return;
    const next = [...value];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    onChange(next);
  }

  function updateCaption(id: string, caption: string) {
    onChange(value.map((x) => (x.id === id ? { ...x, caption } : x)));
  }

  const canAddMore = value.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => canAddMore && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && canAddMore) inputRef.current?.click();
        }}
        className={cn(
          "rounded-[14px] border-2 border-dashed transition-all px-5 py-7 text-center cursor-pointer",
          dragOver
            ? "border-[var(--color-brand-400)] bg-[color-mix(in_oklab,var(--color-brand-500)_8%,transparent)]"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-brand-400)] hover:bg-[var(--color-surface-2)]",
          !canAddMore && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={onPick}
          disabled={!canAddMore}
        />
        <span
          className="w-11 h-11 mx-auto rounded-[12px] flex items-center justify-center text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-violet))",
          }}
        >
          <UploadCloud size={20} />
        </span>
        <p className="text-[14px] font-semibold tracking-tight mt-3">
          {dragOver ? "Drop to upload" : "Drop images here or click to upload"}
        </p>
        <p className="text-[12px] text-muted mt-1">
          PNG, JPG, WebP, AVIF, or GIF · up to {MAX_IMAGES} images
        </p>
      </div>

      {warning && (
        <p className="text-[12px] text-[var(--color-accent-amber)] font-medium">{warning}</p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((img, idx) => {
            const swatch = themeAccent[img.theme];
            const isPrimary = idx === 0;
            return (
              <div
                key={img.id}
                className={cn(
                  "relative rounded-[12px] overflow-hidden border bg-[var(--color-surface)]",
                  isPrimary
                    ? "border-[var(--color-brand-400)] ring-2 ring-[color-mix(in_oklab,var(--color-brand-500)_18%,transparent)]"
                    : "border-[var(--color-border)]"
                )}
              >
                <div
                  className="aspect-square relative overflow-hidden"
                  style={
                    img.url
                      ? { background: "var(--color-surface-2)" }
                      : {
                          background: `linear-gradient(135deg, color-mix(in oklab, ${swatch} 22%, var(--color-surface-2)), var(--color-surface-2))`,
                        }
                  }
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.caption || `Product image ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[28px] font-bold tracking-wider"
                      style={{ color: swatch }}
                    >
                      {(img.initials || "P").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {isPrimary && (
                    <span
                      className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md backdrop-blur"
                      style={{
                        color: "var(--color-brand-700)",
                        background: "color-mix(in oklab, var(--color-surface) 88%, transparent)",
                      }}
                    >
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(img.id)}
                    aria-label="Remove image"
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] backdrop-blur border border-[var(--color-border)] flex items-center justify-center hover:text-[var(--color-accent-rose)] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="p-2 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={img.caption ?? ""}
                    onChange={(e) => updateCaption(img.id, e.target.value)}
                    className="input h-7 text-[11.5px] !px-2"
                  />
                  <div className="flex items-center gap-1">
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(img.id)}
                        className="text-[10.5px] font-semibold text-muted hover:text-[var(--color-text)] inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--color-surface-2)]"
                      >
                        <ArrowUp size={10} /> Make primary
                      </button>
                    )}
                    {isPrimary && (
                      <span className="text-[10.5px] font-semibold text-subtle inline-flex items-center gap-1 px-1.5 py-0.5">
                        <Star size={10} className="fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]" />
                        Cover
                      </span>
                    )}
                    <span className="ml-auto text-[10.5px] text-subtle inline-flex items-center gap-1">
                      <ImageIcon size={10} />
                      {idx + 1}/{value.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-[3/4] rounded-[12px] border-2 border-dashed border-[var(--color-border-strong)] flex flex-col items-center justify-center text-subtle hover:border-[var(--color-brand-400)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors gap-1"
            >
              <UploadCloud size={18} />
              <span className="text-[11.5px] font-semibold">Add more</span>
            </button>
          )}
        </div>
      )}

      <p className="text-[11.5px] text-subtle">
        First image is used as the cover everywhere. Drag images in or click to browse.
      </p>
    </div>
  );
}
