#!/usr/bin/env node
/**
 * Env-access gate — every raw environment read lives in an audited place.
 *
 * Biome's `noProcessEnv` already covers this file-by-file, but it is configured by an
 * allowlist in biome.json: widen that list and the rule quietly stops applying, with nothing
 * to notice. This script re-states the same rule at the REPO level from a list that lives
 * here, so loosening the lint config alone is not enough to let a read through.
 *
 * Two details cost real debugging, so they are pinned here rather than rediscovered:
 *
 *   1. MATCH `process.env`, NOT `process.env.`  — the plan's draft used the trailing dot and
 *      would have reported "env access is centralized" while apps/api and apps/worker both
 *      still read the whole object via `envSchema.safeParse(process.env)`. The two most
 *      important readers were invisible to it.
 *   2. SKIP COMMENTS. Five files legitimately DISCUSS `process.env` in their doc comments —
 *      including the ones explaining why they must not read it. Flagging those would train
 *      everyone to ignore the gate.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ROOTS = ['apps', 'packages', 'tests', 'scripts'];
const EXTENSIONS = ['.ts', '.tsx', '.mjs', '.cjs', '.js'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'ios', 'android', 'build']);

/**
 * Where a raw read is permitted, and why. Keep this list SHORT and each entry justified —
 * an unexplained entry is how the previous seven-pattern allowlist stopped meaning anything.
 */
const ALLOWED = [
  {
    path: 'packages/env/src/',
    why: 'the one package that owns environment access (ADR-era Task 34)',
  },
  {
    path: 'apps/web/lib/env.ts',
    why: "Next inlines NEXT_PUBLIC_* only in code IT compiles, so the literal read cannot live inside the pre-built package — see the file's own note",
  },
  {
    path: 'scripts/check-openapi-breaking.mjs',
    why: 'OPENAPI_BASE_REF is a local override for a developer tool that runs before any app is loaded',
  },
];

const isAllowed = (rel) => ALLOWED.some((a) => rel === a.path || rel.startsWith(a.path));

/** Strip line and block comments so a doc comment mentioning process.env is not a read. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) yield full;
  }
}

const offenders = [];
for (const root of ROOTS) {
  for (const file of walk(join(ROOT, root))) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (isAllowed(rel)) continue;
    if (/process\s*\.\s*env/.test(stripComments(readFileSync(file, 'utf8')))) offenders.push(rel);
  }
}

if (offenders.length > 0) {
  console.error(`\nRAW ENVIRONMENT READ outside @heliogrid/env (${offenders.length}):\n`);
  for (const o of offenders) console.error(`  ${o}`);
  console.error(
    '\nImport the typed result instead — `@heliogrid/env/server` on Node, or the app entry\n' +
      '(apps/web/lib/env.ts, apps/mobile/src/env.ts) on a client platform. Declare the variable\n' +
      'in packages/env/src/schema/ and document it in .env.example; nothing else should change.\n' +
      '\nIf a read genuinely belongs somewhere new, add it to ALLOWED in this file WITH A REASON\n' +
      'and to the biome.json noProcessEnv allowlist — deliberately two edits, so it is a\n' +
      'decision rather than a drift.\n',
  );
  process.exit(1);
}

console.log(`env access is centralized — ${ALLOWED.length} audited locations, no others`);
