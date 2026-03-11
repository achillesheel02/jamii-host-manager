import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "../supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether sign-out was explicitly requested by the user
  const explicitSignOut = useRef(false);

  useEffect(() => {
    // Load cached session — works offline because Supabase stores it in localStorage
    supabase.auth.getSession().then(({ data: { session: cached } }) => {
      setSession(cached);
      setUser(cached?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // --- Offline resilience ---
      // When offline, Supabase fires SIGNED_OUT or TOKEN_REFRESHED(null) if the
      // JWT can't be refreshed. Honour that ONLY if the user explicitly signed out.
      // Otherwise, keep the cached session so the app stays usable with local data.
      if (!newSession && !explicitSignOut.current && !navigator.onLine) {
        console.debug(
          `[Auth] Ignoring session loss while offline (event=${event}). ` +
          "Keeping cached session for local-first access.",
        );
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        explicitSignOut.current = false; // reset after handling
      }
    });

    // When coming back online, try a silent token refresh
    const handleOnline = () => {
      console.debug("[Auth] Back online — attempting token refresh");
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          console.debug("[Auth] Token refreshed successfully after reconnect");
        } else if (error) {
          console.warn("[Auth] Token refresh failed after reconnect:", error.message);
          // Don't force sign-out — local data still works
        }
      });
    };
    window.addEventListener("online", handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const signOut = async () => {
    explicitSignOut.current = true;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
