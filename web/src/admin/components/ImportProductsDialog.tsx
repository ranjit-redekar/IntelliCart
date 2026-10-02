import { useEffect, useRef, useState } from "react";
import { Download, FileUp, Loader2, X } from "lucide-react";
import { useFocusTrap } from "../../lib/useFocusTrap";
import { api } from "../../lib/api";
import { toast } from "../../lib/toast";
import { downloadCsv, parseCsv, type CsvColumn } from "../lib/csv";
import { Chip } from "./ui/StatusChip";
import { cn } from "../lib/cn";

interface RowResult {
  row: number;
  sku: string;
  action: "create" | "update" | "skip";
  errors?: string[];
}
interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  results: RowResult[];
}

interface Props {
  /** The export's columns: headers are matched by label (or key), so an exported file re-imports. */
  columns: CsvColumn[];
  onClose: () => void;
  onImported: () => void;
}

const MAX_ROWS = 1000;

/** CSV text -> one object per data row, keyed by column key. Unknown headers are ignored. */
function toRows(text: string, columns: CsvColumn[]) {
  const [header = [], ...body] = parseCsv(text);
  const keys = header.map((h) => {
    const t = h.trim().toLowerCase();
    return columns.find((c) => c.label.toLowerCase() === t || c.key.toLowerCase() === t)?.key;
  });
  if (!keys.includes("sku") && !keys.includes("id")) throw new Error("The file needs a SKU or ID column.");
  return body
    .filter((cells) => cells.some((c) => c.trim()))
    .map((cells) => Object.fromEntries(keys.flatMap((k, i) => (k ? [[k, cells[i] ?? ""]] : []))));
}

export default function ImportProductsDialog({ columns, onClose, onImported }: Props) {
  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "checking" | "importing">("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && busy !== "importing") onClose();
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => fileRef.current?.focus());
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setError("");
    try {
      const parsed = toRows(await file.text(), columns);
      if (!parsed.length) throw new Error("The file has no product rows.");
      if (parsed.length > MAX_ROWS) throw new Error(`The file has ${parsed.length.toLocaleString()} rows; import at most ${MAX_ROWS.toLocaleString()} at a time.`);
      setRows(parsed);
      setBusy("checking");
      setPreview(await api.post<ImportResult>("/admin/products/import", { rows: parsed, dryRun: true }));
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setBusy("");
    }
  }

  async function commit() {
    setBusy("importing");
    try {
      const r = await api.post<ImportResult>("/admin/products/import", { rows });
      const parts = [r.created && `${r.created} created`, r.updated && `${r.updated} updated`, r.skipped && `${r.skipped} skipped`].filter(Boolean);
      toast(`Import done: ${parts.join(", ")}`, r.skipped ? undefined : "success");
      onImported();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed. Try again.");
      setBusy("");
    }
  }

  const ready = preview ? preview.created + preview.updated : 0;
  const failed = preview?.results.filter((r) => r.errors?.length) ?? [];

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
      aria-describedby="import-desc"
    >
      <button type="button" aria-label="Close dialog" tabIndex={-1} onClick={busy === "importing" ? undefined : onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col card-surface rounded-t-[20px] sm:rounded-[18px] shadow-[var(--shadow-pop)] overflow-hidden fade-up">
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <h2 id="import-title" className="text-[18px] font-semibold tracking-tight leading-tight">Import products</h2>
            <p id="import-desc" className="text-[12.5px] text-muted mt-0.5">
              Rows whose SKU or ID matches a product update it; blank cells leave a field as is. Other rows create new products.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy === "importing"} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto">
          <label
            className={cn(
              "flex flex-col items-center gap-2 rounded-[14px] border-2 border-dashed px-4 py-6 text-center cursor-pointer",
              dragging ? "border-[var(--color-brand-500)]" : "border-[var(--color-border)]",
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
          >
            <FileUp size={20} className="text-subtle" aria-hidden />
            <span className="text-[13px] font-medium">{fileName || "Choose a .csv file or drop it here"}</span>
            <span className="text-[12px] text-muted">Same columns as Export CSV, up to {MAX_ROWS.toLocaleString()} rows.</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={!!busy}
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
            />
          </label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadCsv("products-template.csv", [], columns)}>
            <Download size={14} /> Download template
          </button>

          <div aria-live="polite" className="space-y-3">
            {busy === "checking" && (
              <p className="text-[13px] text-muted flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Checking {rows.length} rows…</p>
            )}
            {error && <p role="alert" className="text-[13px] text-[var(--color-accent-rose)]">{error}</p>}
            {preview && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Chip tone="success">{preview.created} to create</Chip>
                  <Chip tone="info">{preview.updated} to update</Chip>
                  <Chip tone={failed.length ? "danger" : "neutral"}>{failed.length} with errors</Chip>
                </div>
                {failed.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <caption className="sr-only">Rows that won't be imported</caption>
                      <thead>
                        <tr className="text-left text-subtle">
                          <th scope="col" className="py-1.5 pr-3 font-medium">Row</th>
                          <th scope="col" className="py-1.5 pr-3 font-medium">SKU</th>
                          <th scope="col" className="py-1.5 font-medium">Problem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failed.map((r) => (
                          <tr key={r.row} className="border-t border-[var(--color-border)] align-top">
                            {/* +1 for the header, so it matches the spreadsheet's row number. */}
                            <td className="py-1.5 pr-3 tabular-nums">{r.row + 1}</td>
                            <td className="py-1.5 pr-3">{r.sku || "—"}</td>
                            <td className="py-1.5">{r.errors!.join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <footer className="flex justify-end gap-2 px-5 sm:px-6 py-4 border-t border-[var(--color-border)]">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy === "importing"}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={commit} disabled={!ready || !!busy} aria-busy={busy === "importing"}>
            {busy === "importing" && <Loader2 size={14} className="animate-spin" />}
            Import {ready} {ready === 1 ? "product" : "products"}
          </button>
        </footer>
      </div>
    </div>
  );
}
