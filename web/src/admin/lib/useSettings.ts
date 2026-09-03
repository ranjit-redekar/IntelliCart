import { useCallback, useState } from "react";
import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";

export type SettingsScope =
  | "store" | "localization" | "shipping" | "payments" | "authentication" | "webhooks";

/**
 * One settings scope, read from and written back to the database.
 *
 * These screens used to render hardcoded consts and uncontrolled inputs with
 * `defaultValue`, so nothing a person typed went anywhere.
 */
export function useSettings<T>(scope: SettingsScope) {
  const state = useApi(() => api.get<{ scope: string; value: T }>(`/admin/settings/${scope}`), [scope]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback(
    async (value: Partial<T>) => {
      setSaving(true);
      setSaveError(null);
      setSaved(false);
      try {
        await api.put(`/admin/settings/${scope}`, { ...(state.data?.value ?? ({} as T)), ...value });
        state.reload();
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Could not save.");
      } finally {
        setSaving(false);
      }
    },
    [scope, state],
  );

  return {
    value: state.data?.value,
    loading: state.loading,
    error: state.error,
    reload: state.reload,
    save,
    saving,
    saved,
    saveError,
  };
}
