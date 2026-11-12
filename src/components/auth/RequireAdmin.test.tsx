import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";
import { routerMock } from "@/test/navigation";
import { RequireAdmin } from "./RequireAdmin";

vi.mock(
  "next/navigation",
  async () => (await import("@/test/navigation")).navigationMock,
);

function renderGuard() {
  return render(
    <AuthProvider>
      <RequireAdmin>
        <p>zona admin</p>
      </RequireAdmin>
    </AuthProvider>,
  );
}

describe("RequireAdmin", () => {
  it("muestra el contenido a un administrador", () => {
    setToken(makeJwt({ role: "ROLE_ADMIN" }));

    renderGuard();

    expect(screen.getByText("zona admin")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("expulsa al dashboard a roles sin permiso", async () => {
    setToken(makeJwt({ role: "ROLE_MODERATOR" }));

    renderGuard();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("zona admin")).not.toBeInTheDocument();
  });

  it("expulsa al dashboard sin sesión", async () => {
    renderGuard();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("zona admin")).not.toBeInTheDocument();
  });
});
