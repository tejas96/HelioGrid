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
    console.warn('SKIP invariants: DATABASE_URL/DATABASE_ADMIN_URL not set (CI always sets one)');
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
