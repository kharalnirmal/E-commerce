import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/server/**/*.test.ts"],
    environment: "node",
  },
});
