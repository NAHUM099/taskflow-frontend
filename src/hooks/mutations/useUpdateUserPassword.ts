import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserPassword } from "@/lib/services/user-service";
import { userKeys } from "@/lib/query-keys";
import type { UpdateUserPasswordRequest } from "@/lib/types";

export function useUpdateUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: UpdateUserPasswordRequest;
    }) => updateUserPassword(id, request),
    // La contraseña no viaja en el listado, pero la regla del proyecto es
    // invalidar el dominio en toda mutation.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
