import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionCacheReset } from "@/components/providers/SessionCacheReset";
import { removeToken, setToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";
import { renderWithProviders } from "@/test/render";

const CACHE_KEY = ["tasks", "list"];

describe("SessionCacheReset", () => {
  it("vacía la caché al entrar con otro usuario", () => {
    const { queryClient } = renderWithProviders(<SessionCacheReset />);

    act(() => setToken(makeJwt({ sub: "admin@taskflow.dev", role: "ROLE_ADMIN" })));
    queryClient.setQueryData(CACHE_KEY, { content: [] });

    act(() => setToken(makeJwt({ sub: "luis@taskflow.dev", role: "ROLE_USER" })));

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("vacía la caché al cerrar sesión", () => {
    const { queryClient } = renderWithProviders(<SessionCacheReset />);

    act(() => setToken(makeJwt({ sub: "admin@taskflow.dev", role: "ROLE_ADMIN" })));
    queryClient.setQueryData(CACHE_KEY, { content: [] });

    act(() => removeToken());

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("conserva la caché si se refresca el token del mismo usuario", () => {
    const { queryClient } = renderWithProviders(<SessionCacheReset />);

    act(() => setToken(makeJwt({ sub: "admin@taskflow.dev", role: "ROLE_ADMIN" })));
    queryClient.setQueryData(CACHE_KEY, { content: [] });

    act(() =>
      setToken(makeJwt({ sub: "admin@taskflow.dev", role: "ROLE_ADMIN", iat: 1_800_000_000 })),
    );

    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
  });
});
