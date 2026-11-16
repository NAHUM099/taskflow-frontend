import type { JwtPayload } from "@/lib/auth/types";
import type {
  TaskResponse,
  UserPageResponse,
  UserResponse,
} from "@/lib/types";

export function makeTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 1,
    title: "Tarea de prueba",
    description: "Descripción de prueba",
    status: "PENDING",
    userId: 2,
    userName: "Ana Torres",
    createdAt: "2026-10-11T10:00:00",
    ...overrides,
  };
}

export function makeUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    id: 1,
    name: "Ana Torres",
    email: "ana@taskflow.dev",
    active: true,
    ...overrides,
  };
}

export function makeUserPage(
  overrides: Partial<UserPageResponse> = {},
): UserPageResponse {
  const content = overrides.content ?? [makeUser()];
  const totalPages = overrides.totalPages ?? 1;

  return {
    content,
    totalElements: content.length,
    totalPages,
    number: 0,
    size: 10,
    last: totalPages <= 1,
    first: true,
    numberOfElements: content.length,
    empty: content.length === 0,
    ...overrides,
  };
}

export function makeJwt(payload: Partial<JwtPayload> = {}): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      sub: "ana@taskflow.dev",
      role: "ROLE_ADMIN",
      iat: 1_700_000_000,
      exp: 1_900_000_000,
      ...payload,
    }),
  );

  return `${header}.${body}.firma`;
}

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
