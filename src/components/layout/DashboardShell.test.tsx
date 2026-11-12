import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";
import { resetPathname, setPathname } from "@/test/navigation";
import { DashboardShell } from "./DashboardShell";

vi.mock(
  "next/navigation",
  async () => (await import("@/test/navigation")).navigationMock,
);

function renderShell() {
  return render(
    <AuthProvider>
      <DashboardShell>
        <p>contenido de la sección</p>
      </DashboardShell>
    </AuthProvider>,
  );
}

function drawer() {
  return screen.getByRole("dialog", { hidden: true });
}

describe("DashboardShell", () => {
  afterEach(() => {
    resetPathname();
    document.body.style.overflow = "";
  });

  it("muestra el título de la sección activa y el contenido", () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    setPathname("/tasks");

    renderShell();

    expect(
      screen.getByRole("heading", { level: 1, name: "Tareas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("contenido de la sección")).toBeInTheDocument();
  });

  it("abre el drawer móvil y bloquea el scroll del documento", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    const user = userEvent.setup();

    renderShell();
    expect(drawer()).toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));

    expect(drawer()).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(
      within(drawer()).getByRole("button", { name: "Cerrar menú" }),
    );

    expect(document.body.style.overflow).toBe("");
  });

  it("libera el scroll al desmontarse", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    const user = userEvent.setup();

    const { unmount } = renderShell();
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("colapsa y expande la barra lateral", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    const user = userEvent.setup();

    renderShell();
    await user.click(
      screen.getByRole("button", { name: "Colapsar barra lateral" }),
    );

    expect(
      screen.getByRole("button", { name: "Expandir barra lateral" }),
    ).toBeInTheDocument();
  });
});
