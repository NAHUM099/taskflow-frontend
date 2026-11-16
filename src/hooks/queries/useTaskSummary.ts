import { useQuery } from "@tanstack/react-query";
import { getTaskSummary } from "@/lib/services/task-service";
import { taskKeys } from "@/lib/query-keys";

export function useTaskSummary() {
  return useQuery({
    queryKey: taskKeys.summary(),
    queryFn: getTaskSummary,
  });
}
