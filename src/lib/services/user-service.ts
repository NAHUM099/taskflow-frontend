import { api } from "@/lib/api";
import type {
  CreateUserRequest,
  UpdateUserPasswordRequest,
  UpdateUserRequest,
  UserListParams,
  UserPageResponse,
  UserResponse,
} from "@/lib/types";

export async function getUsers(
  params: UserListParams = {},
): Promise<UserPageResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 10,
  };
  if (params.search) {
    query.search = params.search;
  }

  const { data } = await api.get<UserPageResponse>("/users", { params: query });
  return data;
}

export async function createUser(
  request: CreateUserRequest,
): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/users", request);
  return data;
}

export async function updateUser(
  id: number,
  request: UpdateUserRequest,
): Promise<UserResponse> {
  const { data } = await api.patch<UserResponse>(`/users/${id}`, request);
  return data;
}

// El backend responde `204 No Content`: no hay cuerpo que devolver.
export async function updateUserPassword(
  id: number,
  request: UpdateUserPasswordRequest,
): Promise<void> {
  await api.patch<void>(`/users/${id}/password`, request);
}

