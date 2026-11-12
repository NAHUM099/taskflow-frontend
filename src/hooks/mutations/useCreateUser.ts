import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@/lib/services/user-service";
import { userKeys } from "@/lib/query-keys";
import type { CreateUserRequest } from "@/lib/types";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) => createUser(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
