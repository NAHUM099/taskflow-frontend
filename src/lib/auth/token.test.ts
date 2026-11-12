import { describe, expect, it, vi } from "vitest";
import {
  decodeToken,
  getServerTokenSnapshot,
  getToken,
  removeToken,
  setToken,
  subscribeToken,
} from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";

const TOKEN_KEY = "taskflow.token";

describe("almacenamiento del token", () => {
  it("no tiene token al inicio", () => {
    expect(getToken()).toBeNull();
  });

  it("guarda y recupera el token en localStorage", () => {
    setToken("token-123");

    expect(getToken()).toBe("token-123");
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("token-123");
  });

  it("elimina el token", () => {
    setToken("token-123");
    removeToken();

    expect(getToken()).toBeNull();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("sobrescribe el token existente", () => {
    setToken("viejo");
    setToken("nuevo");

    expect(getToken()).toBe("nuevo");
  });
});

describe("subscribeToken", () => {
  it("notifica al guardar y al eliminar el token", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToken(listener);

    setToken("token-123");
    removeToken();

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("notifica cambios hechos en otra pestaña (evento storage)", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToken(listener);

    window.dispatchEvent(new Event("storage"));

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("deja de notificar al desuscribirse", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToken(listener);

    unsubscribe();
    setToken("token-123");
    window.dispatchEvent(new Event("storage"));

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("guards de SSR", () => {
  it("no toca localStorage cuando no hay window", () => {
    vi.stubGlobal("window", undefined);

    expect(getToken()).toBeNull();
    expect(() => setToken("token-123")).not.toThrow();
    expect(() => removeToken()).not.toThrow();
    expect(subscribeToken(() => {})()).toBeUndefined();
    expect(getServerTokenSnapshot()).toBeNull();

    vi.unstubAllGlobals();
  });
});

describe("decodeToken", () => {
  it("decodifica un JWT con payload base64url", () => {
    const token = makeJwt({ sub: "ana@taskflow.dev", role: "ROLE_ADMIN" });

    expect(decodeToken(token)).toMatchObject({
      sub: "ana@taskflow.dev",
      role: "ROLE_ADMIN",
    });
  });

  it("admite payloads base64url (− y _) y restaura el padding", () => {
    const json = '{"sub":">>>","role":"???"}';
    const base64 = btoa(json);
    const base64url = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `cabecera.${base64url}.firma`;

    expect(base64).toMatch(/[+/=]/);
    expect(base64url).toMatch(/[-_]/);
    expect(decodeToken(token)).toMatchObject({ sub: ">>>", role: "???" });
  });

  it("devuelve null si el token no tiene payload", () => {
    expect(decodeToken("")).toBeNull();
    expect(decodeToken("solo-una-parte")).toBeNull();
    expect(decodeToken("cabecera.")).toBeNull();
  });

  it("devuelve null si el payload no es JSON válido", () => {
    const header = btoa('{"alg":"HS256"}');
    const body = btoa("no-es-json");

    expect(decodeToken(`${header}.${body}.firma`)).toBeNull();
  });

  it("documenta que no valida exp: un token caducado se decodifica", () => {
    const expired = makeJwt({ exp: 1 });

    expect(decodeToken(expired)?.exp).toBe(1);
  });
});
