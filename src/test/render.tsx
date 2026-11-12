import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

// Mismo orden de providers que src/app/layout.tsx: AuthProvider -> QueryClientProvider.
export function createProvidersWrapper(
  queryClient: QueryClient = createTestQueryClient(),
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: ProvidersOptions = {},
) {
  return {
    queryClient,
    ...render(ui, {
      wrapper: createProvidersWrapper(queryClient),
      ...renderOptions,
    }),
  };
}

