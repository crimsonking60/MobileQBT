import { defineConfig, devices } from '@playwright/test';

// e2e runs against the dev qBittorrent from docker-compose.yml (admin / mobileqbt-dev).
// Default: vite dev server proxying to it. With E2E_BASE_URL (e.g. http://localhost:28080) it
// tests an already-deployed build instead, such as the alt-WebUI one: npm run package, then
//   E2E_BASE_URL=http://localhost:28080 npm run test:e2e
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: external ?? 'http://localhost:5199' },
  projects: [
    { name: 'phone', testIgnore: /wide|audit/, use: { ...devices['Pixel 7'] } },
    { name: 'tablet', testMatch: /wide/, use: { ...devices['iPad (gen 7) landscape'], defaultBrowserType: 'chromium' } },
    // visual audit (AUDIT=1 npx playwright test audit): screenshots of every screen, light and dark
    ...(process.env.AUDIT
      ? [
          { name: 'audit-phone', testMatch: /audit/, use: { ...devices['Pixel 7'], deviceScaleFactor: 1 } },
          { name: 'audit-tablet', testMatch: /audit/, use: { ...devices['iPad (gen 7) landscape'], defaultBrowserType: 'chromium' as const, deviceScaleFactor: 1 } },
          { name: 'audit-tablet-portrait', testMatch: /audit/, use: { ...devices['iPad (gen 7)'], defaultBrowserType: 'chromium' as const, deviceScaleFactor: 1 } },
        ]
      : []),
  ],
  webServer: external
    ? undefined
    : { command: 'npx vite --port 5199', url: 'http://localhost:5199', reuseExistingServer: true },
});
