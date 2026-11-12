import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TaskStatus } from "@/lib/types";
import { TaskStatusBadge } from "./TaskStatusBadge";

// Etiquetas literales a propósito: el test y el componente no comparten fuente,
// así una etiqueta mal escrita en TASK_STATUS_META sí rompe la suite.
const LABELS: Array<[TaskStatus, string]> = [
  ["PENDING", "Pendiente"],
  ["IN_PROGRESS", "En progreso"],
  ["DONE", "Completada"],
  ["CANCELLED", "Cancelada"],
];

describe("TaskStatusBadge", () => {
  it.each(LABELS)("muestra la etiqueta en español de %s", (status, label) => {
    render(<TaskStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
