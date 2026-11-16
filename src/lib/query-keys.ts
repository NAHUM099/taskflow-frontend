import type { TaskListParams, UserListParams } from "@/lib/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: TaskListParams = {}) =>
    [...taskKeys.all, "list", params] as const,
  summary: () => [...taskKeys.all, "summary"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  list: (params: UserListParams = {}) =>
    [...userKeys.all, "list", params] as const,
};
