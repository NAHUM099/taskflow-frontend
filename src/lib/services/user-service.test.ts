import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUsers, updateUser } from "@/lib/services/user-service";
import { makeUser, makeUserPage } from "@/test/factories";

const { get, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api: { get, patch } }));

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
