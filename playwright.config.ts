import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { config as loadDotenv } from 'dotenv';

// NEXT_PUBLIC_SUPABASE_* from .env.local, plus optional E2E_* test accounts.
loadEnvConfig(process.cwd(), true);
loadDotenv({ path: '.env.test.local' });

const PORT = 9002;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the installed Google Chrome so no extra browser download is needed.
    channel: 'chrome',
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
