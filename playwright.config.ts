import { defineConfig, devices } from "@playwright/test";

// Test accounts (E2E_ADMIN_EMAIL etc.) come from the environment, or .env.local when run locally.
try {
  process.loadEnvFile(".env.local");
} catch {}

// Point E2E_BASE_URL at a running server, or the tests start `npm run start` (run `npm run build` first).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: "retain-on-failure" },
  // Locally use the installed Chrome; CI installs Playwright's Chromium.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" } }],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run start", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
