import { readFileSync } from 'node:fs';
import { configDefaults, defineConfig } from 'vitest/config';

/* The layers a unit test may live in, read from the one file that states them
   (`packages/config/unit-test-packages.json`). A JSON read rather than an import so this
   config needs no resolver and no build step to know the corpus. */
const { packages: UNIT_TEST_PACKAGES, coverage: COVERED_SOURCES } = JSON.parse(
  readFileSync(new URL('./packages/config/unit-test-packages.json', import.meta.url), 'utf8'),
) as { packages: string[]; coverage: string[] };

/** Every line, branch and function: the bar each glob below lands at (`.claude/rules/testing.md`). */
const COMPLETE = { statements: 100, branches: 100, functions: 100, lines: 100 };

/**
 * Unit tests sit beside `tests/invariants/`: the two prove different
 * things and neither replaces the other.
 *
 *   * an INVARIANT proves a property of the SYSTEM — tenancy holds, the contract and the
 *     database agree, one format implementation exists. It runs against real state.
 *   * a UNIT TEST proves one DECISION at its edges — the rung boundary, the empty input, the
 *     negative, the value one below the threshold. It runs against a pure function.
 *
 * Tests live at `<package>/tests/**`, never inside `src/`: a test under `src/` is compiled
 * into the package's own `dist/` by its build and ships. dependency-cruiser's
 * `no-tests-outside-the-tests-tree` holds that, plus the `*.test.ts` name and the package list,
 * over the same corpus file.
 */
/*
 * `.env.local` reaches the tests, exactly as it reaches the invariants (whose runner passes
 * `--env-file-if-exists`), so a test needing the local database runs against it rather than
 * skipping. Node's own loader, so no dependency and no second dotenv parser; absent, CI's real
 * variables stand as they are.
 */
try {
  process.loadEnvFile('.env.local');
} catch (error) {
  // No local file is the ordinary case — CI supplies the variables directly, and a machine with
  // neither skips loudly. Anything else (an unreadable or malformed file) is a real problem and
  // must not be swallowed: a silently ignored env file is how a proof stops running unnoticed.
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

/* The api tests sign companies up through the api and remove none, so they run only against a
   database that is theirs: `heliogrid_test` locally (infra/postgres/init/03-test-database.sql),
   `heliogrid_ci` in CI. Off CI they are collected only when BOTH database URLs name the test
   database; whenever they are collected and either URL names `heliogrid_dev`, the run refuses
   here, before collection — a loud stop, never a test run against the owner's development data.
   Off CI with any other pair of names they are skipped, and the warning below says so. */
const TEST_DATABASE = 'heliogrid_test';
const DEVELOPMENT_DATABASE = 'heliogrid_dev';
/* A missing or malformed URL reads as "no name": the api tests are then skipped with the warning,
   and the api's own env loader reports the bad value with its variable name. */
const databaseNameOf = (url: string | undefined) => {
  if (!url) return undefined;
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return undefined;
  }
};
const databaseNames = [process.env.DATABASE_URL, process.env.DATABASE_ADMIN_URL].map(
  databaseNameOf,
);
const bothNameTheTestDatabase = databaseNames.every((name) => name === TEST_DATABASE);
const runApiTests = process.env.CI !== undefined || bothNameTheTestDatabase;
if (runApiTests && databaseNames.includes(DEVELOPMENT_DATABASE)) {
  throw new Error(
    `apps/api/tests refuse ${DEVELOPMENT_DATABASE}: point DATABASE_URL and DATABASE_ADMIN_URL at ` +
      `${TEST_DATABASE} in .env.local (vitest.config.mts)`,
  );
}
if (!runApiTests) {
  process.emitWarning(
    `apps/api/tests are skipped: both DATABASE_URL and DATABASE_ADMIN_URL must name ${TEST_DATABASE} (vitest.config.mts)`,
  );
}

export default defineConfig({
  /*
   * The transform is given its compiler options INLINE rather than reading the package's
   * `tsconfig.json`. Those extend `@heliogrid/config`, whose own `extends` is relative — and
   * TypeScript resolves it through pnpm's symlink while Vite's transform does not, so it looks
   * for `packages/<pkg>/node_modules/tsconfig.base.json` and fails. Nothing here TYPE-checks
   * (`pnpm turbo typecheck` owns that, over the real tsconfigs); this only strips types.
   */
  oxc: { tsconfigRaw: { compilerOptions: { target: 'es2022', verbatimModuleSyntax: true } } },
  test: {
    /* The corpus is `@heliogrid/config`'s, so the runner cannot disagree with the guards: a
       test in a package outside it used to RUN and pass while three checks said it may not
       exist. Collecting from the same list is what makes the refusal true. */
    include: UNIT_TEST_PACKAGES.map((pkg) => `${pkg}/tests/**/*.test.ts`),
    exclude: runApiTests
      ? configDefaults.exclude
      : [...configDefaults.exclude, 'apps/api/tests/**'],
    /* Two workers: each api test file opens its own pools (`packages/db/src/client.ts`, `max: 10`)
       and the local Temporal holds about half of Postgres's 100 slots, so one worker per core ran
       out of connections at random. Two is the value that passed. */
    maxWorkers: 2,
    /*
     * A test imports `../../src/…`, never `@heliogrid/<pkg>`. The package entry resolves to
     * BUILT `dist/`, so a test written that way passes against the last build and says nothing
     * about the source you just edited — a false green that reads exactly like a real one.
     */
    coverage: {
      provider: 'v8',
      /* A SUMMARY by default, because `test:unit` runs on every `check:all` and a 200-row
         table teaches people to scroll past it. `pnpm test:coverage` adds the full table and
         the browsable report — that is the one you read when hunting a missed edge case. */
      reporter: ['text-summary'],
      /* `all` counts an untested file as 0% rather than omitting it — a file with no test is
         the gap you are looking for, and a report that hides it is worse than no report. */
      all: true,
      /* The same one list. `packages/i18n` contributes `runtime.ts` alone: the provider, the
         loaders and the polyfills are proven by running (testing.md), and a bar over them would
         buy an import-only test. */
      include: COVERED_SOURCES,
      exclude: ['**/index.ts', '**/*.d.ts', 'packages/contracts/src/scripts/**'],
      /*
       * A bar only where a wrong number costs money or leaks data (`.claude/rules/testing.md`).
       * Everywhere else coverage is REPORTED, never failing: `all: true` still scores every source
       * file, so a gap is visible without a red run behind it.
       */
      thresholds: {
        'packages/domain/src/authz/**': COMPLETE,
        'packages/domain/src/commerce/tranche-allocation.ts': COMPLETE,
        'packages/domain/src/money/**': COMPLETE,
        'packages/domain/src/pricing/**': COMPLETE,
        'packages/domain/src/subsidy/**': COMPLETE,
        'packages/domain/src/tax/**': COMPLETE,
      },
    },
  },
});
