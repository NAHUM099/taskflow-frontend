import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUsers } from "@/hooks/queries/useUsers";
import { userKeys } from "@/lib/query-keys";
import { makeUserPage } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { getUsersMock } = vi.hoisted(() => ({ getUsersMock: vi.fn() }));

vi.mock("@/lib/services/user-service", () => ({
  getUsers: getUsersMock,
}));

describe("useUsers", () => {
  it("consulta usuarios con página, tamaño y búsqueda", async () => {
    const params = { page: 2, size: 10, search: "ana" };
    const pageData = makeUserPage({ number: 2, totalPages: 3 });
    getUsersMock.mockResolvedValue(pageData);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUsers(params), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getUsersMock).toHaveBeenCalledWith(params);
    expect(result.current.data).toEqual(pageData);
    expect(queryClient.getQueryData(userKeys.list(params))).toEqual(pageData);
  });

  it("usa los parámetros por defecto del servicio", async () => {
    getUsersMock.mockResolvedValue(makeUserPage());

    const { result } = renderHook(() => useUsers(), {
      wrapper: createProvidersWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getUsersMock).toHaveBeenCalledWith({});
  });

  it("expone el error de la API", async () => {
    getUsersMock.mockRejectedValue(new Error("403"));

    const { result } = renderHook(() => useUsers({ page: 0 }), {
      wrapper: createProvidersWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});
