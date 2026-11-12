import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth/token";
import { restoreApiAdapter, stubApiStatus } from "@/test/axios";
import { makeJwt } from "@/test/factories";
import { routerMock } from "@/test/navigation";

vi.mock(
  "next/navigation",
  async () => (await import("@/test/navigation")).navigationMock,
);

// Flujo real: token en localStorage -> AuthProvider -> RequireAuth -> pantalla privada.
// Solo se simula la respuesta HTTP; el resto de capas son las de producción.
function renderPrivateArea(children: ReactNode = <p>contenido privado</p>) {
  return render(
    <AuthProvider>
      <RequireAuth>{children}</RequireAuth>
    </AuthProvider>,
  );
}

describe("flujo de autenticación", () => {
  afterEach(() => {
    restoreApiAdapter(api);
  });

  it("expulsa al usuario cuando la API responde 401", async () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));
    renderPrivateArea();
    expect(screen.getByText("contenido privado")).toBeInTheDocument();

    stubApiStatus(api, 401);

    await expect(api.get("/users")).rejects.toBeTruthy();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login"));
    expect(getToken()).toBeNull();
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("expulsa al usuario que cierra sesión desde el menú", async () => {
    setToken(makeJwt({ sub: "ana@taskflow.dev", role: "ROLE_ADMIN" }));
    const user = userEvent.setup();

    renderPrivateArea(
      <Sidebar
        collapsed
        onToggleCollapsed={vi.fn()}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />,
    );

    await user.click(
      screen.getAllByRole("button", { name: /ana@taskflow\.dev/ })[0],
    );
    await user.click(
      screen.getAllByRole("menuitem", { name: "Cerrar sesión" })[0],
    );

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login"));
    expect(getToken()).toBeNull();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
