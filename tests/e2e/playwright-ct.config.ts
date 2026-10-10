import { defineConfig, devices } from '@playwright/experimental-ct-react';

/**
 * The component suite: the real `@heliogrid/ui` web halves, mounted with the app's own stylesheets
 * (`playwright/index.tsx`), so a component measures as it renders in `apps/web`. `retries: 0` — a
 * flake is a bug to fix, never a pass on the second try. Its output and report folders are its
 * own: Playwright empties the output folder when a run starts, and CI runs this suite after the
 * web flows, so a shared folder would wipe a failed look's actual image before it is kept.
 */
export default defineConfig({
  testDir: './components',
  testMatch: '*.spec.tsx',
  retries: 0,
  forbidOnly: true,
  outputDir: './test-results-ct',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-ct' }]],
  use: {
    ctPort: 3100,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
