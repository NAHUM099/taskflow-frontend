import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { responseError } from "@/test/axios";
import { CreateTaskModal } from "./CreateTaskModal";

const { mutateMock, usersState } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  usersState: {
    data: undefined as { content: { id: number | null; name: string }[] } | undefined,
    isLoading: false,
    isError: false,
  },
}));

vi.mock("@/hooks/mutations/useCreateTask", () => ({
  useCreateTask: () => ({ mutate: mutateMock, isPending: false }),
}));

vi.mock("@/hooks/queries/useUsers", () => ({ useUsers: () => usersState }));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

function renderModal(onClose = vi.fn()) {
  render(<CreateTaskModal onClose={onClose} />);

  return {
    onClose,
    title: screen.getByLabelText("Título"),
    description: screen.getByLabelText("Descripción"),
    assignee: screen.getByLabelText("Usuario asignado"),
    submit: screen.getByRole("button", { name: "Crear tarea" }),
  };
}

describe("CreateTaskModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    usersState.data = { content: [{ id: 2, name: "Ana Torres" }] };
    usersState.isLoading = false;
    usersState.isError = false;
  });

  it("exige título, descripción y usuario", async () => {
    const user = userEvent.setup();
    const { submit } = renderModal();

    await user.click(submit);

    expect(screen.getByText("El título es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripción es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona un usuario.")).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("valida la longitud mínima y máxima de la descripción", async () => {
    const user = userEvent.setup();
    const { description, submit } = renderModal();

    await user.type(description, "hola");
    await user.click(submit);
    expect(
      screen.getByText("La descripción debe tener al menos 5 caracteres."),
    ).toBeInTheDocument();

    fireEvent.change(description, { target: { value: "a".repeat(201) } });
    await user.click(submit);
    expect(
      screen.getByText("La descripción no debe superar 200 caracteres."),
    ).toBeInTheDocument();
  });

  it("envía el formulario válido recortando espacios", async () => {
    const user = userEvent.setup();
    const { title, description, assignee, submit } = renderModal();

    await user.type(title, "  Preparar informe  ");
    await user.type(description, "  Detalle mensual  ");
    await user.selectOptions(assignee, "2");
    await user.click(submit);

    expect(mutateMock).toHaveBeenCalledWith(
      {
        title: "Preparar informe",
        description: "Detalle mensual",
        userId: 2,
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("confirma con un toast y cierra al crear", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();
    const { title, description, assignee, submit, onClose } = renderModal();

    await user.type(title, "Preparar informe");
    await user.type(description, "Detalle mensual");
    await user.selectOptions(assignee, "2");
    await user.click(submit);

    expect(toast.success).toHaveBeenCalledWith("Tarea creada correctamente.");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("muestra el error del backend sin cerrar el modal", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) =>
        options.onError?.(responseError(400, { message: "El usuario no existe." })),
    );
    const user = userEvent.setup();
    const { title, description, assignee, submit, onClose } = renderModal();

    await user.type(title, "Preparar informe");
    await user.type(description, "Detalle mensual");
    await user.selectOptions(assignee, "2");
    await user.click(submit);

    expect(toast.error).toHaveBeenCalledWith("El usuario no existe.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("deshabilita el select mientras carga usuarios", () => {
    usersState.data = undefined;
    usersState.isLoading = true;

    const { assignee } = renderModal();

    expect(assignee).toBeDisabled();
    expect(screen.getByText("Cargando usuarios…")).toBeInTheDocument();
  });

  it("avisa cuando no se pudieron cargar los usuarios", () => {
    usersState.data = undefined;
    usersState.isError = true;

    const { assignee } = renderModal();

    expect(assignee).toBeDisabled();
    expect(
      screen.getByText("No pudimos cargar los usuarios para asignar la tarea."),
    ).toBeInTheDocument();
  });

  it("se cierra con Escape y con el botón de cerrar", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
