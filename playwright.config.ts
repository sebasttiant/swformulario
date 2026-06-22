import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright smoke config. Runs against an already-running app (app + db must be
 * up and seeded, e.g. `docker compose up`). Override the base URL with
 * PLAYWRIGHT_BASE_URL.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
