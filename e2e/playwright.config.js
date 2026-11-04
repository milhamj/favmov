const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  workers: 1, // one shared API and fake Supabase; each test signs in as a fresh user
  use: { baseURL: 'http://127.0.0.1:3190', trace: 'retain-on-failure' },
  webServer: {
    command: 'node stack.js',
    url: 'http://127.0.0.1:3190',
    timeout: 300_000, // includes the web export
    reuseExistingServer: !process.env.CI,
  },
});
