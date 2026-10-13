"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  decodeToken,
  getServerTokenSnapshot,
  getTokenSnapshot,
  removeToken,
  setToken,
  subscribeToken,
} from "@/lib/auth/token";
import type { AuthUser } from "@/lib/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribeNoop(): () => void {
  return () => {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(
    subscribeToken,
    getTokenSnapshot,
    getServerTokenSnapshot,
  );

  const isHydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const user = useMemo<AuthUser | null>(() => {
    if (!token) {
      return null;
    }
    const payload = decodeToken(token);
    if (!payload?.sub) {
      return null;
    }
    return { email: payload.sub, role: payload.role };
  }, [token]);

  const login = useCallback((newToken: string) => {
    const payload = decodeToken(newToken);
    if (!payload?.sub) {
      return;
    }
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: user !== null,
      isLoading: !isHydrated,
      login,
      logout,
    }),
    [user, token, isHydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
