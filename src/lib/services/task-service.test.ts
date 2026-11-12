import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTask,
  getTasks,
  updateTaskStatus,
} from "@/lib/services/task-service";
import type { CreateTaskRequest, TaskResponse } from "@/lib/types";
import { makeTask } from "@/test/factories";

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api: { get, post, patch } }));

describe("getTasks", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("pide /tasks sin parámetros cuando no hay filtros", async () => {
    const tasks = [makeTask()];
    get.mockResolvedValue({ data: tasks });

    await expect(getTasks()).resolves.toEqual(tasks);
    expect(get).toHaveBeenCalledWith("/tasks", { params: {} });
  });

  it("envía el filtro de estado", async () => {
    get.mockResolvedValue({ data: [] });

    await getTasks({ status: "IN_PROGRESS" });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { status: "IN_PROGRESS" },
    });
  });

  it("envía userId incluso cuando vale 0", async () => {
    get.mockResolvedValue({ data: [] });

    await getTasks({ userId: 0 });

    expect(get).toHaveBeenCalledWith("/tasks", { params: { userId: 0 } });
  });

  it("combina estado y usuario", async () => {
    get.mockResolvedValue({ data: [] });

    await getTasks({ status: "DONE", userId: 2 });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { status: "DONE", userId: 2 },
    });
  });

  it("propaga los errores de la API", async () => {
    get.mockRejectedValue(new Error("500"));

    await expect(getTasks()).rejects.toThrow("500");
  });
});

describe("createTask", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("hace POST /tasks con el cuerpo recibido", async () => {
    const request: CreateTaskRequest = {
      title: "Preparar informe",
      description: "Detalle del informe mensual",
      userId: 2,
    };
    const created: TaskResponse = makeTask({ id: 9, title: request.title });
    post.mockResolvedValue({ data: created });

    await expect(createTask(request)).resolves.toEqual(created);
    expect(post).toHaveBeenCalledWith("/tasks", request);
  });
});

describe("updateTaskStatus", () => {
  beforeEach(() => {
    patch.mockReset();
  });

  it("hace PATCH /tasks/:id/status con el nuevo estado", async () => {
    const updated = makeTask({ id: 7, status: "DONE" });
    patch.mockResolvedValue({ data: updated });

    await expect(updateTaskStatus(7, "DONE")).resolves.toEqual(updated);
    expect(patch).toHaveBeenCalledWith("/tasks/7/status", { status: "DONE" });
  });
});
