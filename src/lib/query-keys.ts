import type { TaskFilters, UserListParams } from "@/lib/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters = {}) =>
    [...taskKeys.all, "list", filters] as const,
};

export const userKeys = {
  all: ["users"] as const,
  list: (params: UserListParams = {}) =>
    [...userKeys.all, "list", params] as const,
};
