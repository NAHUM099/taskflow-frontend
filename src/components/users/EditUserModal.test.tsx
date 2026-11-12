import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { responseError } from "@/test/axios";
import { makeUser } from "@/test/factories";
import { EditUserModal } from "./EditUserModal";

const { mutateMock, pendingRef } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pendingRef: { current: false },
}));

vi.mock("@/hooks/mutations/useUpdateUser", () => ({
  useUpdateUser: () => ({ mutate: mutateMock, isPending: pendingRef.current }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

describe("EditUserModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    pendingRef.current = false;
  });

  it("exige un nombre", async () => {
    const user = userEvent.setup();
    render(<EditUserModal user={makeUser({ name: "   " })} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("valida el formato del email", async () => {
    const user = userEvent.setup();
    render(
      <EditUserModal user={makeUser({ email: "ana@" })} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("Ingresa un email válido.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("exige un email", async () => {
    const user = userEvent.setup();
    render(<EditUserModal user={makeUser({ email: "   " })} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("El email es obligatorio.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("envía el email corregido por el usuario", async () => {
    const user = userEvent.setup();
    render(<EditUserModal user={makeUser({ id: 7 })} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "nueva@taskflow.dev");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        request: { name: "Ana Torres", email: "nueva@taskflow.dev" },
      }),
      expect.anything(),
    );
  });

  it("deshabilita el guardado mientras la mutación está en curso", () => {
    pendingRef.current = true;

    render(<EditUserModal user={makeUser()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });

  it("no envía nada si el usuario no tiene id", async () => {
    const user = userEvent.setup();
    render(<EditUserModal user={makeUser({ id: null })} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("envía nombre y email recortados e invalida al terminar", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EditUserModal
        user={makeUser({ id: 4, name: "Ana", email: "ana@taskflow.dev" })}
        onClose={onClose}
      />,
    );

    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "  Ana Actualizada  ");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mutateMock).toHaveBeenCalledWith(
      {
        id: 4,
        request: { name: "Ana Actualizada", email: "ana@taskflow.dev" },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith("Usuario actualizado correctamente.");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("muestra el error del backend", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) =>
        options.onError?.(responseError(409, { message: "El email ya existe." })),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditUserModal user={makeUser()} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(toast.error).toHaveBeenCalledWith("El email ya existe.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("se cierra con Escape y con Cancelar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditUserModal user={makeUser()} onClose={onClose} />);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
