import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/lib/services/task-service";
import { taskKeys } from "@/lib/query-keys";
import type { CreateTaskRequest } from "@/lib/types";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTaskRequest) => createTask(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
