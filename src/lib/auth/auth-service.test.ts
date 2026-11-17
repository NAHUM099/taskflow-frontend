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

  it("avisa del bloqueo temporal y del tiempo de espera cuando responde 429", async () => {
    post.mockRejectedValue(
      responseError(429, { message: "Demasiados intentos." }, { "retry-after": "120" }),
    );

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "Demasiados intentos de inicio de sesión. Vuelve a intentarlo en 2 minutos.",
    );
  });

  it("expresa la espera en segundos cuando es menor de un minuto", async () => {
    post.mockRejectedValue(responseError(429, {}, { "retry-after": "45" }));

    await expect(login(CREDENTIALS)).rejects.toThrow("Vuelve a intentarlo en 45 segundos.");
  });

  it("redondea hacia arriba los segundos del Retry-After", async () => {
    post.mockRejectedValue(responseError(429, {}, { "retry-after": "1" }));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "Vuelve a intentarlo en 1 segundo.",
    );
  });

  it("interpreta el Retry-After aunque llegue como número", async () => {
    post.mockRejectedValue(responseError(429, {}, { "retry-after": 30 }));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "Vuelve a intentarlo en 30 segundos.",
    );
  });

  it("usa el singular cuando la espera es de un minuto exacto", async () => {
    post.mockRejectedValue(responseError(429, {}, { "retry-after": "60" }));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "Vuelve a intentarlo en 1 minuto.",
    );
  });

  it("usa el mensaje genérico de bloqueo si el 429 no trae Retry-After", async () => {
    post.mockRejectedValue(responseError(429));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "Demasiados intentos de inicio de sesión. Espera unos minutos antes de volver a intentarlo.",
    );
  });

  it("usa el mensaje genérico de bloqueo si el 429 no trae Retry-After válido", async () => {
    post.mockRejectedValue(responseError(429, {}, { "retry-after": "desconocido" }));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "Demasiados intentos de inicio de sesión. Espera unos minutos antes de volver a intentarlo.",
    );
  });

  it("usa un mensaje genérico para errores que no son de Axios", async () => {
    post.mockRejectedValue(new Error("unexpected"));

    await expect(login(CREDENTIALS)).rejects.toThrow(
      "No pudimos iniciar sesión. Inténtalo nuevamente.",
    );
  });
});
