import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./tests/server/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/server/**/*.test.ts"],
    environment: "node",
  },
});
