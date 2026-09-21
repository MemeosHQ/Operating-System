import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Allow server-only modules (providers, env config) to be unit tested.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
});
