import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTask,
  getTaskSummary,
  getTasks,
  updateTaskStatus,
} from "@/lib/services/task-service";
import type { CreateTaskRequest, TaskResponse } from "@/lib/types";
import { makeTask, makeTaskPage, makeTaskSummary } from "@/test/factories";

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

  it("pide la primera página cuando no hay parámetros", async () => {
    const page = makeTaskPage();
    get.mockResolvedValue({ data: page });

    await expect(getTasks()).resolves.toEqual(page);
    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { page: 0, size: 10 },
    });
  });

  it("envía la página y el tamaño solicitados", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({ page: 2, size: 5 });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { page: 2, size: 5 },
    });
  });

  it("envía el filtro de estado", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({ status: "IN_PROGRESS" });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { page: 0, size: 10, status: "IN_PROGRESS" },
    });
  });

  it("envía userId incluso cuando vale 0", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({ userId: 0 });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { page: 0, size: 10, userId: 0 },
    });
  });

  it("combina estado y usuario", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({ status: "DONE", userId: 2 });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { page: 0, size: 10, status: "DONE", userId: 2 },
    });
  });

  it("envía la búsqueda por nombre de tarea", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({ search: "informe" });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: { page: 0, size: 10, search: "informe" },
    });
  });

  it("recorta la búsqueda y omite los espacios en blanco", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({ search: "  informe  " });
    expect(get).toHaveBeenLastCalledWith("/tasks", {
      params: { page: 0, size: 10, search: "informe" },
    });

    await getTasks({ search: "   " });
    expect(get).toHaveBeenLastCalledWith("/tasks", {
      params: { page: 0, size: 10 },
    });
  });

  it("combina búsqueda, estado, usuario y paginación", async () => {
    get.mockResolvedValue({ data: makeTaskPage() });

    await getTasks({
      status: "PENDING",
      userId: 3,
      search: "informe",
      page: 1,
      size: 20,
    });

    expect(get).toHaveBeenCalledWith("/tasks", {
      params: {
        page: 1,
        size: 20,
        status: "PENDING",
        userId: 3,
        search: "informe",
      },
    });
  });

  it("propaga los errores de la API", async () => {
    get.mockRejectedValue(new Error("500"));

    await expect(getTasks()).rejects.toThrow("500");
  });
});

describe("getTaskSummary", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("pide /tasks/summary y devuelve los conteos", async () => {
    const summary = makeTaskSummary({ total: 7, pending: 3 });
    get.mockResolvedValue({ data: summary });

    await expect(getTaskSummary()).resolves.toEqual(summary);
    expect(get).toHaveBeenCalledWith("/tasks/summary");
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
