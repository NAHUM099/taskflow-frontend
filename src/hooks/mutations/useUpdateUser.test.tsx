import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateUser } from "@/hooks/mutations/useUpdateUser";
import { userKeys } from "@/lib/query-keys";
import type { UpdateUserRequest } from "@/lib/types";
import { makeUser } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { updateUserMock } = vi.hoisted(() => ({ updateUserMock: vi.fn() }));

vi.mock("@/lib/services/user-service", () => ({
  updateUser: updateUserMock,
}));

const REQUEST: UpdateUserRequest = {
  name: "Ana Actualizada",
  email: "ana@taskflow.dev",
};

describe("useUpdateUser", () => {
  it("envía id y cuerpo al servicio e invalida los usuarios", async () => {
    const updated = makeUser({ id: 4, name: REQUEST.name });
    updateUserMock.mockResolvedValue(updated);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 4, request: REQUEST });
    });

    expect(updateUserMock).toHaveBeenCalledWith(4, REQUEST);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.all });
  });

  it("propaga el error sin invalidar", async () => {
    updateUserMock.mockRejectedValue(new Error("409"));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 4, request: REQUEST }),
      ).rejects.toThrow("409");
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
