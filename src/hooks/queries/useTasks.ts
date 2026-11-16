import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/services/task-service";
import { taskKeys } from "@/lib/query-keys";
import type { TaskListParams } from "@/lib/types";

export function useTasks(params: TaskListParams = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => getTasks(params),
  });
}
