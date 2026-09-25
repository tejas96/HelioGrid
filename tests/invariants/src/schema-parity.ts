import { schema as dbSchema } from '@heliogrid/db';
import { getTableColumns, getTableName, is, SQL, Table } from 'drizzle-orm';
import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';

/**
 * Drizzle model ↔ migrated database parity.
 *
 * Migrations are hand-written SQL (packages/db/migrations/*.sql). `packages/db/src/schema/` is
 * a SECOND, hand-maintained description of the same tables — the one the application actually
 * queries through. Nothing else compares them: a column added in SQL and not in the model, or
 * the reverse, typechecks, lints, passes boundaries and passes every other invariant.
 * drizzle-kit only DRAFTS the SQL, so it was never going to catch it either.
 *
 * The failure this prevents is quiet and expensive: a column the model does not know about is
 * invisible to every query builder call, and a column the model invents produces a runtime
 * `column does not exist` on a path nobody exercised before deploy.
 *
 * SCOPE, honestly: tables both ways, then names and nullability, not types. Comparing Postgres
 * types to Drizzle's type constructors means maintaining a mapping table that would itself
 * drift — and a NAME-level mismatch is the shape this defect actually takes. Partitioned
 * parents are included; their children are not (they inherit their columns).
 * Indexes too, both ways by name, then the method, key columns in order with each one's direction
 * and nulls order, uniqueness and whether a predicate exists — not the predicate's text, which
 * Postgres rewrites. An index that backs a primary key or a unique constraint is the constraint's,
 * and is left out; an expression is compared as one; an index a failed build left invalid does not
 * count as built.
 */

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`schema-parity: ${msg}`);
}

type ColumnRow = { table_name: string; column_name: string; is_nullable: string };
type IndexRow = {
  table_name: string;
  index_name: string;
  method: string;
  is_unique: boolean;
  is_partial: boolean;
  keys: string[];
};
type IndexShape = { method: string; unique: boolean; partial: boolean; columns: string };
type ModelKey = { name: string; indexConfig?: { order?: string; nulls?: string } };

const EXPRESSION = '(expression)';

/** One key as both sides print it: `sent_at desc nulls last`. The SQL below builds the same text. */
function keyText(column: string, order: string, nulls: string): string {
  return `${column} ${order} nulls ${nulls}`;
}

function modelIndexes(table: string, exported: Table): Map<string, IndexShape> {
  const shapes = new Map<string, IndexShape>();
  for (const { config } of getTableConfig(exported as PgTable).indexes) {
    assert(config.name, `a model index on ${table} has no name — name it as its migration does`);
    const keys = config.columns.map((c) => {
      if (is(c, SQL)) return keyText(EXPRESSION, 'asc', 'last');
      const { name, indexConfig } = c as ModelKey;
      return keyText(name, indexConfig?.order ?? 'asc', indexConfig?.nulls ?? 'last');
    });
    shapes.set(config.name, {
      method: config.method ?? 'btree',
      unique: config.unique,
      partial: config.where !== undefined,
      columns: keys.join(', '),
    });
  }
  return shapes;
}

/** What differs between one index as modelled and as built. */
function indexShapeDisagreements(where: string, want: IndexShape, got: IndexShape): string[] {
  const found: string[] = [];
  if (want.method !== got.method) {
    found.push(`${where} method disagrees — model ${want.method}, database ${got.method}`);
  }
  if (want.columns !== got.columns) {
    found.push(`${where} columns disagree — model (${want.columns}), database (${got.columns})`);
  }
  if (want.unique !== got.unique) {
    found.push(
      `${where} uniqueness disagrees — model says ${want.unique ? 'unique' : 'not unique'}`,
    );
  }
  if (want.partial !== got.partial) {
    found.push(
      `${where} predicate disagrees — model says ${want.partial ? 'partial' : 'whole table'}`,
    );
  }
  return found;
}

/** One table's indexes, model against database, by name and then by shape. */
function compareTableIndexes(
  table: string,
  model: Map<string, IndexShape>,
  live: Map<string, IndexShape>,
  problems: string[],
): void {
  for (const [name, want] of model) {
    const got = live.get(name);
    if (got) problems.push(...indexShapeDisagreements(`index ${table}.${name}`, want, got));
    else problems.push(`index ${table}.${name} is in the Drizzle model but not in the database`);
  }
  for (const name of live.keys()) {
    if (!model.has(name))
      problems.push(`index ${table}.${name} is in the database but not in the Drizzle model`);
  }
}

