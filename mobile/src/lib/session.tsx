import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, loadToken, setToken } from "./api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export type AuthResult = { ok: true } | { ok: false; error: string };

interface SessionCtx {
  user: SessionUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

const fail = (err: unknown): AuthResult => ({
  ok: false,
  error: err instanceof ApiError ? err.message : "Something went wrong. Try again.",
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the saved token, then ask the server who it belongs to. An expired
  // or revoked token comes back as no user, and is dropped.
  useEffect(() => {
    loadToken()
      .then((t) => (t ? api.get<{ user: SessionUser | null }>("/auth/me") : { user: null }))
      .then(async (r) => {
        setUser(r.user);
        if (!r.user) await setToken(null);
      })
      .catch(() => {
        /* offline: stay signed out for now, keep the token for next launch */
      })
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const r = await api.post<{ token: string; user: SessionUser }>("/auth/sign-in", { email: email.trim(), password });
      await setToken(r.token);
      setUser(r.user);
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const r = await api.post<{ token: string; user: SessionUser }>("/auth/sign-up", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await setToken(r.token);
      setUser(r.user);
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }, []);

  const signOut = useCallback(async () => {
    await api.post("/auth/sign-out").catch(() => {});
    await setToken(null);
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
