import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { TaskList } from "./TaskList";

describe("TaskList", () => {
  it("invita a crear la primera tarea cuando la lista está vacía", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <TaskList tasks={[]} filtered={false} canCreate onCreate={onCreate} />,
    );

    expect(screen.getByText("No hay tareas todavía.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear primera tarea" }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("no ofrece crear cuando el usuario no puede", () => {
    renderWithProviders(
      <TaskList tasks={[]} filtered={false} canCreate={false} onCreate={() => {}} />,
    );

    expect(
      screen.queryByRole("button", { name: "Crear primera tarea" }),
    ).not.toBeInTheDocument();
  });

  it("distingue el vacío por filtro y oculta el alta", () => {
    renderWithProviders(
      <TaskList tasks={[]} filtered canCreate onCreate={() => {}} />,
    );

    expect(
      screen.getByText("No hay tareas con este estado."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Crear primera tarea" }),
    ).not.toBeInTheDocument();
  });

  it("muestra la cabecera y una fila por tarea", () => {
    const tasks = [makeTask({ id: 1 }), makeTask({ id: 2, title: "Otra tarea" })];

    renderWithProviders(
      <TaskList tasks={tasks} filtered={false} canCreate onCreate={() => {}} />,
    );

    expect(screen.getByText("Tarea")).toBeInTheDocument();
    expect(screen.getByText("Usuario")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Otra tarea")).toBeInTheDocument();
  });
});
