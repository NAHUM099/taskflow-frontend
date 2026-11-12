import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskFilters } from "./TaskFilters";

describe("TaskFilters", () => {
  it("lista todos los estados más la opción Todos", () => {
    render(<TaskFilters value="ALL" onChange={() => {}} />);

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Todos", "Pendiente", "En progreso", "Completada", "Cancelada"]);
  });

  it("muestra el filtro seleccionado", () => {
    render(<TaskFilters value="IN_PROGRESS" onChange={() => {}} />);

    expect(screen.getByLabelText("Estado")).toHaveValue("IN_PROGRESS");
  });

  it("notifica el estado elegido", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskFilters value="ALL" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Estado"), "DONE");

    expect(onChange).toHaveBeenCalledWith("DONE");
  });

  it("permite volver a ver todas las tareas", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskFilters value="DONE" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Estado"), "ALL");

    expect(onChange).toHaveBeenCalledWith("ALL");
  });
});
