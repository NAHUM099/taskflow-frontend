import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "@/lib/errors";
import { networkError, responseError } from "@/test/axios";

describe("getApiErrorMessage", () => {
  it("devuelve el mensaje de un Error no-Axios", () => {
    expect(getApiErrorMessage(new Error("algo falló"))).toBe("algo falló");
  });

  it("usa el fallback para valores que no son Error", () => {
    expect(getApiErrorMessage("boom")).toBe("Ocurrió un error inesperado.");
    expect(getApiErrorMessage(undefined, "Fallback propio")).toBe(
      "Fallback propio",
    );
  });

  it("avisa cuando no hay respuesta del servidor", () => {
    expect(getApiErrorMessage(networkError())).toBe(
      "No pudimos conectar con el servidor.",
    );
  });

  it("prioriza el mensaje del backend en 400", () => {
    expect(
      getApiErrorMessage(responseError(400, { message: "El título es obligatorio." })),
    ).toBe("El título es obligatorio.");
  });

  it("usa un mensaje por defecto en 400 sin message", () => {
    expect(getApiErrorMessage(responseError(400, {}))).toBe(
      "Los datos enviados no son válidos.",
    );
  });

  it("ignora mensajes vacíos o con solo espacios", () => {
    expect(getApiErrorMessage(responseError(400, { message: "   " }))).toBe(
      "Los datos enviados no son válidos.",
    );
    expect(getApiErrorMessage(responseError(404, { message: "" }))).toBe(
      "No encontramos el recurso solicitado.",
    );
  });

  it("no expone el mensaje del backend en 401", () => {
    expect(
      getApiErrorMessage(responseError(401, { message: "JWT expirado" })),
    ).toBe("Tu sesión ha expirado. Inicia sesión nuevamente.");
  });

  it("explica los errores de permisos en 403", () => {
    expect(getApiErrorMessage(responseError(403))).toBe(
      "No tienes permisos para realizar esta acción.",
    );
  });

  it("prioriza el mensaje del backend en 404 y 409", () => {
    expect(
      getApiErrorMessage(responseError(404, { message: "No existe la tarea 9." })),
    ).toBe("No existe la tarea 9.");
    expect(getApiErrorMessage(responseError(409))).toBe(
      "Esta operación entra en conflicto con el estado actual.",
    );
    expect(
      getApiErrorMessage(responseError(409, { message: "Transición inválida." })),
    ).toBe("Transición inválida.");
  });

  it("oculta los detalles internos en 500", () => {
    expect(
      getApiErrorMessage(responseError(500, { message: "NullPointerException" })),
    ).toBe("Ocurrió un error en el servidor.");
  });

  it("usa el mensaje del backend o el fallback en códigos no mapeados", () => {
    expect(getApiErrorMessage(responseError(418, { message: "Soy una tetera." }))).toBe(
      "Soy una tetera.",
    );
    expect(getApiErrorMessage(responseError(418, {}), "Fallback propio")).toBe(
      "Fallback propio",
    );
  });
});
