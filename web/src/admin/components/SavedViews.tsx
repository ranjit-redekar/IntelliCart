import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bookmark, Plus, X } from "lucide-react";

interface View {
  name: string;
  search: string;
}

function load(key: string): View[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(data)
      ? data.filter((v): v is View => typeof v?.name === "string" && typeof v?.search === "string")
      : [];
  } catch {
    return [];
  }
}

function store(key: string, views: View[]) {
  try {
    localStorage.setItem(key, JSON.stringify(views));
  } catch {
    // Storage full or blocked: the views just won't outlive this page.
  }
}

/**
 * "Views" menu for a list page. A view is the page's search string (minus
 * `page`), saved per page in localStorage.
 */
export default function SavedViews({ pageKey }: { pageKey: string }) {
  const storageKey = `admin_views_v1:${pageKey}`;
  const [params, setParams] = useSearchParams();
  const [views, setViews] = useState(() => load(storageKey));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const current = new URLSearchParams(params);
  current.delete("page");
  const search = current.toString();

  useEffect(() => {
    if (!open) return;
    (panelRef.current?.querySelector<HTMLElement>("button:not(:disabled)") ?? panelRef.current)?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function save(next: View[]) {
    setViews(next);
    store(storageKey, next);
  }

  function saveCurrent() {
    const name = window.prompt("Name this view")?.trim();
    if (!name) return;
    // Same name replaces the old view rather than adding a duplicate.
    save([...views.filter((v) => v.name !== name), { name, search }]);
  }

  function apply(v: View) {
    const next = new URLSearchParams(v.search);
    setParams(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  const itemClass =
    "flex-1 min-w-0 text-left rounded-[8px] px-2.5 py-2 text-[13px] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] focus-visible:bg-[var(--color-surface-2)]";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-sm btn-ghost h-9 whitespace-nowrap"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Bookmark size={14} />
        Views
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          tabIndex={-1}
          role="region"
          aria-label="Saved views"
          className="absolute right-0 top-full mt-2 z-50 w-64 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg p-1.5 outline-none"
        >
          {views.length > 0 && (
            <ul className="pb-1.5 mb-1.5 border-b border-[var(--color-border)]">
              {views.map((v) => (
                <li key={v.name} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => apply(v)}
                    aria-current={v.search === search ? "true" : undefined}
                    className={itemClass + (v.search === search ? " font-semibold" : "")}
                  >
                    <span className="block truncate">{v.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      save(views.filter((x) => x.name !== v.name));
                      panelRef.current?.focus(); // the focused button is about to unmount
                    }}
                    className="btn btn-icon btn-sm btn-ghost shrink-0"
                    aria-label={`Delete view ${v.name}`}
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={saveCurrent}
            disabled={!search}
            title={search ? undefined : "Set a filter or search first"}
            className={itemClass + " w-full flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"}
          >
            <Plus size={14} />
            Save current view…
          </button>
        </div>
      )}
    </div>
  );
}
