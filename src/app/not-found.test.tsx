import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("muestra el estado 404 y enlaza al inicio", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: "No encontramos esta página." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
