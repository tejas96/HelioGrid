import { defineConfig } from 'vitest/config';

/**
 * Unit tests — owner ruling 2026-09-03, which commissioned the testing programme the
 * 2026-07-29 directive deferred. `tests/invariants/` did not go away: the two prove different
 * things and neither replaces the other.
 *
 *   * an INVARIANT proves a property of the SYSTEM — tenancy holds, the contract and the
 *     database agree, one format implementation exists. It runs against real state.
 *   * a UNIT TEST proves one DECISION at its edges — the rung boundary, the empty input, the
 *     negative, the value one below the threshold. It runs against a pure function.
 *
 * Tests live at `<package>/tests/**`, never inside `src/`: a test under `src/` is compiled
 * into the package's own `dist/` by `tsc -b` and ships. `scripts/check-adherence.sh` check 1
 * and `.claude/hooks/block-test-files.sh` hold that, plus the `*.test.ts` name and the package
 * list — all three in both places, because a hook and its backstop that disagree are worse
 * than either alone.
 */
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
    include: ['{packages,apps}/*/tests/**/*.test.ts'],
    /*
     * A test imports `../../src/…`, never `@heliogrid/<pkg>`. The package entry resolves to
     * BUILT `dist/`, so a test written that way passes against the last build and says nothing
     * about the source you just edited — a false green that reads exactly like a real one.
     * This bit the format slice on 2026-09-03 while proving an invariant went red.
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
      include: [
        'packages/domain/src/**/*.ts',
        'packages/contracts/src/**/*.ts',
        'packages/forms/src/**/*.ts',
        'apps/api/src/**/*.ts',
        'apps/worker/src/**/*.ts',
      ],
      exclude: ['**/index.ts', '**/*.d.ts', 'packages/contracts/src/scripts/**'],
      /*
       * Thresholds are per-slice and land WITH the slice (Law 9), not as one global number
       * nobody owns. A global floor over untested packages would either be 0 — meaning
       * nothing — or red on day one and switched off by the second person who hit it.
       */
      thresholds: {
        'packages/domain/src/format/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
