export type UserRole = "ROLE_USER" | "ROLE_MODERATOR" | "ROLE_ADMIN";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthUser {
  email: string;
  role: UserRole;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ROLE_ADMIN: "Administrador",
  ROLE_MODERATOR: "Moderador",
  ROLE_USER: "Usuario",
};
