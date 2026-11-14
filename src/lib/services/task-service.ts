import { api } from "@/lib/api";
import type {
  CreateTaskRequest,
  StatusRequest,
  TaskListParams,
  TaskPageResponse,
  TaskResponse,
  TaskStatus,
  TaskSummaryResponse,
} from "@/lib/types";

export async function getTasks(
  params: TaskListParams = {},
): Promise<TaskPageResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 10,
  };
  if (params.status) {
    query.status = params.status;
  }
  if (params.userId !== undefined) {
    query.userId = params.userId;
  }
  const search = params.search?.trim();
  if (search) {
    query.search = search;
  }

  const { data } = await api.get<TaskPageResponse>("/tasks", { params: query });
  return data;
}

export async function getTaskSummary(): Promise<TaskSummaryResponse> {
  const { data } = await api.get<TaskSummaryResponse>("/tasks/summary");
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
