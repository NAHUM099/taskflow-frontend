import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { DashboardContent } from "./DashboardContent";

const { useTasksMock, refetchMock } = vi.hoisted(() => ({
  useTasksMock: vi.fn(),
  refetchMock: vi.fn(),
}));

vi.mock("@/hooks/queries/useTasks", () => ({ useTasks: useTasksMock }));

interface QueryResult {
  data?: ReturnType<typeof makeTask>[];
  isLoading?: boolean;
  isError?: boolean;
}

function stubQuery({ data, isLoading = false, isError = false }: QueryResult) {
  useTasksMock.mockReturnValue({ data, isLoading, isError, refetch: refetchMock });
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
    refetchMock.mockReset();
  });

  it("resume las tareas por estado", () => {
    stubQuery({
      data: [
        makeTask({ id: 1, status: "PENDING" }),
        makeTask({ id: 2, status: "PENDING" }),
        makeTask({ id: 3, status: "IN_PROGRESS" }),
      ],
    });

    renderWithProviders(<DashboardContent />);

    expect(statValue("Total")).toBe("3");
    expect(statValue("Pendientes")).toBe("2");
    expect(statValue("En progreso")).toBe("1");
    expect(statValue("Completadas")).toBe("0");
  });

  it("limita las tareas recientes a cinco", () => {
    const tasks = Array.from({ length: 7 }, (_, index) =>
      makeTask({ id: index + 1, title: `Tarea ${index + 1}` }),
    );
    stubQuery({ data: tasks });

    renderWithProviders(<DashboardContent />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Tarea 5")).toBeInTheDocument();
    expect(screen.queryByText("Tarea 6")).not.toBeInTheDocument();
  });

  it("invita a crear la primera tarea cuando no hay ninguna", () => {
    stubQuery({ data: [] });

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

  it("muestra el error y permite reintentar", async () => {
    stubQuery({ isError: true });
    const user = userEvent.setup();

    renderWithProviders(<DashboardContent />);

    expect(
      screen.getByRole("heading", { name: "No pudimos cargar las tareas." }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reintentar/ }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
