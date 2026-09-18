import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

const edgeExecutable =
  process.env.PLAYWRIGHT_EDGE_EXECUTABLE ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  timeout: 180_000,
  webServer: [
    {
      command: 'go run ./cmd/blueprint-qa',
      cwd: path.resolve(configDir, '../quotation-api'),
      url: 'http://127.0.0.1:18080/qa/session',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'yarn dev --host 127.0.0.1 --port 18081',
      cwd: configDir,
      env: { VITE_SERVER_URL: 'http://127.0.0.1:18080' },
      url: 'http://127.0.0.1:18081/',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: edgeExecutable },
  },
});
