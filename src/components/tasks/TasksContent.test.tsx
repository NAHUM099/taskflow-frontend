import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setToken } from "@/lib/auth/token";
import type { TaskPageResponse } from "@/lib/types";
import { makeJwt, makeTask, makeTaskPage } from "@/test/factories";
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
  data?: TaskPageResponse;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
}

function stubQuery({
  data,
  isLoading = false,
  isError = false,
  isFetching = false,
}: QueryResult) {
  useTasksMock.mockImplementation((params: Record<string, unknown>) => {
    filtersSeen.push(params);

    return { data, isLoading, isError, isFetching, refetch: refetchMock };
  });
}

const FIRST_PAGE = { page: 0, size: 10 };

describe("TasksContent", () => {
  beforeEach(() => {
    filtersSeen.length = 0;
    refetchMock.mockReset();
  });

  it("permite crear tareas a un administrador", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: makeTaskPage() });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.click(screen.getByRole("button", { name: "Nueva tarea" }));

    expect(screen.getByText("modal abierto")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "cerrar modal" }));
    expect(screen.queryByText("modal abierto")).not.toBeInTheDocument();
  });

  it("oculta el alta para roles sin permiso", () => {
    setToken(makeJwt({ role: "ROLE_USER" }));
    stubQuery({ data: makeTaskPage() });

    renderWithProviders(<TasksContent />);

    expect(
      screen.queryByRole("button", { name: "Nueva tarea" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Tarea de prueba")).toBeInTheDocument();
  });

  it("lista las tareas recibidas", () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({
      data: makeTaskPage({
        content: [makeTask({ id: 1 }), makeTask({ id: 2, title: "Otra tarea" })],
      }),
    });

    renderWithProviders(<TasksContent />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Otra tarea")).toBeInTheDocument();
  });

  it("consulta la primera página al montar y de nuevo al cambiar el filtro", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: makeTaskPage({ content: [] }) });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.selectOptions(screen.getByLabelText("Estado"), "DONE");

    await waitFor(() =>
      expect(filtersSeen.at(-1)).toEqual({ ...FIRST_PAGE, status: "DONE" }),
    );
    expect(filtersSeen[0]).toEqual(FIRST_PAGE);
  });

  it("debouncea la búsqueda por nombre de tarea", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: makeTaskPage({ content: [] }) });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);

    await user.type(screen.getByLabelText("Buscar tareas"), "informe");

    await waitFor(
      () =>
        expect(filtersSeen.at(-1)).toEqual({
          ...FIRST_PAGE,
          search: "informe",
        }),
      { timeout: 2000 },
    );
    expect(filtersSeen[0]).toEqual(FIRST_PAGE);
  });

  it("combina el estado con la búsqueda", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: makeTaskPage({ content: [] }) });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);

    await user.selectOptions(screen.getByLabelText("Estado"), "DONE");
    await user.type(screen.getByLabelText("Buscar tareas"), "informe");

    await waitFor(
      () =>
        expect(filtersSeen.at(-1)).toEqual({
          ...FIRST_PAGE,
          status: "DONE",
          search: "informe",
        }),
      { timeout: 2000 },
    );
  });

  it("pide la página siguiente y vuelve a la primera al filtrar", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({
      data: makeTaskPage({
        content: [makeTask()],
        totalElements: 25,
        totalPages: 3,
        last: false,
      }),
    });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));

    await waitFor(() =>
      expect(filtersSeen.at(-1)).toEqual({ page: 1, size: 10 }),
    );

    await user.selectOptions(screen.getByLabelText("Estado"), "DONE");

    await waitFor(() =>
      expect(filtersSeen.at(-1)).toEqual({
        ...FIRST_PAGE,
        status: "DONE",
      }),
    );
  });

  it("no muestra el paginador cuando hay una sola página", () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    stubQuery({ data: makeTaskPage({ content: [makeTask()] }) });

    renderWithProviders(<TasksContent />);

    expect(
      screen.queryByRole("button", { name: /Siguiente/ }),
    ).not.toBeInTheDocument();
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
    stubQuery({ data: makeTaskPage({ content: [] }) });
    const user = userEvent.setup();

    renderWithProviders(<TasksContent />);
    await user.click(screen.getByRole("button", { name: "Crear primera tarea" }));

    expect(screen.getByText("modal abierto")).toBeInTheDocument();
  });
});
