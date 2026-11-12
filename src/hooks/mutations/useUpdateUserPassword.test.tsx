import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateUserPassword } from "@/hooks/mutations/useUpdateUserPassword";
import { userKeys } from "@/lib/query-keys";
import type { UpdateUserPasswordRequest } from "@/lib/types";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { updateUserPasswordMock } = vi.hoisted(() => ({
  updateUserPasswordMock: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  updateUserPassword: updateUserPasswordMock,
}));

const VARIABLES: { id: number; request: UpdateUserPasswordRequest } = {
  id: 7,
  request: { newPassword: "secreta123" },
};

describe("useUpdateUserPassword", () => {
  it("envía id y cuerpo al servicio e invalida los usuarios", async () => {
    updateUserPasswordMock.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUserPassword(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(VARIABLES);
    });

    expect(updateUserPasswordMock).toHaveBeenCalledWith(
      VARIABLES.id,
      VARIABLES.request,
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.all });
  });

  it("propaga el error sin invalidar", async () => {
    updateUserPasswordMock.mockRejectedValue(new Error("404"));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUserPassword(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(VARIABLES)).rejects.toThrow(
        "404",
      );
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
