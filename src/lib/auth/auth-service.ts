import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(credentials: LoginRequest): Promise<string> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data.token;
  } catch (error) {
    if (isAxiosError(error)) {
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
