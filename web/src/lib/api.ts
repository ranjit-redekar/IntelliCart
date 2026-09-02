/**
 * The single HTTP client for both apps.
 *
 * The API lives on a different origin than the SPA (the SPA is static on
 * GitHub Pages), so every request is cross-origin and must carry credentials
 * explicitly — `credentials: "include"` is not the default.
 */
const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export class ApiError extends Error {
  // Plain fields, not constructor parameter properties: the project compiles
  // with `erasableSyntaxOnly`, which forbids syntax that emits runtime code.
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  /** First message for a field, for rendering next to the input. */
  field(name: string): string | undefined {
    return this.details?.[name]?.[0];
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Network failure, CORS rejection, API down. Distinct from a 4xx/5xx.
    throw new ApiError(0, "offline", "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    const err = (parsed as { error?: ApiErrorBody } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "request_failed", err?.message ?? res.statusText, err?.details);
  }
  return parsed as T;
}

const safeJson = (t: string): unknown => {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
};

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>("POST", path, body ?? {}, headers),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** Build a query string, dropping empty values so URLs stay clean. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
