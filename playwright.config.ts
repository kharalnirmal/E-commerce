import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;
const useProductionBuild = Boolean(process.env.CI || process.env.PLAYWRIGHT_USE_BUILD);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  expect: { timeout: 30_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: useProductionBuild ? `npm run start -- --port ${port}` : `npm run dev -- --port ${port}`,
    env: {
      DEMO_MODE: "true",
      DEMO_PASSWORD: process.env.DEMO_PASSWORD ?? "demo-password-for-tests",
      ESEWA_GATEWAY_MODE: "mock",
      APP_URL: baseURL,
      BETTER_AUTH_URL: baseURL,
    },
    url: baseURL,
    reuseExistingServer: !useProductionBuild,
    timeout: 120_000,
  },
});
