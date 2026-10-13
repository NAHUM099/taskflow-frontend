import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/lib/services/user-service";
import { userKeys } from "@/lib/query-keys";
import type { UpdateUserRequest } from "@/lib/types";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateUserRequest }) =>
      updateUser(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
