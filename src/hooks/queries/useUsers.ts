import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/services/user-service";
import { userKeys } from "@/lib/query-keys";
import type { UserListParams } from "@/lib/types";

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
  });
}
