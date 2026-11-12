import { describe, expect, it } from "vitest";
import {
  getSectionTitle,
  getVisibleNavItems,
  isActivePath,
  navItems,
} from "@/lib/navigation";

describe("navItems", () => {
  it("define las tres secciones del shell", () => {
    expect(navItems.map((item) => item.href)).toEqual(["/", "/tasks", "/users"]);
  });

  it("restringe Usuarios a administradores", () => {
    const users = navItems.find((item) => item.href === "/users");

    expect(users?.roles).toEqual(["ROLE_ADMIN"]);
  });
});

describe("getVisibleNavItems", () => {
  it("no devuelve nada sin rol", () => {
    expect(getVisibleNavItems(undefined)).toEqual([]);
  });

  it("muestra Dashboard y Tareas a un usuario estándar", () => {
    expect(getVisibleNavItems("ROLE_USER").map((item) => item.href)).toEqual([
      "/",
      "/tasks",
    ]);
  });

  it("muestra las mismas secciones a un moderador", () => {
    expect(
      getVisibleNavItems("ROLE_MODERATOR").map((item) => item.href),
    ).toEqual(["/", "/tasks"]);
  });

  it("añade Usuarios para un administrador", () => {
    expect(getVisibleNavItems("ROLE_ADMIN").map((item) => item.href)).toEqual([
      "/",
      "/tasks",
      "/users",
    ]);
  });
});

describe("isActivePath", () => {
  it("marca la raíz solo en coincidencia exacta", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/tasks", "/")).toBe(false);
  });

  it("marca coincidencia exacta y subrutas", () => {
    expect(isActivePath("/tasks", "/tasks")).toBe(true);
    expect(isActivePath("/tasks/123", "/tasks")).toBe(true);
  });

  it("no confunde prefijos parciales", () => {
    expect(isActivePath("/tasks-extra", "/tasks")).toBe(false);
    expect(isActivePath("/users/ana/detalle", "/users")).toBe(true);
  });
});

describe("getSectionTitle", () => {
  it("devuelve Dashboard en la raíz", () => {
    expect(getSectionTitle("/")).toBe("Dashboard");
  });

  it("deriva el título de la sección activa", () => {
    expect(getSectionTitle("/tasks")).toBe("Tareas");
    expect(getSectionTitle("/tasks/42")).toBe("Tareas");
    expect(getSectionTitle("/users/7")).toBe("Usuarios");
  });

  it("cae en TaskFlow para rutas desconocidas", () => {
    expect(getSectionTitle("/reportes")).toBe("TaskFlow");
  });
});
