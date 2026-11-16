export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface TaskResponse {
  id: number | null;
  title: string;
  description: string;
  status: TaskStatus;
  userId: number | null;
  userName: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  userId: number;
}

export interface StatusRequest {
  status: TaskStatus;
}

export interface TaskFilters {
  status?: TaskStatus;
  userId?: number;
  search?: string;
}

export interface TaskListParams extends TaskFilters {
  page?: number;
  size?: number;
}

export interface TaskPageResponse {
  content: TaskResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface TaskSummaryResponse {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  cancelled: number;
}

// `active` lo envía el backend (UserResponse.kt), pero se declara opcional para no
// asumir nada si una respuesta antigua no lo trae: ausente = usuario activo.
export interface UserResponse {
  id: number | null;
  name: string;
  email: string;
  active?: boolean;
}

// El backend (CreateUserRequest) exige password (mín. 6) y asigna ROLE_USER.
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
}

// Endpoint ADMIN (`PATCH /users/{id}/password`): el backend exige `newPassword`
// (mín. 6) y no pide la contraseña anterior.
export interface UpdateUserPasswordRequest {
  newPassword: string;
}

// Endpoint ADMIN (`PATCH /users/{id}/status`): body `{ active }` y responde el
// usuario actualizado (el login del backend rechaza a los inactivos).
export interface UpdateUserStatusRequest {
  active: boolean;
}

export interface UserPageResponse {
  content: UserResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface UserListParams {
  page?: number;
  size?: number;
  search?: string;
}
