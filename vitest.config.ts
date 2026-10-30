import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["lib/**/*.test.ts"], env: { AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long" } },
});
