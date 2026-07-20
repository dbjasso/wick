import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: cada spec corre en los 5 viewports (projects).
 * Auth: tests/auth.setup.ts guarda sesión en playwright/.auth/user.json
 * Credenciales: E2E_EMAIL + E2E_PASSWORD (o ADMIN_EMAIL + E2E_PASSWORD).
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 60_000,
  expect: {
    // Screenshots: tolerancia ligera por anti-aliasing entre OS
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Login una vez; el resto reutiliza storageState
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "Mobile",
      use: {
        ...devices["iPhone 13"], // 390x844
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: "Mobile Android",
      use: {
        ...devices["Pixel 5"], // 393x851
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: "Tablet",
      use: {
        ...devices["iPad Mini"], // 768x1024
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: "Laptop",
      use: {
        viewport: { width: 1366, height: 768 },
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: "Desktop",
      use: {
        viewport: { width: 1920, height: 1080 },
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
});
