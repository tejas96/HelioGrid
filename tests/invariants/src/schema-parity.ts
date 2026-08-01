import { schema as dbSchema } from '@heliogrid/db';
import { getTableColumns, getTableName, is, Table } from 'drizzle-orm';

/**
 * Drizzle model ↔ migrated database parity.
 *
 * Migrations are hand-written SQL (packages/db/migrations/*.sql). `packages/db/src/schema/` is
 * a SECOND, hand-maintained description of the same tables — the one the application actually
 * queries through. Nothing compared them: a column added in SQL and not in the model, or the
 * reverse, typechecks, lints, passes boundaries and passes every other invariant. drizzle-kit
 * is installed with a config file and no script, so it was never going to catch it either.
 *
 * The failure this prevents is quiet and expensive: a column the model does not know about is
 * invisible to every query builder call, and a column the model invents produces a runtime
 * `column does not exist` on a path nobody exercised before deploy.
 *
 * SCOPE, honestly: names and nullability, not types. Comparing Postgres types to Drizzle's
 * type constructors means maintaining a mapping table that would itself drift — and a
 * NAME-level mismatch is the shape this defect actually takes. Partitioned parents are
 * included; their children are not (they inherit their columns).
 */

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`schema-parity: ${msg}`);
}

type ColumnRow = { table_name: string; column_name: string; is_nullable: string };

/** One table's worth of the comparison — split out so the caller stays a flat loop. */
function compareTableColumns(
  table: string,
  exported: unknown,
  liveCols: Map<string, boolean>,
  problems: string[],
): void {
  for (const [, col] of Object.entries(getTableColumns(exported as Table))) {
    const liveNullable = liveCols.get(col.name);
    if (liveNullable === undefined) {
      problems.push(`${table}.${col.name} is in the Drizzle model but not in the database`);
      continue;
    }
    // Drizzle's `notNull` is the model's claim; attnotnull is the database's.
    if (col.notNull === liveNullable) {
      problems.push(
        `${table}.${col.name} nullability disagrees — model says ${
          col.notNull ? 'NOT NULL' : 'nullable'
        }, database says ${liveNullable ? 'nullable' : 'NOT NULL'}`,
      );
    }
  }
  // The other direction: a column the migration added and the model never learned about.
  const modelCols = new Set(
    Object.values(getTableColumns(exported as Table)).map((c) => (c as { name: string }).name),
  );
  for (const name of liveCols.keys()) {
    if (!modelCols.has(name)) {
      problems.push(`${table}.${name} is in the database but not in the Drizzle model`);
    }
  }
}

export async function runSchemaParity(adminUrl: string) {
  const sql = (await import('postgres')).default(adminUrl, { max: 1, onnotice: () => {} });
  try {
    const live = await sql<ColumnRow[]>`
      select c.relname as table_name, a.attname as column_name,
             case when a.attnotnull then 'NO' else 'YES' end as is_nullable
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and not exists (select 1 from pg_inherits i where i.inhrelid = c.oid)`;

    const liveByTable = new Map<string, Map<string, boolean>>();
    for (const r of live) {
      const cols = liveByTable.get(r.table_name) ?? new Map<string, boolean>();
      cols.set(r.column_name, r.is_nullable === 'YES');
      liveByTable.set(r.table_name, cols);
    }

    const problems: string[] = [];
    for (const exported of Object.values(dbSchema)) {
      if (!is(exported, Table)) continue;
      const table = getTableName(exported);
      const liveCols = liveByTable.get(table);
      if (!liveCols) {
        problems.push(`table "${table}" is in the Drizzle model but not in the database`);
        continue;
      }
      compareTableColumns(table, exported, liveCols, problems);
    }

    assert(
      problems.length === 0,
      `${problems.length} disagreement(s) between packages/db/src/schema and the migrated database:\n` +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\n\n  The migration is the source of truth for the database; the Drizzle model is what\n' +
        '  the application queries through. Both are hand-written, so they only agree if\n' +
        '  someone makes them — change them in the SAME slice (/migration).',
    );

    const modelled = Object.values(dbSchema).filter((t) => is(t, Table)).length;
    console.log(
      `schema parity OK — ${modelled} Drizzle tables match the migrated database ` +
        '(names + nullability; types are out of scope)',
    );
  } finally {
    await sql.end();
  }
}
