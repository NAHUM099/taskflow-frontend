import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { responseError } from "@/test/axios";
import { makeTask } from "@/test/factories";
import { TaskStatusMenu } from "./TaskStatusMenu";

const { mutateMock, state } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  state: { isPending: false },
}));

vi.mock("@/hooks/mutations/useUpdateTaskStatus", () => ({
  useUpdateTaskStatus: () => ({
    mutate: mutateMock,
    isPending: state.isPending,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

describe("TaskStatusMenu", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    state.isPending = false;
  });

  it("abre el menú solo con las transiciones permitidas", async () => {
    const user = userEvent.setup();
    render(<TaskStatusMenu task={makeTask({ status: "PENDING" })} />);

    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));

    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["En progreso", "Cancelada"]);
    expect(screen.getByRole("button", { name: /Cambiar estado/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("cambia el estado y confirma con un toast", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) => options.onSuccess?.(),
    );
    const user = userEvent.setup();

    render(<TaskStatusMenu task={makeTask({ id: 7, status: "PENDING" })} />);
    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.click(screen.getByRole("menuitem", { name: "En progreso" }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 7, status: "IN_PROGRESS" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Estado actualizado correctamente.");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("muestra el mensaje del backend cuando falla", async () => {
    mutateMock.mockImplementation(
      (_vars: unknown, options: MutationOptions) =>
        options.onError?.(responseError(409, { message: "Transición no permitida." })),
    );
    const user = userEvent.setup();

    render(<TaskStatusMenu task={makeTask({ status: "PENDING" })} />);
    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.click(screen.getByRole("menuitem", { name: "Cancelada" }));

    expect(toast.error).toHaveBeenCalledWith("Transición no permitida.");
  });

  it("no muta si la tarea no tiene id", async () => {
    const user = userEvent.setup();

    render(<TaskStatusMenu task={makeTask({ id: null })} />);
    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.click(screen.getByRole("menuitem", { name: "En progreso" }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("cierra el menú con Escape y al hacer clic fuera", async () => {
    const user = userEvent.setup();

    render(<TaskStatusMenu task={makeTask({ status: "IN_PROGRESS" })} />);
    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.click(document.body);
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("se deshabilita mientras actualiza", () => {
    state.isPending = true;

    render(<TaskStatusMenu task={makeTask({ status: "PENDING" })} />);

    expect(screen.getByRole("button", { name: /Cambiar estado/ })).toBeDisabled();
  });
});
