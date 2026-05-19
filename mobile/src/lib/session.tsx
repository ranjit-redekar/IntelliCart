import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { customers } from "../mockdata";
import type { Customer } from "../../../shared/types";

const KEY = "intellicart_session_v1";

interface SessionCtx {
  user: Customer | null;
  ready: boolean;
  signIn: (email: string) => boolean;
  signUp: (name: string, email: string) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate from AsyncStorage on first mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          setUser(JSON.parse(raw) as Customer);
        } catch {
          /* corrupt entry, ignore */
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on change once hydrated.
  useEffect(() => {
    if (!ready) return;
    if (user) AsyncStorage.setItem(KEY, JSON.stringify(user));
    else AsyncStorage.removeItem(KEY);
  }, [user, ready]);

  const value = useMemo<SessionCtx>(
    () => ({
      user,
      ready,
      signIn(email) {
        const match = customers.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
        if (match) {
          setUser(match);
          return true;
        }
        return false;
      },
      signUp(name, email) {
        setUser({
          id: `C-${Date.now().toString().slice(-4)}`,
          name: name.trim(),
          email: email.trim(),
          orders: 0,
        });
      },
      signOut() {
        setUser(null);
      },
    }),
    [user, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
