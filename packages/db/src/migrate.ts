import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

/**
 * Append-only migration runner. Applies packages/db/migrations/*.sql in filename order,
 * records filename + sha256 in schema_migrations, and REFUSES to run if an applied
 * file's hash changed — never edit an applied migration; add a new one (packages/db/CLAUDE.md).
 *
 * Runs with DATABASE_ADMIN_URL (owner/DDL role) — the app's runtime role is app_runtime.
 *
 * The hash covers RAW BYTES including line endings; `.gitattributes` pins *.sql to LF so a
 * CRLF checkout cannot invalidate every applied migration.
 */

/**
 * Advisory-lock key. Two deploys (or an api and a worker release_command) can start
 * migrating at the same moment; without this they both enter the apply loop and race.
 * Transactionality alone does not save a `no-transaction` file. Arbitrary but FIXED —
 * changing it silently disables mutual exclusion for anyone running the old value.
 */
const MIGRATION_LOCK_KEY = 8_270_125_001;

/**
 * A file whose FIRST LINE is this directive runs OUTSIDE a transaction, which is the only
 * way to issue CREATE INDEX CONCURRENTLY / REINDEX CONCURRENTLY / ALTER TABLE … DETACH
 * CONCURRENTLY / VACUUM (Postgres forbids them inside a transaction block).
 *
 * The trade is real and the author must accept it: such a file is NOT atomic with its
 * schema_migrations insert, so a crash mid-apply leaves it unrecorded and it WILL re-run.
 * Every statement in a no-transaction file must therefore be individually idempotent
 * (IF NOT EXISTS / IF EXISTS). Default to a normal transactional migration.
 */
const NO_TRANSACTION_DIRECTIVE = '-- heliogrid:no-transaction';

function isNoTransaction(body: string): boolean {
  return body.split('\n', 1)[0]?.trim() === NO_TRANSACTION_DIRECTIVE;
}

async function main() {
  const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_ADMIN_URL (or DATABASE_URL) is required');
    process.exit(1);
  }
  const migrationsDir = join(__dirname, '..', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const sql = postgres(url, {
    max: 1,
    onnotice: () => {},
    connection: {
      /**
       * Fail fast instead of hanging. A DDL statement needing ACCESS EXCLUSIVE queues
       * BEHIND existing readers and every later query queues behind it — so without this a
       * millisecond ALTER sitting behind one long report becomes a full outage on that
       * table. Expect the trade: a migration racing a long query now ABORTS THE RELEASE.
       * Re-run it; do not raise this value to make a deploy pass. Milliseconds.
       */
      lock_timeout: 3000,
    },
  });
  try {
    /**
     * Migrations may legitimately run long (index builds, backfills), so this session opts
     * OUT of any statement_timeout inherited from a role- or database-level default.
     * Issued as a statement rather than a startup parameter on purpose: postgres.js drops
     * falsy values from `connection`, so a `statement_timeout: 0` there would be silently
     * omitted — the opposite of explicit.
     */
    await sql`set statement_timeout = 0`;

    await sql`create table if not exists schema_migrations (
      filename text primary key,
      sha256 text not null,
      applied_at timestamptz not null default now()
    )`;

    // Serialise concurrent migrators. Session-scoped: released in the finally below.
    await sql`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`;

    const applied = new Map<string, string>(
      (await sql`select filename, sha256 from schema_migrations`).map((r) => [
        r.filename as string,
        r.sha256 as string,
      ]),
    );

    for (const file of files) {
      const body = readFileSync(join(migrationsDir, file), 'utf8');
      const hash = createHash('sha256').update(body).digest('hex');
      const prior = applied.get(file);
      if (prior !== undefined) {
        if (prior !== hash) {
          console.error(`REFUSED: ${file} was edited after apply (migrations are append-only)`);
          process.exit(1);
        }
        console.log(`skip ${file} (applied)`);
        continue;
      }

      if (isNoTransaction(body)) {
        // Not atomic by construction — see NO_TRANSACTION_DIRECTIVE.
        console.log(`apply ${file} (no-transaction) ...`);
        await sql.unsafe(body);
        await sql`insert into schema_migrations (filename, sha256) values (${file}, ${hash})`;
      } else {
        console.log(`apply ${file} ...`);
        await sql.begin(async (tx) => {
          await tx.unsafe(body);
          await tx`insert into schema_migrations (filename, sha256) values (${file}, ${hash})`;
        });
      }
      console.log(`done  ${file}`);
    }
    console.log('migrations up to date');
  } finally {
    // Best-effort unlock; ending the session releases it regardless.
    await sql`select pg_advisory_unlock(${MIGRATION_LOCK_KEY})`.catch(() => undefined);
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
