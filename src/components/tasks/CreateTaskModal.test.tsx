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

type UserEventInstance = ReturnType<typeof userEvent.setup>;

// El buscador abre la lista al recibir foco; se elige la opción por su nombre.
async function chooseAssignee(
  user: UserEventInstance,
  name = "Ana Torres",
) {
  await user.click(screen.getByLabelText("Usuario asignado"));
  await user.click(screen.getByRole("option", { name }));
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
    const { title, description, submit } = renderModal();

    await user.type(title, "  Preparar informe  ");
    await user.type(description, "  Detalle mensual  ");
    await chooseAssignee(user);
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
    const { title, description, submit, onClose } = renderModal();

    await user.type(title, "Preparar informe");
    await user.type(description, "Detalle mensual");
    await chooseAssignee(user);
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
    const { title, description, submit, onClose } = renderModal();

    await user.type(title, "Preparar informe");
    await user.type(description, "Detalle mensual");
    await chooseAssignee(user);
    await user.click(submit);

    expect(toast.error).toHaveBeenCalledWith("El usuario no existe.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("deshabilita el buscador mientras carga usuarios", () => {
    usersState.data = undefined;
    usersState.isLoading = true;

    const { assignee } = renderModal();

    expect(assignee).toBeDisabled();
    expect(assignee).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Cargando usuarios"),
    );
  });

  it("avisa cuando no se pudieron cargar los usuarios", () => {
    usersState.data = undefined;
    usersState.isError = true;

    const { assignee } = renderModal();

    expect(assignee).toBeDisabled();
    expect(assignee).toHaveAttribute(
      "placeholder",
      "No se pudieron cargar los usuarios",
    );
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

  it("abre una lista desplazable con los usuarios disponibles", async () => {
    usersState.data = {
      content: [
        { id: 2, name: "Ana Torres" },
        { id: 3, name: "Jos\u00e9 Ram\u00edrez" },
        { id: 4, name: "Luc\u00eda P\u00e9rez" },
      ],
    };
    const user = userEvent.setup();
    const { assignee } = renderModal();

    await user.click(assignee);

    const list = screen.getByRole("listbox", { name: "Usuarios disponibles" });
    expect(list).toHaveClass("max-h-48");
    expect(list).toHaveClass("overflow-y-auto");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filtra usuarios por nombre sin distinguir acentos ni mayúsculas", async () => {
    usersState.data = {
      content: [
        { id: 2, name: "Ana Torres" },
        { id: 3, name: "Jos\u00e9 Ram\u00edrez" },
        { id: 4, name: "Luc\u00eda P\u00e9rez" },
      ],
    };
    const user = userEvent.setup();
    const { assignee } = renderModal();

    await user.click(assignee);
    await user.type(assignee, "JOSE");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      screen.getByRole("option", { name: "Jos\u00e9 Ram\u00edrez" }),
    ).toBeInTheDocument();
  });

  it("avisa cuando la búsqueda no encuentra usuarios", async () => {
    const user = userEvent.setup();
    const { assignee } = renderModal();

    await user.click(assignee);
    await user.type(assignee, "zzz");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(
      screen.getByText("No hay usuarios que coincidan con la búsqueda."),
    ).toBeInTheDocument();

    // Sin opciones, las flechas y Enter no seleccionan nada.
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("mantiene escrito el nombre del responsable elegido", async () => {
    const user = userEvent.setup();
    const { assignee } = renderModal();

    await chooseAssignee(user);

    // El nombre queda en el propio campo: no parece "sin asignar".
    expect(assignee).toHaveValue("Ana Torres");

    await user.click(assignee);
    expect(screen.getByRole("option", { name: "Ana Torres" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("busca de nuevo sin arrastrar el nombre ya escrito", async () => {
    usersState.data = {
      content: [
        { id: 2, name: "Ana Torres" },
        { id: 3, name: "Jos\u00e9 Ram\u00edrez" },
      ],
    };
    const user = userEvent.setup();
    const { assignee } = renderModal();

    await chooseAssignee(user);
    await user.type(assignee, "jose");

    expect(assignee).toHaveValue("jose");
    await user.click(
      screen.getByRole("option", { name: "Jos\u00e9 Ram\u00edrez" }),
    );
    expect(assignee).toHaveValue("Jos\u00e9 Ram\u00edrez");
  });

  it("descarta la búsqueda y vuelve a mostrar el asignado al salir del combo", async () => {
    usersState.data = {
      content: [
        { id: 2, name: "Ana Torres" },
        { id: 3, name: "Jos\u00e9 Ram\u00edrez" },
      ],
    };
    const user = userEvent.setup();
    const { title, assignee } = renderModal();

    await chooseAssignee(user);
    await user.type(assignee, "zzz");
    expect(
      screen.getByText("No hay usuarios que coincidan con la búsqueda."),
    ).toBeInTheDocument();

    await user.click(title);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(assignee).toHaveValue("Ana Torres");
  });

  it("permite elegir el responsable con el teclado", async () => {
    usersState.data = {
      content: [
        { id: 2, name: "Ana Torres" },
        { id: 3, name: "Jos\u00e9 Ram\u00edrez" },
      ],
    };
    const user = userEvent.setup();
    const { title, description, assignee, submit } = renderModal();

    await user.type(title, "Preparar informe");
    await user.type(description, "Detalle mensual");
    await user.click(assignee);
    await user.keyboard("{ArrowDown}{ArrowUp}{ArrowDown}{Enter}");

    // Al elegir, la lista se cierra y el foco sigue en el buscador.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(submit);

    expect(mutateMock).toHaveBeenCalledWith(
      { title: "Preparar informe", description: "Detalle mensual", userId: 3 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("cierra solo la lista de usuarios al presionar Escape", async () => {
    const user = userEvent.setup();
    const { assignee, onClose } = renderModal();

    await user.click(assignee);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Con la lista ya cerrada, Escape vuelve a cerrar el modal.
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
