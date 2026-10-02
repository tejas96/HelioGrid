import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDb, type Db, type TenantPool, tenantPool } from '@heliogrid/db';
import { type SQL, sql } from 'drizzle-orm';
import { lineAt, walkFiles } from './repo-files';

/**
 * The tenant pin is TRANSACTION-local.
 *
 * `set_config('app.tenant_id', v, is_local)` — `true` scopes the pin to the transaction; `false`
 * (or no third argument) pins it to the whole CONNECTION, and under a pool the next request on that
 * connection inherits the previous tenant. That is the one way tenancy fails OPEN rather than
 * closed, and RLS cannot see it: the database is configured correctly either way.
 *
 * Two halves. The database half runs the app's own pin — `tenantPool(...).withTenantTransaction` —
 * on a pool of ONE connection, then reads the setting back on that same connection after the
 * commit: it must be gone. The static half holds every call site in apps/ and packages/ to `true`,
 * so a second place that pins a tenant is held too, not only the helper this runs.
 */
const PIN_CALL = /set_config\(\s*'app\.tenant_id'/g;
const SCANNED = ['apps', 'packages'];
const SKIPPED_FOLDERS: ReadonlySet<string> = new Set(['node_modules', 'dist', '.next']);

/** The call's arguments, read from `open` (just past its `(`) to its matching `)`. */
function callArguments(text: string, open: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = open;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(' || ch === '{' || ch === '[') depth += 1;
    else if ((ch === ')' || ch === '}' || ch === ']') && depth > 0) depth -= 1;
    else if (ch === ')' || (ch === ',' && depth === 0)) {
      args.push(text.slice(start, i).trim());
      start = i + 1;
      if (ch === ')') break;
    }
  }
  return args;
}

function scanPinCallSites(repo: string): { findings: string[]; calls: number } {
  const files = SCANNED.flatMap((folder) => walkFiles(repo, folder, SKIPPED_FOLDERS)).filter(
    (file) => /\.(ts|tsx|mts|cts)$/.test(file),
  );
  const findings: string[] = [];
  let calls = 0;
  for (const file of files) {
    const text = readFileSync(join(repo, file), 'utf8');
    for (const call of text.matchAll(PIN_CALL)) {
      calls += 1;
      const args = callArguments(text, call.index + 'set_config('.length);
      if (args.length !== 3 || args[2] !== 'true') {
        findings.push(
          `${file}:${lineAt(text, call.index)}: set_config('app.tenant_id', …) is not pinned with ` +
            '`true` as its third argument',
        );
      }
    }
  }
  if (calls === 0) {
    throw new Error(
      `tenant-pin: found NO set_config('app.tenant_id', …) call under ${SCANNED.join(' or ')} — ` +
        'the pin moved or changed shape, and a scan of nothing reports a pass it never earned',
    );
  }
  return { findings, calls };
}

export function findConnectionWidePins(repo: string): string[] {
  return scanPinCallSites(repo).findings;
}

export function runTenantPinCallSites(repo: string): void {
  const { findings, calls } = scanPinCallSites(repo);
  if (findings.length > 0) {
    throw new Error(
      'tenant-pin: a tenant pin is not transaction-local:\n  ' +
        findings.join('\n  ') +
        '\n  `false` or a missing third argument pins app.tenant_id to the CONNECTION, so the ' +
        'next request served by that pooled connection inherits this tenant.',
    );
  }
  console.log(`tenant-pin call sites OK — ${calls} set_config call(s), each pinned with \`true\``);
}

interface PinReading {
  readonly backend: number;
  readonly pin: string | null;
}

/** The connection's backend and its `app.tenant_id`, read through the client given. */
async function readPin(execute: (query: SQL) => Promise<unknown>): Promise<PinReading> {
  const rows = await execute(
    sql`select pg_backend_pid() as backend, current_setting('app.tenant_id', true) as pin`,
  );
  const row: unknown = Array.isArray(rows) ? rows[0] : undefined;
  if (typeof row !== 'object' || row === null || !('backend' in row) || !('pin' in row)) {
    throw new Error('tenant-pin: the setting read returned no row');
  }
  return { backend: Number(row.backend), pin: typeof row.pin === 'string' ? row.pin : null };
}

/**
 * Pins a tenant through `pool` — the app's own `tenantPool` unless a probe passes a fabricated one —
 * commits, then reads the setting on the same connection. Writes no row: the transaction only sets
 * and reads a setting.
 */
export async function findPinThatOutlivesItsTransaction(
  url: string,
  pool: (db: Db) => TenantPool = tenantPool,
): Promise<string[]> {
  const { db, client } = createDb(url, { max: 1 });
  const probeTenant = '00000000-0000-4000-8000-000000000001';
  try {
    const inside = await pool(db).withTenantTransaction(probeTenant, (tx) =>
      readPin((query) => tx.execute(query)),
    );
    const after = await readPin((query) => db.execute(query));
    const findings: string[] = [];
    if (inside.pin !== probeTenant) {
      findings.push(
        `inside the transaction app.tenant_id is '${inside.pin}', not the tenant pinned — the helper pinned nothing`,
      );
    }
    if (after.backend !== inside.backend) {
      findings.push(
        `the read after commit ran on backend ${after.backend}, not ${inside.backend} — it proves nothing`,
      );
    } else if (after.pin !== null && after.pin !== '') {
      findings.push(
        `after the commit, backend ${after.backend} still carries app.tenant_id '${after.pin}' — ` +
          'the next request on this connection inherits the tenant',
      );
    }
    return findings;
  } finally {
    await client.end();
  }
}

export async function runTenantPin(url: string): Promise<void> {
  const findings = await findPinThatOutlivesItsTransaction(url);
  if (findings.length > 0) {
    throw new Error(
      `tenant-pin: the tenant pin outlives its transaction:\n  ${findings.join('\n  ')}`,
    );
  }
  console.log(
    'tenant-pin OK — withTenantTransaction pinned the tenant, and after the commit the same ' +
      'connection carries no app.tenant_id',
  );
}
