import { getMigrations } from 'better-auth/db/migration';
import { ENV } from '../config/env';
import { createAuth } from '../modules/auth/auth.public';

/**
 * Better Auth owns its tables via ITS migrator (docs/14 — never authored in
 * packages/db). Run after packages/db migrate: `pnpm --filter @heliogrid/api auth:migrate`.
 */
async function main() {
  // config/env.ts already refused to load without a valid DATABASE_URL.
  const auth = createAuth(ENV.DATABASE_ADMIN_URL ?? ENV.DATABASE_URL);
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  if (toBeCreated.length === 0 && toBeAdded.length === 0) {
    console.log('better-auth schema up to date');
    return;
  }
  await runMigrations();
  const names = (list: { table: string }[]) => list.map((t) => t.table).join(', ') || 'none';
  console.log(
    `better-auth migrated — created: ${names(toBeCreated)}; altered: ${names(toBeAdded)}`,
  );
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
