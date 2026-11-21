import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("ErrorPage", () => {
  it("registra el error, permite reintentar y ofrece volver al inicio", async () => {
    const reset = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<ErrorPage error={new Error("fallo")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Algo salió mal." }),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Reintentar/ }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: /Volver al inicio/ }),
    ).toHaveAttribute("href", "/");
  });
});
