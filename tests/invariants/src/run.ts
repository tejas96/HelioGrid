import { runTenancyInvariants } from './tenancy-rls';

/**
 * Locked invariant runner. Sets: money (lands with the proposal module), tenancy (live),
 * billing (lands with the billing module), migrations (lands with Track A's migration).
 * Requires a migrated database via DATABASE_URL/DATABASE_ADMIN_URL; skips LOUDLY when
 * absent (CI always provides one — see .github/workflows/ci.yml).
 */
async function main() {
  const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  if (!url) {
    // Fail CLOSED in CI: a skipped invariant that reports success is worse than no
    // invariant at all — that is exactly how the tenancy gate went unexecuted for the
    // whole of the foundation phase (docs/foundation-redesign.md F1).
    if (process.env.CI) {
      throw new Error(
        'INVARIANTS NOT RUN: DATABASE_URL/DATABASE_ADMIN_URL missing under CI. ' +
          'Check the `env` list on turbo.json’s test task — Turborepo strict env mode ' +
          'strips undeclared variables.',
      );
    }
    console.warn('SKIP invariants: DATABASE_URL/DATABASE_ADMIN_URL not set (local run only)');
    return;
  }
  await runTenancyInvariants(url);
  console.log('invariants green');
}

main().catch((err) => {
  console.error('INVARIANT FAILURE');
  console.error(err);
  process.exit(1);
});
