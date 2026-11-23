import { defineConfig, devices } from '@playwright/test';

const externalURL = process.env.YOMVI_BASE_URL;
const baseURL = externalURL || 'http://127.0.0.1:4173';
const chromiumPath = process.env.YOMVI_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  webServer: externalURL ? undefined : {
    command: 'npm run build && npm run dev -- --dist',
    env: { PORT: '4173' },
    url: baseURL,
    reuseExistingServer: false,
  },
  use: { baseURL },
  projects: [
    {
      name: 'chromium',
      testMatch: /desktop\.spec\.js/,
      use: { browserName: 'chromium', launchOptions: { executablePath: chromiumPath } },
    },
    {
      name: 'android-chromium',
      testMatch: /mobile\.spec\.js/,
      use: { ...devices['Pixel 7'], launchOptions: { executablePath: chromiumPath } },
    },
    {
      name: 'iphone-webkit',
      testMatch: /mobile\.spec\.js/,
      use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' },
    },
  ],
});
