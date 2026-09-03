import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../../lib/api";

/**
 * Five roles with a permission table, replacing the old
 * `owner | manager | staff` enum that disagreed with the settings screen.
 * The old `staff` maps to `viewer`.
 */
export type Role = "owner" | "admin" | "manager" | "support" | "viewer";
export type Permission =
  | "billing" | "members" | "roles" | "orders" | "products"
  | "customers" | "settings" | "ai" | "audit";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface SessionCtx {
  user: AdminUser | null;
  permissions: Permission[];
  ready: boolean;
  can: (permission: Permission) => boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  /** Re-read /auth/me — used after registration, which signs you in server-side. */
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get<{ user: AdminUser | null; kind?: string; permissions: Permission[] }>(
        "/auth/me",
      );
      if (r.user && r.kind === "admin") {
        setUser(r.user);
        setPermissions(r.permissions ?? []);
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const r = await api.post<{ user: AdminUser; permissions: Permission[] }>(
        "/auth/admin/sign-in",
        { email: email.trim(), password },
      );
      setUser(r.user);
      setPermissions(r.permissions ?? []);
      return { ok: true } as const;
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof ApiError ? err.message : "Sign-in failed. Try again.",
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    await api.post("/auth/sign-out").catch(() => {});
    setUser(null);
    setPermissions([]);
  }, []);

  const value = useMemo<SessionCtx>(
    () => ({
      user,
      permissions,
      ready,
      // The server enforces this too; here it only decides what to render.
      can: (permission) => permissions.includes(permission),
      signIn,
      signOut,
      refresh,
    }),
    [user, permissions, ready, signIn, signOut, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** Demo accounts shown on the sign-in screen. */
export const adminDirectory: { email: string; name: string; role: Role }[] = [
  { email: "admin@intellicart.shop", name: "Admin", role: "owner" },
  { email: "manager@intellicart.shop", name: "Manager", role: "manager" },
  { email: "staff@intellicart.shop", name: "Staff", role: "viewer" },
];
