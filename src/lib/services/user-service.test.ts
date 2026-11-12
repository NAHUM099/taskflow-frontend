import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUser,
  getUsers,
  updateUser,
  updateUserPassword,
  updateUserStatus,
} from "@/lib/services/user-service";
import { makeUser, makeUserPage } from "@/test/factories";

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api: { get, post, patch } }));

describe("getUsers", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("usa page 0 y size 10 por defecto", async () => {
    const page = makeUserPage();
    get.mockResolvedValue({ data: page });

    await expect(getUsers()).resolves.toEqual(page);
    expect(get).toHaveBeenCalledWith("/users", {
      params: { page: 0, size: 10 },
    });
  });

  it("respeta la página y el tamaño solicitados", async () => {
    get.mockResolvedValue({ data: makeUserPage() });

    await getUsers({ page: 3, size: 25 });

    expect(get).toHaveBeenCalledWith("/users", {
      params: { page: 3, size: 25 },
    });
  });

  it("envía la búsqueda cuando tiene valor", async () => {
    get.mockResolvedValue({ data: makeUserPage() });

    await getUsers({ search: "ana" });

    expect(get).toHaveBeenCalledWith("/users", {
      params: { page: 0, size: 10, search: "ana" },
    });
  });

  it("omite la búsqueda cuando está vacía", async () => {
    get.mockResolvedValue({ data: makeUserPage() });

    await getUsers({ search: "" });

    expect(get).toHaveBeenCalledWith("/users", {
      params: { page: 0, size: 10 },
    });
  });
});

describe("createUser", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("hace POST /users con el cuerpo recibido", async () => {
    const user = makeUser({
      id: 9,
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
    });
    post.mockResolvedValue({ data: user });

    await expect(
      createUser({
        name: "Luis Pérez",
        email: "luis@taskflow.dev",
        password: "secreta123",
      }),
    ).resolves.toEqual(user);
    expect(post).toHaveBeenCalledWith("/users", {
      name: "Luis Pérez",
      email: "luis@taskflow.dev",
      password: "secreta123",
    });
  });

  it("propaga los errores de la API", async () => {
    post.mockRejectedValue(new Error("409"));

    await expect(
      createUser({ name: "Luis", email: "luis@taskflow.dev", password: "secreta123" }),
    ).rejects.toThrow("409");
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    patch.mockReset();
  });

  it("hace PATCH /users/:id con el cuerpo recibido", async () => {
    const user = makeUser({ id: 4, name: "Ana Actualizada" });
    patch.mockResolvedValue({ data: user });

    await expect(
      updateUser(4, { name: "Ana Actualizada", email: "ana@taskflow.dev" }),
    ).resolves.toEqual(user);
    expect(patch).toHaveBeenCalledWith("/users/4", {
      name: "Ana Actualizada",
      email: "ana@taskflow.dev",
    });
  });

  it("propaga los errores de la API", async () => {
    patch.mockRejectedValue(new Error("409"));

    await expect(
      updateUser(4, { name: "x", email: "x@y.dev" }),
    ).rejects.toThrow("409");
  });
});

describe("updateUserPassword", () => {
  beforeEach(() => {
    patch.mockReset();
  });

  it("hace PATCH /users/:id/password con la nueva contraseña", async () => {
    patch.mockResolvedValue({ data: undefined });

    await expect(
      updateUserPassword(4, { newPassword: "nueva123" }),
    ).resolves.toBeUndefined();
    expect(patch).toHaveBeenCalledWith("/users/4/password", {
      newPassword: "nueva123",
    });
  });

  it("propaga los errores de la API", async () => {
    patch.mockRejectedValue(new Error("404"));

    await expect(
      updateUserPassword(4, { newPassword: "nueva123" }),
    ).rejects.toThrow("404");
  });
});

describe("updateUserStatus", () => {
  beforeEach(() => {
    patch.mockReset();
  });

  it("hace PATCH /users/:id/status y devuelve el usuario actualizado", async () => {
    const inactiveUser = makeUser({ id: 4, active: false });
    patch.mockResolvedValue({ data: inactiveUser });

    await expect(updateUserStatus(4, { active: false })).resolves.toEqual(
      inactiveUser,
    );
    expect(patch).toHaveBeenCalledWith("/users/4/status", { active: false });
  });

  it("propaga los errores de la API", async () => {
    patch.mockRejectedValue(new Error("404"));

    await expect(updateUserStatus(4, { active: true })).rejects.toThrow("404");
  });
});
