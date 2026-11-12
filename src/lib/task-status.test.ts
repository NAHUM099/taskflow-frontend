import { describe, expect, it } from "vitest";
import { ALLOWED_TRANSITIONS, TASK_STATUS_META } from "@/lib/task-status";
import type { TaskStatus } from "@/lib/types";

const STATUSES: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

describe("TASK_STATUS_META", () => {
  it("define metadatos para los cuatro estados", () => {
    expect(Object.keys(TASK_STATUS_META).sort()).toEqual([...STATUSES].sort());
  });

  it("usa etiquetas en español no vacías y distintas entre sí", () => {
    const labels = STATUSES.map((status) => TASK_STATUS_META[status].label);

    labels.forEach((label) => expect(label.trim()).not.toBe(""));
    expect(new Set(labels).size).toBe(STATUSES.length);
  });

  it("usa clases de badge con la misma forma (fondo, texto y borde)", () => {
    STATUSES.forEach((status) => {
      expect(TASK_STATUS_META[status].badgeClass).toMatch(
        /^bg-\S+ text-\S+ border-\S+$/,
      );
    });
  });
});

describe("ALLOWED_TRANSITIONS", () => {
  it("refleja las transiciones permitidas por el backend", () => {
    expect(ALLOWED_TRANSITIONS).toEqual({
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["DONE", "CANCELLED"],
      DONE: [],
      CANCELLED: [],
    });
  });

  it("solo apunta a estados existentes", () => {
    STATUSES.forEach((status) => {
      ALLOWED_TRANSITIONS[status].forEach((target) => {
        expect(STATUSES).toContain(target);
      });
    });
  });

  it("no permite transiciones desde estados terminales", () => {
    expect(ALLOWED_TRANSITIONS.DONE).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toHaveLength(0);
  });

  it("no permite volver al mismo estado", () => {
    STATUSES.forEach((status) => {
      expect(ALLOWED_TRANSITIONS[status]).not.toContain(status);
    });
  });
});
