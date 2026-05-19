import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { customers } from "../mockdata";
import type { Customer } from "../../../shared/types";

const KEY = "cw_session_v1";

interface SessionCtx {
  user: Customer | null;
  signIn: (email: string) => boolean;
  signUp: (name: string, email: string) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Customer;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(KEY);
    }
  }, [user]);

  const value = useMemo<SessionCtx>(
    () => ({
      user,
      signIn(email) {
        const match = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
        if (match) {
          setUser(match);
          return true;
        }
        return false;
      },
      signUp(name, email) {
        const fake: Customer = {
          id: `C-${Date.now().toString().slice(-4)}`,
          name,
          email,
          orders: 0,
        };
        setUser(fake);
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
