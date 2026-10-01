import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * HTTP client for the backend. Mobile authenticates with a Bearer token
 * (returned by sign-in/sign-up) rather than the web's session cookie — React
 * Native has no cookie jar worth relying on, and the API accepts either.
 *
 * Point it at your server with EXPO_PUBLIC_API_URL. On an Android emulator,
 * localhost is the emulator itself: use http://10.0.2.2:3000 instead.
 */
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const TOKEN_KEY = "intellicart_token_v1";

// ponytail: token in AsyncStorage; move to expo-secure-store before a real release.
let token: string | null = null;
export const loadToken = async () => (token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null));
export async function setToken(next: string | null) {
  token = next;
  if (next) await AsyncStorage.setItem(TOKEN_KEY, next).catch(() => {});
  else await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "offline", "Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = (parsed as { error?: { code: string; message: string; details?: Record<string, string[]> } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "request_failed", err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return parsed as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>("POST", path, body ?? {}, headers),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** Query string from defined values only. */
export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
