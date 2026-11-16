import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateUserStatus } from "@/hooks/mutations/useUpdateUserStatus";
import { userKeys } from "@/lib/query-keys";
import type { UpdateUserStatusRequest } from "@/lib/types";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { updateUserStatusMock } = vi.hoisted(() => ({
  updateUserStatusMock: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  updateUserStatus: updateUserStatusMock,
}));

const VARIABLES: { id: number; request: UpdateUserStatusRequest } = {
  id: 7,
  request: { active: false },
};

describe("useUpdateUserStatus", () => {
  it("envía id y cuerpo al servicio e invalida los usuarios", async () => {
    updateUserStatusMock.mockResolvedValue({ id: 7, active: false });
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUserStatus(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(VARIABLES);
    });

    expect(updateUserStatusMock).toHaveBeenCalledWith(
      VARIABLES.id,
      VARIABLES.request,
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: userKeys.all });
  });

  it("propaga el error sin invalidar", async () => {
    updateUserStatusMock.mockRejectedValue(new Error("404"));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUserStatus(), {
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
