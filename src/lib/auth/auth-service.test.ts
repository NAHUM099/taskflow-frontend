import { beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "@/lib/auth/auth-service";
import { networkError, responseError } from "@/test/axios";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/lib/api", () => ({ api: { post } }));

const CREDENTIALS = { email: "ana@taskflow.dev", password: "secreto" };

describe("login", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("envía las credenciales y devuelve el token", async () => {
    post.mockResolvedValue({ data: { token: "jwt-123" } });

    await expect(login(CREDENTIALS)).resolves.toBe("jwt-123");
    expect(post).toHaveBeenCalledWith("/auth/login", CREDENTIALS);
  });

  it("traduce el 401 a credenciales incorrectas", async () => {
    post.mockRejectedValue(responseError(401, { message: "Bad credentials" }));

    await expect(login(CREDENTIALS)).rejects.toThrow("Credenciales incorrectas.");
  });

  it("avisa cuando no hay conexión con el backend", async () => {
    post.mockRejectedValue(networkError());

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "No pudimos conectar con el servidor. Inténtalo nuevamente.",
    );
  });

  it("usa un mensaje genérico para otros errores HTTP", async () => {
    post.mockRejectedValue(responseError(500, { message: "boom" }));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "No pudimos iniciar sesión. Inténtalo nuevamente.",
    );
  });

  it("usa un mensaje genérico para errores que no son de Axios", async () => {
    post.mockRejectedValue(new Error("unexpected"));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "No pudimos iniciar sesión. Inténtalo nuevamente.",
    );
  });
});
