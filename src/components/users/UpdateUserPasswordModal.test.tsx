import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { responseError } from "@/test/axios";
import { makeUser } from "@/test/factories";
import { UpdateUserPasswordModal } from "./UpdateUserPasswordModal";

const { mutateMock, pendingRef } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pendingRef: { current: false },
}));

vi.mock("@/hooks/mutations/useUpdateUserPassword", () => ({
  useUpdateUserPassword: () => ({
    mutate: mutateMock,
    isPending: pendingRef.current,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

const USER = makeUser({
  id: 7,
  name: "Ana Torres",
  email: "ana@taskflow.dev",
});

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  password?: string,
  confirmPassword?: string,
) {
  if (password !== undefined) {
    await user.type(screen.getByLabelText("Nueva contraseña"), password);
  }
  if (confirmPassword !== undefined) {
    await user.type(
      screen.getByLabelText("Confirmar contraseña"),
      confirmPassword,
    );
  }
}

describe("UpdateUserPasswordModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    pendingRef.current = false;
  });

  it("muestra el usuario al que se le cambia la contraseña", () => {
    render(<UpdateUserPasswordModal user={USER} onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Actualizar contraseña" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ana Torres · ana@taskflow.dev"),
    ).toBeInTheDocument();
  });

  it("exige una contraseña de al menos 6 caracteres", async () => {
    const user = userEvent.setup();
    render(<UpdateUserPasswordModal user={USER} onClose={vi.fn()} />);

    await fill(user, "12345", "12345");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      screen.getByText("La contraseña debe tener al menos 6 caracteres."),
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("exige confirmar la contraseña", async () => {
    const user = userEvent.setup();
    render(<UpdateUserPasswordModal user={USER} onClose={vi.fn()} />);

    await fill(user, "secreta123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(screen.getByText("Confirma la contraseña.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("valida que las contraseñas coincidan", async () => {
    const user = userEvent.setup();
    render(<UpdateUserPasswordModal user={USER} onClose={vi.fn()} />);

    await fill(user, "secreta123", "secreta124");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      screen.getByText("Las contraseñas no coinciden."),
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("envía la contraseña intacta y cierra al guardar", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserPasswordModal user={USER} onClose={onClose} />);

    await fill(user, "  secreta123  ", "  secreta123  ");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 7, request: { newPassword: "  secreta123  " } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Contraseña actualizada correctamente.",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no envía nada si el usuario no tiene id", async () => {
    const user = userEvent.setup();
    render(
      <UpdateUserPasswordModal
        user={makeUser({ id: null })}
        onClose={vi.fn()}
      />,
    );

    await fill(user, "secreta123", "secreta123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("muestra el error del backend sin cerrar el modal", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) =>
        options.onError?.(
          responseError(400, {
            message: "la contraseña debe tener minimo 6 caracteres",
          }),
        ),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserPasswordModal user={USER} onClose={onClose} />);

    await fill(user, "secreta123", "secreta123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(toast.error).toHaveBeenCalledWith(
      "la contraseña debe tener minimo 6 caracteres",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra un mensaje genérico si el error no trae texto", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onError?.({}),
    );
    const user = userEvent.setup();
    render(<UpdateUserPasswordModal user={USER} onClose={vi.fn()} />);

    await fill(user, "secreta123", "secreta123");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(toast.error).toHaveBeenCalledWith(
      "No pudimos actualizar la contraseña.",
    );
  });

  it("deshabilita el envío mientras la mutación está en curso", () => {
    pendingRef.current = true;

    render(<UpdateUserPasswordModal user={USER} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });

  it("se cierra con Escape, con Cancelar y con la X", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserPasswordModal user={USER} onClose={onClose} />);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
