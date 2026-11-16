import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { responseError } from "@/test/axios";
import { makeUser } from "@/test/factories";
import { UpdateUserStatusModal } from "./UpdateUserStatusModal";

const { mutateMock, pendingRef } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pendingRef: { current: false },
}));

vi.mock("@/hooks/mutations/useUpdateUserStatus", () => ({
  useUpdateUserStatus: () => ({
    mutate: mutateMock,
    isPending: pendingRef.current,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

const ACTIVE_USER = makeUser({
  id: 7,
  name: "Ana Torres",
  email: "ana@taskflow.dev",
});

const INACTIVE_USER = makeUser({ ...ACTIVE_USER, active: false });

describe("UpdateUserStatusModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    pendingRef.current = false;
  });

  it("pide confirmación para inactivar a un usuario activo", () => {
    render(<UpdateUserStatusModal user={ACTIVE_USER} onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Inactivar usuario" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ana Torres · ana@taskflow.dev"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "El usuario no podrá iniciar sesión hasta que lo actives de nuevo. Sus tareas no se modifican.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inactivar" })).toBeEnabled();
  });

  it("pide confirmación para activar a un usuario inactivo", () => {
    render(<UpdateUserStatusModal user={INACTIVE_USER} onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Activar usuario" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "El usuario podrá volver a iniciar sesión con su contraseña actual.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activar" })).toBeEnabled();
  });

  it("trata como activo un usuario sin el campo active", () => {
    render(
      <UpdateUserStatusModal
        user={makeUser({ active: undefined })}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Inactivar usuario" }),
    ).toBeInTheDocument();
  });

  it("envía active: false y cierra al inactivar", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserStatusModal user={ACTIVE_USER} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Inactivar" }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 7, request: { active: false } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Usuario inactivado correctamente.",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("envía active: true y cierra al activar", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserStatusModal user={INACTIVE_USER} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Activar" }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 7, request: { active: true } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Usuario activado correctamente.",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no envía nada si el usuario no tiene id", async () => {
    const user = userEvent.setup();
    render(
      <UpdateUserStatusModal user={makeUser({ id: null })} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Inactivar" }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("muestra el error del backend sin cerrar el modal", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) =>
        options.onError?.(responseError(404, { message: "usuario no existe" })),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserStatusModal user={ACTIVE_USER} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Inactivar" }));

    expect(toast.error).toHaveBeenCalledWith("usuario no existe");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra un mensaje genérico si el error no trae texto", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onError?.({}),
    );
    const user = userEvent.setup();
    render(<UpdateUserStatusModal user={ACTIVE_USER} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Inactivar" }));

    expect(toast.error).toHaveBeenCalledWith(
      "No pudimos actualizar el estado del usuario.",
    );
  });

  it("deshabilita la confirmación mientras la mutación está en curso", () => {
    pendingRef.current = true;

    render(<UpdateUserStatusModal user={ACTIVE_USER} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });

  it("se cierra con Escape, con Cancelar y con la X", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateUserStatusModal user={ACTIVE_USER} onClose={onClose} />);

    await user.keyboard("a");
    expect(onClose).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
