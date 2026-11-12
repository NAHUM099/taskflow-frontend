import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeUser } from "@/test/factories";
import { UserList } from "./UserList";

describe("UserList", () => {
  it("avisa cuando no hay usuarios registrados", () => {
    render(
      <UserList
        users={[]}
        searching={false}
        onEdit={() => {}}
        onChangePassword={() => {}}
        onChangeStatus={() => {}}
      />,
    );

    expect(screen.getByText("No hay usuarios registrados.")).toBeInTheDocument();
  });

  it("distingue el vacío por búsqueda", () => {
    render(
      <UserList
        users={[]}
        searching
        onEdit={() => {}}
        onChangePassword={() => {}}
        onChangeStatus={() => {}}
      />,
    );

    expect(
      screen.getByText("No se encontraron usuarios para tu búsqueda."),
    ).toBeInTheDocument();
  });

  it("lista un usuario por fila con su email", () => {
    const users = [
      makeUser({ id: 1, name: "Ana Torres", email: "ana@taskflow.dev" }),
      makeUser({ id: 2, name: "Luis Pérez", email: "luis@taskflow.dev" }),
    ];

    render(
      <UserList
        users={users}
        searching={false}
        onEdit={() => {}}
        onChangePassword={() => {}}
        onChangeStatus={() => {}}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByText("ana@taskflow.dev")).toHaveLength(2);
  });

  it("entrega el usuario seleccionado al editar", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const target = makeUser({ id: 5, name: "Luis Pérez" });

    render(
      <UserList
        users={[target]}
        searching={false}
        onEdit={onEdit}
        onChangePassword={() => {}}
        onChangeStatus={() => {}}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Editar usuario Luis Pérez" }),
    );

    expect(onEdit).toHaveBeenCalledWith(target);
  });

  it("entrega el usuario seleccionado al actualizar su contraseña", async () => {
    const onChangePassword = vi.fn();
    const user = userEvent.setup();
    const target = makeUser({ id: 6, name: "Ana Torres" });

    render(
      <UserList
        users={[target]}
        searching={false}
        onEdit={() => {}}
        onChangePassword={onChangePassword}
        onChangeStatus={() => {}}
      />,
    );
    await user.click(
      screen.getByRole("button", {
        name: "Actualizar contraseña de Ana Torres",
      }),
    );

    expect(onChangePassword).toHaveBeenCalledWith(target);
  });

  it("entrega el usuario seleccionado al inactivar", async () => {
    const onChangeStatus = vi.fn();
    const user = userEvent.setup();
    const target = makeUser({ id: 8, name: "Luis Pérez", active: true });

    render(
      <UserList
        users={[target]}
        searching={false}
        onEdit={() => {}}
        onChangePassword={() => {}}
        onChangeStatus={onChangeStatus}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Inactivar usuario Luis Pérez" }),
    );

    expect(onChangeStatus).toHaveBeenCalledWith(target);
    expect(screen.queryByText("Inactivo")).not.toBeInTheDocument();
  });

  it("marca como inactivo y ofrece activar a un usuario desactivado", async () => {
    const onChangeStatus = vi.fn();
    const user = userEvent.setup();
    const target = makeUser({ id: 9, name: "Ana Torres", active: false });

    render(
      <UserList
        users={[target]}
        searching={false}
        onEdit={() => {}}
        onChangePassword={() => {}}
        onChangeStatus={onChangeStatus}
      />,
    );

    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Inactivar usuario Ana Torres" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Activar usuario Ana Torres" }),
    );

    expect(onChangeStatus).toHaveBeenCalledWith(target);
  });
});
