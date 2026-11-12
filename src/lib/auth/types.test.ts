import { describe, expect, it } from "vitest";
import { ROLE_LABELS } from "@/lib/auth/types";

describe("ROLE_LABELS", () => {
  it("traduce los tres roles al español", () => {
    expect(ROLE_LABELS).toEqual({
      ROLE_ADMIN: "Administrador",
      ROLE_MODERATOR: "Moderador",
      ROLE_USER: "Usuario",
    });
  });
});
