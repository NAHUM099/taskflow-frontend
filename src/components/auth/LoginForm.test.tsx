import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { getToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";
import { routerMock } from "@/test/navigation";
import { LoginForm } from "./LoginForm";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("@/lib/auth/auth-service", () => ({ login: loginMock }));

vi.mock(
  "next/navigation",
  async () => (await import("@/test/navigation")).navigationMock,
);

function renderForm() {
  render(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>,
  );
}

async function submitCredentials() {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("Correo electrónico"),
    "ana@taskflow.dev",
  );
  await user.type(screen.getByLabelText("Contraseña"), "secreto");
  await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("LoginForm", () => {
  it("envía las credenciales, guarda el token y navega al dashboard", async () => {
    loginMock.mockResolvedValue(makeJwt({ sub: "ana@taskflow.dev" }));
    renderForm();

    await submitCredentials();

    expect(loginMock).toHaveBeenCalledWith({
      email: "ana@taskflow.dev",
      password: "secreto",
    });
    await waitFor(() => expect(getToken()).not.toBeNull());
    expect(routerMock.replace).toHaveBeenCalledWith("/");
  });

  it("muestra el error de credenciales y permite reintentar", async () => {
    loginMock.mockRejectedValue(new Error("Credenciales incorrectas."));
    renderForm();

    await submitCredentials();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciales incorrectas.",
    );
    expect(getToken()).toBeNull();
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
  });

  it("usa un mensaje genérico ante un fallo inesperado (no Error)", async () => {
    loginMock.mockRejectedValue("boom");
    renderForm();

    await submitCredentials();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos iniciar sesión. Inténtalo nuevamente.",
    );
    expect(getToken()).toBeNull();
  });

  it("deshabilita el botón mientras envía", async () => {
    let resolveLogin!: (token: string) => void;
    loginMock.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderForm();

    await submitCredentials();

    expect(
      screen.getByRole("button", { name: "Iniciando sesión..." }),
    ).toBeDisabled();

    await act(async () => {
      resolveLogin(makeJwt());
    });

    await waitFor(() => expect(getToken()).not.toBeNull());
  });
});
