import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Local runs pick up QA_PASSWORD from a gitignored qa.env file. In the cloud
// routine it comes from the environment instead, so the file won't exist.
if (existsSync('qa.env')) {
  process.loadEnvFile('qa.env');
}

// Runs against the live production frontend/backend: there's no separate
// staging environment for this project. Every test that creates data uses
// the dedicated QA fixtures (see e2e/fixtures/accounts.js) and cleans up
// after itself, so it never touches a real family's or coach's data.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.QA_BASE_URL || 'https://huskieshub-frontend-891073803869.us-central1.run.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
