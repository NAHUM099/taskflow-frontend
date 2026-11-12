import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateTaskStatus } from "@/hooks/mutations/useUpdateTaskStatus";
import { taskKeys } from "@/lib/query-keys";
import { makeTask } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { updateTaskStatusMock } = vi.hoisted(() => ({
  updateTaskStatusMock: vi.fn(),
}));

vi.mock("@/lib/services/task-service", () => ({
  updateTaskStatus: updateTaskStatusMock,
}));

describe("useUpdateTaskStatus", () => {
  it("actualiza el estado con id y estado, e invalida las tareas", async () => {
    const updated = makeTask({ id: 7, status: "DONE" });
    updateTaskStatusMock.mockResolvedValue(updated);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateTaskStatus(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 7, status: "DONE" });
    });

    expect(updateTaskStatusMock).toHaveBeenCalledWith(7, "DONE");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
  });

  it("propaga el 409 de transición inválida", async () => {
    updateTaskStatusMock.mockRejectedValue(new Error("409"));

    const { result } = renderHook(() => useUpdateTaskStatus(), {
      wrapper: createProvidersWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 7, status: "PENDING" }),
      ).rejects.toThrow("409");
    });
  });
});
