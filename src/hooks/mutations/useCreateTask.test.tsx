import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { taskKeys } from "@/lib/query-keys";
import type { CreateTaskRequest } from "@/lib/types";
import { makeTask } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { createTaskMock } = vi.hoisted(() => ({ createTaskMock: vi.fn() }));

vi.mock("@/lib/services/task-service", () => ({
  createTask: createTaskMock,
}));

const REQUEST: CreateTaskRequest = {
  title: "Preparar informe",
  description: "Detalle del informe mensual",
  userId: 2,
};

describe("useCreateTask", () => {
  it("crea la tarea e invalida la lista de tareas", async () => {
    const created = makeTask({ id: 10, title: REQUEST.title });
    createTaskMock.mockResolvedValue(created);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTask(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(REQUEST);
    });

    expect(createTaskMock).toHaveBeenCalledWith(REQUEST);
    await waitFor(() => expect(result.current.data).toEqual(created));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: taskKeys.all });
  });

  it("propaga el error y no invalida la caché", async () => {
    createTaskMock.mockRejectedValue(new Error("400"));
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateTask(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(REQUEST)).rejects.toThrow("400");
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
