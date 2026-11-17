import { isAxiosError, type AxiosResponseHeaders, type RawAxiosResponseHeaders } from "axios";
import { api } from "@/lib/api";
import type { LoginRequest, LoginResponse } from "./types";

type ResponseHeaders = AxiosResponseHeaders | RawAxiosResponseHeaders;

const RETRY_AFTER_HEADER = "retry-after";

const RATE_LIMIT_FALLBACK =
  "Demasiados intentos de inicio de sesión. Espera unos minutos antes de volver a intentarlo.";

// El backend devuelve Retry-After en segundos (header estándar de los 429).
export function parseRetryAfterSeconds(
  headers: ResponseHeaders | undefined,
): number | null {
  const raw = (headers as Record<string, unknown> | undefined)?.[
    RETRY_AFTER_HEADER
  ];

  if (typeof raw !== "string" && typeof raw !== "number") {
    return null;
  }

  const seconds = Math.ceil(Number(raw));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function formatWait(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

// Mensaje del bloqueo temporal (429), con el tiempo indicado por el backend.
export function rateLimitMessage(headers?: ResponseHeaders): string {
  const seconds = parseRetryAfterSeconds(headers);
  if (seconds === null) {
    return RATE_LIMIT_FALLBACK;
  }

  return `Demasiados intentos de inicio de sesión. Vuelve a intentarlo en ${formatWait(
    seconds,
  )}.`;
}

export async function login(credentials: LoginRequest): Promise<string> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data.token;
  } catch (error) {
    if (isAxiosError(error)) {
      // El backend limita los intentos fallidos por IP y cuenta: 429 con
      // Retry-After. Se informa del tiempo de espera sin cerrar nada más.
      if (error.response?.status === 429) {
        throw new Error(rateLimitMessage(error.response.headers));
      }
      if (error.response?.status === 401) {
        throw new Error("Credenciales incorrectas.");
      }
      if (!error.response) {
        throw new Error(
          "No pudimos conectar con el servidor. Inténtalo nuevamente.",
        );
      }
    }

    throw new Error("No pudimos iniciar sesión. Inténtalo nuevamente.");
  }
}
