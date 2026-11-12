import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/context/AuthContext";
import { routerMock } from "@/test/navigation";
import { RequireAuth } from "./RequireAuth";

vi.mock(
  "next/navigation",
  async () => (await import("@/test/navigation")).navigationMock,
);

// El guard es una decisión de tres estados (hidratando / sin sesión / con sesión),
// así que se stubea el contexto. El flujo real token -> AuthProvider -> guard está
// cubierto en src/test/flows/auth-flow.test.tsx.
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

const useAuthMock = vi.mocked(useAuth);

function stubAuth({
  isAuthenticated,
  isLoading = false,
}: {
  isAuthenticated: boolean;
  isLoading?: boolean;
}) {
  useAuthMock.mockReturnValue({
    user: isAuthenticated
      ? { email: "ana@taskflow.dev", role: "ROLE_ADMIN" }
      : null,
    token: isAuthenticated ? "token-de-prueba" : null,
    isAuthenticated,
    isLoading,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderGuard() {
  return render(
    <RequireAuth>
      <p>contenido privado</p>
    </RequireAuth>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("redirige a /login cuando no hay sesión", async () => {
    stubAuth({ isAuthenticated: false });

    renderGuard();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("espera la hidratación sin redirigir ni mostrar contenido", () => {
    stubAuth({ isAuthenticated: false, isLoading: true });

    renderGuard();

    expect(screen.getByText("Cargando sesión…")).toBeInTheDocument();
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("muestra el contenido con una sesión válida", () => {
    stubAuth({ isAuthenticated: true });

    renderGuard();

    expect(screen.getByText("contenido privado")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
