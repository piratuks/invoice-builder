import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5183',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome']
  },
  webServer: [
    {
      command: 'npm run dev:webserver',
      url: 'http://127.0.0.1:3013/api/health',
      env: { PORT: '3013', FE_SERVER_URL: 'http://127.0.0.1:5183' },
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: 'npm run dev:react -- --host 127.0.0.1 --port 5183',
      url: 'http://127.0.0.1:5183',
      env: { VITE_API_URL: 'http://127.0.0.1:3013' },
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
});
