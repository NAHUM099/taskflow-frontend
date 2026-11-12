import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost:3000" },
    },
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:8080",
    },
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/app/**",
        "src/lib/types.ts",
        "src/**/*.d.ts",
        // Solo configura el QueryClient (staleTime/retry): testear el cliente de
        // React Query no aporta señal sobre nuestro código.
        "src/components/providers/QueryProvider.tsx",
      ],
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 90,
        branches: 90,
        "src/lib/**": {
          lines: 95,
          statements: 95,
          functions: 95,
          branches: 90,
        },
        "src/hooks/**": {
          lines: 100,
          statements: 100,
          functions: 100,
          branches: 100,
        },
        "src/components/**": {
          lines: 90,
          statements: 90,
          functions: 85,
          branches: 85,
        },
        "src/components/dashboard/**": {
          lines: 100,
          statements: 100,
          functions: 100,
          branches: 85,
        },
        "src/components/layout/**": {
          lines: 95,
          statements: 95,
          functions: 90,
          branches: 90,
        },
      },
    },
  },
});
