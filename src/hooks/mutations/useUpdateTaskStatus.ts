import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTaskStatus } from "@/lib/services/task-service";
import { taskKeys } from "@/lib/query-keys";
import type { TaskStatus } from "@/lib/types";

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
