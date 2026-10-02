import type { Page } from "../../lib/api";

export interface CsvColumn {
  key: string;
  label: string;
}

/** One RFC 4180 field, with a leading quote on =,+,-,@ so spreadsheets don't run it as a formula. */
export function csvCell(value: unknown): string {
  let s = value == null ? "" : Array.isArray(value) ? value.join("; ") : String(value);
  // Numbers are safe (and -5 must stay a number); only text can smuggle a formula.
  if (typeof value !== "number" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c.key])).join(","));
  return lines.join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns: CsvColumn[]) {
  // BOM so Excel reads the file as UTF-8.
  const blob = new Blob(["﻿", toCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const EXPORT_CAP = 5000;

/**
 * Fetch every row matching the current filters (pages of 100, the API max),
 * download it, and return what to toast. Never throws.
 */
export async function exportAllCsv<T extends object>(
  noun: string,
  fetchPage: (page: number, pageSize: number) => Promise<Page<T>>,
  columns: CsvColumn[],
): Promise<{ text: string; tone?: "success" }> {
  try {
    const items: T[] = [];
    let total = Infinity;
    for (let page = 1; items.length < Math.min(total, EXPORT_CAP); page++) {
      const res = await fetchPage(page, 100);
      total = res.total;
      items.push(...res.items);
      if (res.items.length === 0) break; // rows deleted mid-export
    }
    const rows = items.slice(0, EXPORT_CAP) as Record<string, unknown>[];
    downloadCsv(`${noun}-${new Date().toISOString().slice(0, 10)}.csv`, rows, columns);
    return total > rows.length
      ? { text: `Exported the first ${rows.length.toLocaleString()} of ${total.toLocaleString()} ${noun}. Narrow the filters for the rest.` }
      : { text: `Exported ${rows.length.toLocaleString()} ${noun}`, tone: "success" };
  } catch (err) {
    return { text: `Export failed: ${err instanceof Error ? err.message : "try again."}` };
  }
}
