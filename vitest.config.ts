import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
});
