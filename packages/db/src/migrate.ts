import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

/**
 * Append-only migration runner. Applies packages/db/migrations/*.sql in filename order,
 * records filename + sha256 in schema_migrations, and REFUSES to run if an applied
 * file's hash changed — never edit an applied migration; add a new one (rules/db.md).
 *
 * Runs with DATABASE_ADMIN_URL (owner/DDL role) — the app's runtime role is app_user.
 */
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

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql`create table if not exists schema_migrations (
      filename text primary key,
      sha256 text not null,
      applied_at timestamptz not null default now()
    )`;

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
      console.log(`apply ${file} ...`);
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into schema_migrations (filename, sha256) values (${file}, ${hash})`;
      });
      console.log(`done  ${file}`);
    }
    console.log('migrations up to date');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
