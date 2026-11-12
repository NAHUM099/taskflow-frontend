import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { responseError } from "@/test/axios";
import { CreateUserModal } from "./CreateUserModal";

const { mutateMock, pendingRef } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pendingRef: { current: false },
}));

vi.mock("@/hooks/mutations/useCreateUser", () => ({
  useCreateUser: () => ({ mutate: mutateMock, isPending: pendingRef.current }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

interface FormValues {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  { name, email, password, confirmPassword }: FormValues,
) {
  if (name !== undefined) {
    await user.type(screen.getByLabelText("Nombre"), name);
  }
  if (email !== undefined) {
    await user.type(screen.getByLabelText("Email"), email);
  }
  if (password !== undefined) {
    await user.type(screen.getByLabelText("Contraseña"), password);
  }
  if (confirmPassword !== undefined) {
    await user.type(screen.getByLabelText("Confirmar contraseña"), confirmPassword);
  }
}

describe("CreateUserModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    pendingRef.current = false;
  });

  it("exige un nombre", async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "   ",
      email: "luis@taskflow.dev",
      password: "secreta123",
      confirmPassword: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("exige un email", async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "Luis Pérez",
      password: "secreta123",
      confirmPassword: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByText("El email es obligatorio.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("valida el formato del email", async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "Luis Pérez",
      email: "luis@",
      password: "secreta123",
      confirmPassword: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByText("Ingresa un email válido.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("exige una contraseña de al menos 6 caracteres", async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
      password: "12345",
      confirmPassword: "12345",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(
      screen.getByText("La contraseña debe tener al menos 6 caracteres."),
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("pide confirmar la contraseña", async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
      password: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByText("Confirma la contraseña.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("rechaza contraseñas distintas", async () => {
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
      password: "secreta123",
      confirmPassword: "secreta124",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("envía nombre y email recortados, la contraseña intacta, y cierra", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CreateUserModal onClose={onClose} />);

    await fill(user, {
      name: "  Luis Pérez  ",
      email: " luis@taskflow.dev ",
      password: "secreta123",
      confirmPassword: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(mutateMock).toHaveBeenCalledWith(
      {
        name: "Luis Pérez",
        email: "luis@taskflow.dev",
        password: "secreta123",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith("Usuario creado correctamente.");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("muestra el error del backend sin cerrar el modal", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) =>
        options.onError?.(
          responseError(409, { message: "El email ya está registrado." }),
        ),
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CreateUserModal onClose={onClose} />);

    await fill(user, {
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
      password: "secreta123",
      confirmPassword: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(toast.error).toHaveBeenCalledWith("El email ya está registrado.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra un mensaje genérico si el error no trae texto", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onError?.({}),
    );
    const user = userEvent.setup();
    render(<CreateUserModal onClose={vi.fn()} />);

    await fill(user, {
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
      password: "secreta123",
      confirmPassword: "secreta123",
    });
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(toast.error).toHaveBeenCalledWith("No pudimos crear el usuario.");
  });

  it("deshabilita el envío mientras la mutación está en curso", () => {
    pendingRef.current = true;

    render(<CreateUserModal onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Creando..." })).toBeDisabled();
  });

  it("se cierra con Escape, con Cancelar y con la X", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CreateUserModal onClose={onClose} />);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
