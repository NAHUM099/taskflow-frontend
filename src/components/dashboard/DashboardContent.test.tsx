import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask, makeTaskPage, makeTaskSummary } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { DashboardContent } from "./DashboardContent";

const { useTasksMock, useTaskSummaryMock, refetchTasksMock, refetchSummaryMock } =
  vi.hoisted(() => ({
    useTasksMock: vi.fn(),
    useTaskSummaryMock: vi.fn(),
    refetchTasksMock: vi.fn(),
    refetchSummaryMock: vi.fn(),
  }));

vi.mock("@/hooks/queries/useTasks", () => ({ useTasks: useTasksMock }));
vi.mock("@/hooks/queries/useTaskSummary", () => ({
  useTaskSummary: useTaskSummaryMock,
}));

interface QueryResult {
  tasks?: ReturnType<typeof makeTask>[];
  summary?: ReturnType<typeof makeTaskSummary>;
  isLoading?: boolean;
  isError?: boolean;
}

function stubQuery({
  tasks = [],
  summary = makeTaskSummary(),
  isLoading = false,
  isError = false,
}: QueryResult) {
  useTasksMock.mockReturnValue({
    data: makeTaskPage({ content: tasks }),
    isLoading,
    isError,
    refetch: refetchTasksMock,
  });
  useTaskSummaryMock.mockReturnValue({
    data: summary,
    isLoading,
    isError,
    refetch: refetchSummaryMock,
  });
}

// Lee el número de cada tarjeta: span(label) -> fila -> tarjeta -> p(valor).
// Se toma la primera coincidencia porque la lista de recientes puede repetir el
// texto del estado (badge "En progreso") y las estadísticas van antes en el DOM.
function statValue(label: string): string | null | undefined {
  const [labelNode] = screen.getAllByText(label);
  return labelNode.parentElement?.parentElement?.querySelector("p")?.textContent;
}

describe("DashboardContent", () => {
  beforeEach(() => {
    refetchTasksMock.mockReset();
    refetchSummaryMock.mockReset();
  });

  it("resume las tareas por estado desde el resumen", () => {
    stubQuery({
      summary: makeTaskSummary({
        total: 3,
        pending: 2,
        inProgress: 1,
        done: 0,
      }),
    });

    renderWithProviders(<DashboardContent />);

    expect(statValue("Total")).toBe("3");
    expect(statValue("Pendientes")).toBe("2");
    expect(statValue("En progreso")).toBe("1");
    expect(statValue("Completadas")).toBe("0");
    // El dashboard solo pide la primera página con las recientes.
    expect(useTasksMock).toHaveBeenCalledWith({ page: 0, size: 5 });
  });

  it("limita las tareas recientes a cinco", () => {
    const tasks = Array.from({ length: 7 }, (_, index) =>
      makeTask({ id: index + 1, title: `Tarea ${index + 1}` }),
    );
    stubQuery({ tasks });

    renderWithProviders(<DashboardContent />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Tarea 5")).toBeInTheDocument();
    expect(screen.queryByText("Tarea 6")).not.toBeInTheDocument();
  });

  it("invita a crear la primera tarea cuando no hay ninguna", () => {
    stubQuery({
      tasks: [],
      summary: makeTaskSummary({
        total: 0,
        pending: 0,
        inProgress: 0,
        done: 0,
        cancelled: 0,
      }),
    });

    renderWithProviders(<DashboardContent />);

    expect(screen.getByText("No hay tareas todavía.")).toBeInTheDocument();
    expect(statValue("Total")).toBe("0");
  });

  it("muestra placeholders mientras carga", () => {
    stubQuery({ isLoading: true });

    renderWithProviders(<DashboardContent />);

    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    expect(screen.queryByText("Tareas recientes")).not.toBeInTheDocument();
  });

  it("mantiene los placeholders si el resumen todavía no tiene datos", () => {
    useTasksMock.mockReturnValue({
      data: makeTaskPage(),
      isLoading: false,
      isError: false,
      refetch: refetchTasksMock,
    });
    useTaskSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: refetchSummaryMock,
    });

    renderWithProviders(<DashboardContent />);

    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    expect(screen.queryByText("Tareas recientes")).not.toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    stubQuery({ isError: true });
    const user = userEvent.setup();

    renderWithProviders(<DashboardContent />);

    expect(
      screen.getByRole("heading", { name: "No pudimos cargar las tareas." }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reintentar/ }));

    expect(refetchTasksMock).toHaveBeenCalledTimes(1);
    expect(refetchSummaryMock).toHaveBeenCalledTimes(1);
  });
});
