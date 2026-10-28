import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { API_LOG } from './support/api-log';

const API = 'http://localhost:8084';
const WEB = 'http://localhost:3002';

/* The flows sign companies up through the api and remove none, so off CI they run only against
   the test database: both URLs name `heliogrid_test` (the `/task` test-database prefix), and the
   api this config starts reads them, since a shell variable wins over `.env.local`. Off CI a
   server already listening is never reused either: it may be one serving `heliogrid_dev`. */
const ON_CI = process.env.CI !== undefined;
const TEST_DATABASE = 'heliogrid_test';
/* `.env.local` fills only what the shell left unset, so the prefix's test URLs stand; it gives the
   seed its `DEV_OTP_CODE`. CI sets its variables itself. */
if (!ON_CI) {
  try {
    process.loadEnvFile(fileURLToPath(new URL('../../.env.local', import.meta.url)));
  } catch (error) {
    // No local file: the guard below then refuses, naming the prefix. Anything else is a broken
    // file, which must not read as a missing prefix.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
/* The QA companies are seeded only when asked by name (`--project qa-seed`), never in CI and never
   by a run of the flows: the seed needs the worker and Temporal, which a flow run does not. */
const SEEDING =
  !ON_CI &&
  (process.env.HELIOGRID_QA_SEED === 'on' || process.argv.some((arg) => arg.includes('qa-seed')));
/* Each Playwright worker reads this config again without the command line: it inherits the choice. */
if (SEEDING) process.env.HELIOGRID_QA_SEED = 'on';
const databaseNameOf = (url: string | undefined) => {
  if (!url) return undefined;
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return undefined;
  }
};
if (
  !ON_CI &&
  ![process.env.DATABASE_URL, process.env.DATABASE_ADMIN_URL].every(
    (url) => databaseNameOf(url) === TEST_DATABASE,
  )
) {
  throw new Error(
    `The web flows run locally only on ${TEST_DATABASE}: put the /task test-database prefix in front of the command (.claude/skills/task/SKILL.md, top).`,
  );
}

/**
 * The web suite, against the BUILT api and web. `webServer` is the one thing that starts them: in
 * CI, whose ports are free, it starts both; locally it starts both too, on the test database, after
 * `/task`'s clean-up has freed the ports. Every flow runs at the two viewports `F7-43` item 1 names. `retries: 0` — a flake
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
    ...(SEEDING
      ? [
          {
            name: 'qa-seed',
            testMatch: 'qa-seed.setup.ts',
            metadata: { api: API, otpCode: process.env.DEV_OTP_CODE ?? '' },
          },
        ]
      : []),
  ],
  /* The seed talks to the api alone, and the api runs the invite message's step against Temporal,
     so it mints Temporal's token first, as the `api` launch configuration does. */
  webServer: [
    {
      command: `bash -c 'mkdir -p "$(dirname "${API_LOG}")"; ${SEEDING ? 'pnpm -w infra:token && ' : ''}exec pnpm --filter @heliogrid/api start >> "${API_LOG}" 2>&1'`,
      url: `${API}/health/ready`,
      reuseExistingServer: ON_CI,
      timeout: 60_000,
    },
    ...(SEEDING
      ? []
      : [
          {
            command: 'pnpm --filter @heliogrid/web start',
            url: WEB,
            reuseExistingServer: ON_CI,
            timeout: 60_000,
          },
        ]),
  ],
});
