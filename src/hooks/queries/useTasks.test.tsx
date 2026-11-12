import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTasks } from "@/hooks/queries/useTasks";
import { taskKeys } from "@/lib/query-keys";
import { makeTask } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { getTasksMock } = vi.hoisted(() => ({ getTasksMock: vi.fn() }));

vi.mock("@/lib/services/task-service", () => ({
  getTasks: getTasksMock,
}));

describe("useTasks", () => {
  it("consulta el servicio con los filtros recibidos", async () => {
    const tasks = [makeTask({ id: 1 }), makeTask({ id: 2, status: "DONE" })];
    const filters = { status: "DONE" as const };
    getTasksMock.mockResolvedValue(tasks);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTasks(filters), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTasksMock).toHaveBeenCalledWith(filters);
    expect(result.current.data).toEqual(tasks);
    expect(queryClient.getQueryData(taskKeys.list(filters))).toEqual(tasks);
  });

  it("usa la clave sin filtros cuando no se pasan parámetros", async () => {
    getTasksMock.mockResolvedValue([]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTasks(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTasksMock).toHaveBeenCalledWith({});
    expect(queryClient.getQueryData(taskKeys.list({}))).toEqual([]);
  });

  it("expone el error de la API", async () => {
    getTasksMock.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useTasks(), {
      wrapper: createProvidersWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
