import { defineConfig, devices } from '@playwright/test';

// e2e runs against the dev qBittorrent from docker-compose.yml (admin / mobileqbt-dev)
export default defineConfig({
  testDir: 'tests',
  use: { baseURL: 'http://localhost:5199' },
  projects: [
    { name: 'phone', testIgnore: /wide/, use: { ...devices['Pixel 7'] } },
    { name: 'tablet', testMatch: /wide/, use: { ...devices['iPad (gen 7) landscape'], defaultBrowserType: 'chromium' } },
  ],
  webServer: { command: 'npx vite --port 5199', url: 'http://localhost:5199', reuseExistingServer: true },
});
