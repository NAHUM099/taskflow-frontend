import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TASK_STATUS_META } from "@/lib/task-status";
import { makeTask } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  it("muestra título, descripción y usuario asignado", () => {
    renderWithProviders(<TaskCard task={makeTask()} />);

    expect(screen.getByText("Tarea de prueba")).toBeInTheDocument();
    expect(screen.getByText("Descripción de prueba")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Torres")).toHaveLength(2);
  });

  it("ofrece el menú de estado cuando el estado admite transiciones", () => {
    renderWithProviders(<TaskCard task={makeTask({ status: "PENDING" })} />);

    expect(
      screen.getByRole("button", {
        name: 'Cambiar estado de la tarea "Tarea de prueba"',
      }),
    ).toBeInTheDocument();
  });

  it("muestra solo el badge en estados terminales", () => {
    renderWithProviders(<TaskCard task={makeTask({ status: "DONE" })} />);

    expect(
      screen.queryByRole("button", { name: /Cambiar estado/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(TASK_STATUS_META.DONE.label)).toBeInTheDocument();
  });

  it("muestra solo el badge cuando la tarea está cancelada", () => {
    renderWithProviders(<TaskCard task={makeTask({ status: "CANCELLED" })} />);

    expect(screen.getByText(TASK_STATUS_META.CANCELLED.label)).toBeInTheDocument();
  });
});
