import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserStatus } from "@/lib/services/user-service";
import { userKeys } from "@/lib/query-keys";
import type { UpdateUserStatusRequest } from "@/lib/types";

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: UpdateUserStatusRequest;
    }) => updateUserStatus(id, request),
    // El listado muestra el estado del usuario, así que se refresca al terminar.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
