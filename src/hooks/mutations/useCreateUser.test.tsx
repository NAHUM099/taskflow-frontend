import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreateUser } from "@/hooks/mutations/useCreateUser";
import { userKeys } from "@/lib/query-keys";
import type { CreateUserRequest } from "@/lib/types";
import { makeUser } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { createUserMock } = vi.hoisted(() => ({ createUserMock: vi.fn() }));

vi.mock("@/lib/services/user-service", () => ({
  createUser: createUserMock,
}));

const REQUEST: CreateUserRequest = {
  name: "Luis Pérez",
  email: "luis@taskflow.dev",
  password: "secreta123",
};

describe("useCreateUser", () => {
  it("envía el cuerpo al servicio e invalida los usuarios", async () => {
    const created = makeUser({
      id: 9,
      name: REQUEST.name,
      email: REQUEST.email,
    });
    createUserMock.mockResolvedValue(created);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(REQUEST);
    });

    expect(createUserMock).toHaveBeenCalledWith(REQUEST);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.all });
  });

  it("propaga el error sin invalidar", async () => {
    createUserMock.mockRejectedValue(new Error("409"));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(REQUEST)).rejects.toThrow("409");
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
