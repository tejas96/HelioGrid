import { defineConfig, devices } from '@playwright/test';
import { API_LOG } from './support/api-log';

const API = 'http://localhost:8084';
const WEB = 'http://localhost:3002';

/**
 * The web suite, against the BUILT api and web. `webServer` is the one thing that starts them,
 * and a server already listening is reused rather than started twice — so CI, whose ports are
 * free, starts both, and a developer's running servers are driven as they are. Every flow runs at the two viewports `F7-43` item 1 names. `retries: 0` — a flake
 * is a bug to fix, never a pass on the second try; the trace of a failure is kept for replay.
 */
export default defineConfig({
  testDir: './web',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  retries: 0,
  forbidOnly: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: WEB, trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1536, height: 960 } },
    },
  ],
  webServer: [
    {
      command: `bash -c 'mkdir -p "$(dirname "${API_LOG}")"; exec pnpm --filter @heliogrid/api start > "${API_LOG}" 2>&1'`,
      url: `${API}/health/ready`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @heliogrid/web start',
      url: WEB,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
