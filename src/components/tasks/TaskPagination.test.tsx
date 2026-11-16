import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskPagination } from "./TaskPagination";

const BASE_PROPS = {
  page: 1,
  totalPages: 3,
  first: false,
  last: false,
  isFetching: false,
  onPageChange: () => {},
};

describe("TaskPagination", () => {
  it("muestra la página actual en formato 1-based", () => {
    render(<TaskPagination {...BASE_PROPS} />);

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });

  it("deshabilita Anterior en la primera página", () => {
    render(<TaskPagination {...BASE_PROPS} page={0} first />);

    expect(screen.getByRole("button", { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Siguiente/ })).toBeEnabled();
  });

  it("deshabilita Siguiente en la última página", () => {
    render(<TaskPagination {...BASE_PROPS} page={2} last />);

    expect(screen.getByRole("button", { name: /Siguiente/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Anterior/ })).toBeEnabled();
  });

  it("deshabilita ambos botones mientras se carga", () => {
    render(<TaskPagination {...BASE_PROPS} isFetching />);

    expect(screen.getByRole("button", { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Siguiente/ })).toBeDisabled();
  });

  it("pide la página anterior y la siguiente", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(<TaskPagination {...BASE_PROPS} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: /Anterior/ }));
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2);
  });
});