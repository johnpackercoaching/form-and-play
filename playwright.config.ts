import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    headless: true,
    channel: 'chrome',
    launchOptions: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    },
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chrome',
      use: {},
    },
  ],
});
