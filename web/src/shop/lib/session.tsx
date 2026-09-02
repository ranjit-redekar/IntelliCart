import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../../lib/api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export type AuthResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string[]> };

interface SessionCtx {
  user: SessionUser | null;
  /** Undefined until the first /auth/me resolves — guards must not redirect before then. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

/**
 * Session state comes from the server on every load.
 *
 * The old version kept the whole Customer object in localStorage and treated
 * its presence as proof of identity — anyone could mint one from the console.
 * Now the httpOnly cookie is the credential and the browser cannot read it, so
 * `/auth/me` is the only source of truth.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get<{ user: SessionUser | null; kind?: string }>("/auth/me")
      .then((r) => setUser(r.user && r.kind === "customer" ? r.user : null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const toResult = (err: unknown): AuthResult => {
    if (err instanceof ApiError) return { ok: false, error: err.message, fields: err.details };
    return { ok: false, error: "Something went wrong. Try again." };
  };

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const r = await api.post<{ user: SessionUser }>("/auth/sign-in", { email, password });
      setUser(r.user);
      // Fold anything added while signed out into the account's cart.
      await api.post("/cart/merge").catch(() => {});
      return { ok: true };
    } catch (err) {
      return toResult(err);
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      try {
        const r = await api.post<{ user: SessionUser }>("/auth/sign-up", { name, email, password });
        setUser(r.user);
        await api.post("/cart/merge").catch(() => {});
        return { ok: true };
      } catch (err) {
        return toResult(err);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await api.post("/auth/sign-out").catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<SessionCtx>(
    () => ({ user, ready, signIn, signUp, signOut }),
    [user, ready, signIn, signUp, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
