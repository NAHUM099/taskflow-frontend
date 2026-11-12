import { vi } from "vitest";

// Uso en cada archivo de test:
// vi.mock("next/navigation", async () => (await import("@/test/navigation")).navigationMock);
export const routerMock = {
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

// Ruta activa simulada; se cambia con setPathname() y se restablece con resetPathname().
export const navigationState = { pathname: "/" };

export function setPathname(pathname: string): void {
  navigationState.pathname = pathname;
}

export function resetPathname(): void {
  navigationState.pathname = "/";
}

export const navigationMock = {
  useRouter: () => routerMock,
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(),
};
