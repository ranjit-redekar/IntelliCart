import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "admin_session_v1";

export interface AdminUser {
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
}

const directory: AdminUser[] = [
  { email: "admin@intellicart.shop", name: "Admin", role: "owner" },
  { email: "manager@intellicart.shop", name: "Manager", role: "manager" },
  { email: "staff@intellicart.shop", name: "Staff", role: "staff" },
];

interface SessionCtx {
  user: AdminUser | null;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
    else window.localStorage.removeItem(KEY);
  }, [user]);

  const value = useMemo<SessionCtx>(
    () => ({
      user,
      signIn(email, password) {
        const match = directory.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!match) {
          return {
            ok: false,
            error: `No admin found with that email. Try ${directory[0].email}.`,
          };
        }
        if (!password || password.length < 4) {
          return { ok: false, error: "Password must be at least 4 characters." };
        }
        setUser(match);
        return { ok: true };
      },
      signOut() {
        setUser(null);
      },
    }),
    [user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

export { directory as adminDirectory };
