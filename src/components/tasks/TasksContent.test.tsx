import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth/token";
import { makeJwt, makeTask } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { TasksContent } from "./TasksContent";

const { useTasksMock, filtersSeen, refetchMock } = vi.hoisted(() => ({
  useTasksMock: vi.fn(),
  filtersSeen: [] as Array<Record<string, unknown>>,
  refetchMock: vi.fn(),
}));

vi.mock("@/hooks/queries/useTasks", () => ({ useTasks: useTasksMock }));

vi.mock("./CreateTaskModal", () => ({
  CreateTaskModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Crear tarea">
      <p>modal abierto</p>
      <button type="button" onClick={onClose}>
        cerrar modal
      </button>
    </div>
  ),
}));

interface QueryResult {
  data?: ReturnType<typeof makeTask>[];
  isLoading?: boolean;
  isError?: boolean;
}

function stubQuery({ data, isLoading = false, isError = false }: QueryResult) {
  useTasksMock.mockImplementation((filters: Record<string, unknown>) => {
    filtersSeen.push(filters);

    return { data, isLoading, isError, refetch: refetchMock };
  });
}

describe("TasksContent", () => {
  beforeEach(() => {
    filtersSeen.length = 0;
    refetchMock.mockReset();
  });

  it("permite crear tareas a un administrador", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: [] });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.click(screen.getByRole("button", { name: "Nueva tarea" }));

    expect(screen.getByText("modal abierto")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "cerrar modal" }));
    expect(screen.queryByText("modal abierto")).not.toBeInTheDocument();
  });

  it("oculta el alta para roles sin permiso", () => {
    setToken(makeJwt({ role: "ROLE_USER" }));
    stubQuery({ data: [makeTask()] });

    renderWithProviders(<TasksContent />);

    expect(
      screen.queryByRole("button", { name: "Nueva tarea" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Tarea de prueba")).toBeInTheDocument();
  });

  it("lista las tareas recibidas", () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: [makeTask({ id: 1 }), makeTask({ id: 2, title: "Otra tarea" })] });

    renderWithProviders(<TasksContent />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Otra tarea")).toBeInTheDocument();
  });

  it("consulta de nuevo al cambiar el filtro de estado", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: [] });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.selectOptions(screen.getByLabelText("Estado"), "DONE");

    await waitFor(() =>
      expect(filtersSeen.at(-1)).toEqual({ status: "DONE" }),
    );
    expect(filtersSeen[0]).toEqual({});
  });

  it("muestra el error y permite reintentar", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ isError: true });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    expect(screen.getByText("No pudimos cargar las tareas.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reintentar/ }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("invita a crear la primera tarea desde el vacío", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: [] });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.click(screen.getByRole("button", { name: "Crear primera tarea" }));

    expect(screen.getByText("modal abierto")).toBeInTheDocument();
  });
});
