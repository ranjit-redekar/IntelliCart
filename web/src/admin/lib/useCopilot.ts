import { api } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { AiContentMap, AiCopilot } from "../../../../mockdata/ai";

export interface CopilotResult<K extends AiCopilot> {
  data: AiContentMap[K] | undefined;
  /** "computed" = derived from live rows, "seed" = the seeded row. */
  source: "computed" | "seed" | "model" | undefined;
  generatedAt: string | undefined;
  loading: boolean;
  error: ReturnType<typeof useApi>["error"];
  reload: () => void;
}

/**
 * One AI Hub screen's content, from the database.
 *
 * `AiContentMap` is imported as a *type only*, so TypeScript erases it — the
 * fixture bodies live in the seeder and never reach the browser bundle, but
 * each screen still gets the exact shape it renders.
 */
export function useCopilot<K extends AiCopilot>(copilot: K): CopilotResult<K> {
  const state = useApi(
    () =>
      api.get<{ data: AiContentMap[K]; source: "computed" | "seed" | "model"; generatedAt: string }>(
        `/admin/ai/${copilot}`,
      ),
    [copilot],
  );
  return {
    data: state.data?.data,
    source: state.data?.source,
    generatedAt: state.data?.generatedAt,
    loading: state.loading,
    error: state.error,
    reload: state.reload,
  };
}
