import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { getToken, setToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  it("arranca sin sesión y sin estado de carga en cliente", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("inicia sesión con un JWT válido y expone email y rol", () => {
    const token = makeJwt({ sub: "ana@taskflow.dev", role: "ROLE_MODERATOR" });
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.login(token));

    expect(getToken()).toBe(token);
    expect(result.current.user).toEqual({
      email: "ana@taskflow.dev",
      role: "ROLE_MODERATOR",
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("ignora tokens sin sub", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.login("no-es-un-jwt"));

    expect(getToken()).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("no crea sesión con un JWT válido pero sin sub", () => {
    const token = makeJwt({ sub: undefined });
    setToken(token);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe(token);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("reconstruye la sesión desde localStorage al montar", () => {
    setToken(makeJwt({ sub: "luis@taskflow.dev", role: "ROLE_USER" }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({
      email: "luis@taskflow.dev",
      role: "ROLE_USER",
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("cierra sesión y limpia el token", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.login(makeJwt()));
    act(() => result.current.logout());

    expect(getToken()).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("reacciona a cambios de token externos (otra pestaña)", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => setToken(makeJwt({ sub: "externa@taskflow.dev" })));

    expect(result.current.user?.email).toBe("externa@taskflow.dev");
  });

  it("exige estar dentro de <AuthProvider>", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth debe usarse dentro de <AuthProvider>",
    );
  });
});
