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
}

export interface UserResponse {
  id: number | null;
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
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