/** One table's worth of the comparison — split out so the caller stays a flat loop. */
function compareTableColumns(
  table: string,
  exported: Table,
  liveCols: Map<string, boolean>,
  problems: string[],
): void {
  for (const [, col] of Object.entries(getTableColumns(exported))) {
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
    Object.values(getTableColumns(exported)).map((c) => (c as { name: string }).name),
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

    const liveIndexes = await sql<IndexRow[]>`
      select t.relname as table_name, i.relname as index_name, am.amname as method,
             ix.indisunique as is_unique, ix.indpred is not null as is_partial,
             array(select coalesce(a.attname::text, ${EXPRESSION})
                            || case when k.opt & 1 = 1 then ' desc' else ' asc' end
                            || case when k.opt & 2 = 2 then ' nulls first' else ' nulls last' end
                   from unnest(ix.indkey::int2[], ix.indoption::int2[]) with ordinality k(attnum, opt, ord)
                   left join pg_attribute a on a.attrelid = ix.indrelid and a.attnum = k.attnum
                   where k.ord <= ix.indnkeyatts
                   order by k.ord) as keys
      from pg_index ix
      join pg_class i on i.oid = ix.indexrelid
      join pg_am am on am.oid = i.relam
      join pg_class t on t.oid = ix.indrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and t.relkind in ('r', 'p') and ix.indisvalid
        and not exists (select 1 from pg_inherits h where h.inhrelid = t.oid)
        and not exists (select 1 from pg_constraint k where k.conindid = ix.indexrelid)`;
    const liveIndexesByTable = new Map<string, Map<string, IndexShape>>();
    for (const r of liveIndexes) {
      const shapes = liveIndexesByTable.get(r.table_name) ?? new Map<string, IndexShape>();
      shapes.set(r.index_name, {
        method: r.method,
        unique: r.is_unique,
        partial: r.is_partial,
        columns: r.keys.join(', '),
      });
      liveIndexesByTable.set(r.table_name, shapes);
    }

    const liveByTable = new Map<string, Map<string, boolean>>();
    for (const r of live) {
      const cols = liveByTable.get(r.table_name) ?? new Map<string, boolean>();
      cols.set(r.column_name, r.is_nullable === 'YES');
      liveByTable.set(r.table_name, cols);
    }

    const problems: string[] = [];
    let indexCount = 0;
    const modelled: Table[] = Object.values(dbSchema).filter((exported) => is(exported, Table));
    for (const exported of modelled) {
      const table = getTableName(exported);
      const liveCols = liveByTable.get(table);
      if (!liveCols) {
        problems.push(`table "${table}" is in the Drizzle model but not in the database`);
        continue;
      }
      compareTableColumns(table, exported, liveCols, problems);
      const model = modelIndexes(table, exported);
      indexCount += model.size;
      compareTableIndexes(table, model, liveIndexesByTable.get(table) ?? new Map(), problems);
    }

    // Tables the other way: one the migrations built that nothing models — a per-key pack table
    // beside the one payload column, a table a deleted model left behind — is drift too, and
    // the more likely kind during a rebuild. The migration ledger is bookkeeping, not schema.
    const modelledNames = new Set<string>(modelled.map(getTableName));
    for (const table of liveByTable.keys()) {
      if (table !== 'schema_migrations' && !modelledNames.has(table)) {
        problems.push(`table "${table}" is in the database but not in the Drizzle model`);
      }
    }

    assert(
      problems.length === 0,
      `${problems.length} disagreement(s) between packages/db/src/schema and the migrated database:\n` +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\n\n  The migration is the source of truth for the database; the Drizzle model is what\n' +
        '  the application queries through. Both are hand-written, so they only agree if\n' +
        '  someone makes them — change them in the SAME slice (/migration).',
    );

    if (modelled.length === 0) {
      console.log(
        'schema parity VACUOUS — no Drizzle model and no application table. Proves nothing ' +
          'about column parity; only that the two are consistently empty.',
      );
      return;
    }
    console.log(
      `schema parity OK — ${modelled.length} Drizzle tables and ${indexCount} indexes match the migrated ` +
        'database (tables and indexes both ways; column names + nullability; index method, key ' +
        'columns with direction and nulls order, uniqueness, predicate presence; types, operator ' +
        'classes and predicate text are out of scope)',
    );
  } finally {
    await sql.end();
  }
}
