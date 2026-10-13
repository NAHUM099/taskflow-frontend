import { api } from "@/lib/api";
import type {
  CreateTaskRequest,
  StatusRequest,
  TaskFilters,
  TaskResponse,
  TaskStatus,
} from "@/lib/types";

export async function getTasks(
  filters: TaskFilters = {},
): Promise<TaskResponse[]> {
  const params: Record<string, string | number> = {};
  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.userId !== undefined) {
    params.userId = filters.userId;
  }

  const { data } = await api.get<TaskResponse[]>("/tasks", { params });
  return data;
}

export async function createTask(
  request: CreateTaskRequest,
): Promise<TaskResponse> {
  const { data } = await api.post<TaskResponse>("/tasks", request);
  return data;
}

export async function updateTaskStatus(
  id: number,
  status: TaskStatus,
): Promise<TaskResponse> {
  const body: StatusRequest = { status };
  const { data } = await api.patch<TaskResponse>(`/tasks/${id}/status`, body);
  return data;
}
