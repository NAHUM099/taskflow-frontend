import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/services/task-service";
import { taskKeys } from "@/lib/query-keys";
import type { TaskFilters } from "@/lib/types";

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
  });
}
