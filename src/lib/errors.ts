import axios from "axios";

function extractBackendMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }
  const data = error.response?.data as { message?: unknown } | undefined;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }

  if (!error.response) {
    return "No pudimos conectar con el servidor.";
  }

  const message = extractBackendMessage(error);

  switch (error.response.status) {
    case 400:
      return message ?? "Los datos enviados no son válidos.";
    case 401:
      return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return message ?? "No encontramos el recurso solicitado.";
    case 409:
      return message ?? "Esta operación entra en conflicto con el estado actual.";
    case 500:
      return "Ocurrió un error en el servidor.";
    default:
      return message ?? fallback;
  }
}
