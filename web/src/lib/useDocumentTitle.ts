import { useEffect } from "react";

/**
 * Sets the browser tab title while the calling component is mounted.
 * Pass null to leave the title alone (e.g. while data is still loading).
 * Effects run child-first, so a page's title is set before its shell's; shells
 * should skip routes whose pages set their own.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
