import { describe, expect, it } from "vitest";
import { taskKeys, userKeys } from "@/lib/query-keys";

describe("taskKeys", () => {
  it("expone la raíz de la caché de tareas", () => {
    expect(taskKeys.all).toEqual(["tasks"]);
  });

  it("usa un filtro vacío cuando no se pasan filtros", () => {
    expect(taskKeys.list()).toEqual(["tasks", "list", {}]);
  });

  it("genera la misma clave para filtros equivalentes", () => {
    expect(taskKeys.list({ status: "DONE" })).toEqual(
      taskKeys.list({ status: "DONE" }),
    );
    expect(taskKeys.list({ userId: 2 })).toEqual(taskKeys.list({ userId: 2 }));
  });

  it("distingue claves con filtros distintos", () => {
    expect(taskKeys.list({ status: "DONE" })).not.toEqual(
      taskKeys.list({ status: "CANCELLED" }),
    );
    expect(taskKeys.list({ userId: 0 })).not.toEqual(taskKeys.list());
  });

  it("cuelga las listas de la raíz para invalidar por prefijo", () => {
    expect(taskKeys.list({ status: "DONE" }).slice(0, 1)).toEqual(taskKeys.all);
    expect(taskKeys.list({ userId: 2 }).slice(0, 1)).toEqual(taskKeys.all);
  });
});

describe("userKeys", () => {
  it("expone la raíz de la caché de usuarios", () => {
    expect(userKeys.all).toEqual(["users"]);
  });

  it("usa parámetros vacíos por defecto", () => {
    expect(userKeys.list()).toEqual(["users", "list", {}]);
  });

  it("incluye página, tamaño y búsqueda en la clave", () => {
    expect(userKeys.list({ page: 2, size: 10, search: "ana" })).toEqual([
      "users",
      "list",
      { page: 2, size: 10, search: "ana" },
    ]);
  });

  it("distingue búsquedas distintas y comparte raíz", () => {
    expect(userKeys.list({ search: "ana" })).not.toEqual(
      userKeys.list({ search: "luis" }),
    );
    expect(userKeys.list({ search: "ana" }).slice(0, 1)).toEqual(userKeys.all);
  });
});
