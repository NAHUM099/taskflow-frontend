import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { getToken, setToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";
import { resetPathname, setPathname } from "@/test/navigation";
import { Sidebar } from "./Sidebar";

vi.mock(
  "next/navigation",
  async () => (await import("@/test/navigation")).navigationMock,
);

type SidebarProps = ComponentProps<typeof Sidebar>;

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
  const props: SidebarProps = {
    collapsed: false,
    onToggleCollapsed: vi.fn(),
    mobileOpen: false,
    onCloseMobile: vi.fn(),
    ...overrides,
  };

  render(
    <AuthProvider>
      <Sidebar {...props} />
    </AuthProvider>,
  );

  return props;
}

function loginAs(role: "ROLE_ADMIN" | "ROLE_MODERATOR" | "ROLE_USER") {
  setToken(makeJwt({ sub: "ana@taskflow.dev", role }));
}

function userMenuButton() {
  return screen.getAllByRole("button", { name: /ana@taskflow\.dev/ })[0];
}

describe("Sidebar", () => {
  afterEach(() => {
    resetPathname();
  });

  it("muestra todos los enlaces a un administrador", () => {
    loginAs("ROLE_ADMIN");

    renderSidebar();

    expect(screen.getAllByRole("link", { name: "Dashboard" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Tareas" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Usuarios" })).not.toHaveLength(0);
  });

  it("oculta Usuarios a los roles sin permiso", () => {
    loginAs("ROLE_USER");

    renderSidebar();

    expect(screen.getAllByRole("link", { name: "Tareas" })).not.toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: "Usuarios" })).toHaveLength(0);
  });

  it("no muestra navegación sin sesión", () => {
    renderSidebar();

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("marca con aria-current la sección activa", () => {
    loginAs("ROLE_ADMIN");
    setPathname("/tasks/12");

    renderSidebar();

    screen.getAllByRole("link", { name: "Tareas" }).forEach((link) => {
      expect(link).toHaveAttribute("aria-current", "page");
    });
    screen.getAllByRole("link", { name: "Dashboard" }).forEach((link) => {
      expect(link).not.toHaveAttribute("aria-current");
    });
  });

  it("informa la acción de colapsar y expandir", async () => {
    loginAs("ROLE_ADMIN");
    const user = userEvent.setup();

    const props = renderSidebar();
    await user.click(
      screen.getAllByRole("button", { name: "Colapsar barra lateral" })[0],
    );

    expect(props.onToggleCollapsed).toHaveBeenCalledTimes(1);

    const collapsedProps = renderSidebar({ collapsed: true });
    await user.click(
      screen.getAllByRole("button", { name: "Expandir barra lateral" })[0],
    );

    expect(collapsedProps.onToggleCollapsed).toHaveBeenCalledTimes(1);
  });

  it("cierra sesión desde el menú de usuario", async () => {
    loginAs("ROLE_ADMIN");
    const user = userEvent.setup();

    renderSidebar();
    await user.click(userMenuButton());
    await user.click(screen.getAllByRole("menuitem", { name: "Cerrar sesión" })[0]);

    expect(getToken()).toBeNull();
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);
  });

  it("cierra el menú de usuario con Escape y con clic fuera", async () => {
    loginAs("ROLE_ADMIN");
    const user = userEvent.setup();

    renderSidebar();

    await user.click(userMenuButton());
    expect(screen.getAllByRole("menuitem")).not.toHaveLength(0);
    await user.keyboard("{Escape}");
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);

    await user.click(userMenuButton());
    await user.click(document.body);
    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);
  });

  it("bloquea el drawer cerrado y lo cierra con el botón X", async () => {
    loginAs("ROLE_USER");
    const user = userEvent.setup();

    const props = renderSidebar({ mobileOpen: false });
    const drawer = screen.getByRole("dialog", { hidden: true });

    expect(drawer).toHaveAttribute("inert");

    await user.click(
      within(drawer).getByRole("button", { name: "Cerrar menú" }),
    );

    expect(props.onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("cierra el drawer abierto con Escape", async () => {
    loginAs("ROLE_USER");
    const user = userEvent.setup();

    const props = renderSidebar({ mobileOpen: true });
    const drawer = screen.getByRole("dialog", { hidden: true });

    expect(drawer).not.toHaveAttribute("inert");

    await user.keyboard("{Escape}");

    expect(props.onCloseMobile).toHaveBeenCalledTimes(1);
  });
});
