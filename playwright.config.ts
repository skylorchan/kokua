import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Cloud dev containers ship a preinstalled Chromium that may not match this Playwright
// version. Point at it with PW_CHROMIUM_PATH=/path/to/chrome instead of reinstalling.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/2425/`,
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  // Test the production build, because the service worker only exists there.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/2425/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Pixel 5-sized viewport: our target is a small Android phone.
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
});
