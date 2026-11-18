const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  workers: '100%', // safe: every sign-in gets a fresh user id from the fake Supabase
  use: { baseURL: 'http://127.0.0.1:3190', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    // Font detection and hydration depend on the browser.
    { name: 'firefox', use: { browserName: 'firefox' }, testMatch: 'hydration.spec.js' },
  ],
  webServer: {
    command: 'node stack.js',
    url: 'http://127.0.0.1:3190',
    timeout: 300_000, // includes the web export
    reuseExistingServer: !process.env.CI,
  },
});
