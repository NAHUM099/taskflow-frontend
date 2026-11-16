import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTaskSummary } from "@/hooks/queries/useTaskSummary";
import { taskKeys } from "@/lib/query-keys";
import { makeTaskSummary } from "@/test/factories";
import { createProvidersWrapper, createTestQueryClient } from "@/test/render";

const { getTaskSummaryMock } = vi.hoisted(() => ({
  getTaskSummaryMock: vi.fn(),
}));

vi.mock("@/lib/services/task-service", () => ({
  getTaskSummary: getTaskSummaryMock,
}));

describe("useTaskSummary", () => {
  it("consulta el resumen y lo cachea bajo taskKeys.summary", async () => {
    const summary = makeTaskSummary({ total: 9, pending: 4 });
    getTaskSummaryMock.mockResolvedValue(summary);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useTaskSummary(), {
      wrapper: createProvidersWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTaskSummaryMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(summary);
    expect(queryClient.getQueryData(taskKeys.summary())).toEqual(summary);
  });

  it("expone el error de la API", async () => {
    getTaskSummaryMock.mockRejectedValue(new Error("500"));

    const { result } = renderHook(() => useTaskSummary(), {
      wrapper: createProvidersWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});