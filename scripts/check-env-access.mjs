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
 *      important readers were invisible to it. For the same reason the pattern also covers
 *      `process['env']`, `const { env } = process` and `import … from 'node:process'`: each
 *      is a raw read that BOTH this script and Biome's noProcessEnv used to miss, which
 *      defeats the whole point of having two layers.
 *   2. SKIP COMMENTS. Five files legitimately DISCUSS `process.env` in their doc comments —
 *      including the ones explaining why they must not read it. Flagging those would train
 *      everyone to ignore the gate.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ROOTS = ['apps', 'packages', 'tests', 'scripts'];
// Keep in step with check-adherence.sh — `.mts`/`.cts`/`.jsx` were missing here while that
// script's own header documented having learned exactly this lesson for test files.
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
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

// Match on a SEPARATOR boundary. A bare startsWith made any sibling whose name merely
// EXTENDS an allowed path auto-exempt — `apps/web/lib/env.ts` allowed
// `apps/web/lib/env.ts.bak`, and a directory entry allowed a file glued to its name.
const isAllowed = (rel) =>
  ALLOWED.some((a) => rel === a.path || (a.path.endsWith('/') && rel.startsWith(a.path)));

/**
 * Every shape of raw environment read, in one place:
 *   process.env / process . env      the ordinary form
 *   process['env'] / process["env"]  index access, which no dot-based pattern sees
 *   const { env } = process          destructure — invisible to Biome's noProcessEnv too
 *   from 'node:process'              the module import that makes `env` available bare
 */
const RAW_ENV_READ = new RegExp(
  [
    String.raw`process\s*(\.\s*env\b|\[\s*['"\`]env['"\`]\s*\])`, // process.env / process['env']
    String.raw`\{[^}]*\benv\b[^}]*\}\s*=\s*process\b`, //            const { env } = process
    String.raw`from\s*['"]node:process['"]`, //                      import … from 'node:process'
    String.raw`require\s*\(\s*['"]node:process['"]\s*\)`, //         CommonJS require
    String.raw`require\s*\(\s*['"]process['"]\s*\)`, //              …unprefixed
    String.raw`=\s*process\s*[;,)\]}]`, //                           const p = process  (aliasing)
  ].join('|'),
);

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

// An allowlist entry pointing at something that no longer exists hides the fact that nobody
// has revisited these exemptions — the same rot guard GLOBAL_TABLES carries in the tenancy
// scan, which this file's own comment claims to be following.
const stale = ALLOWED.filter((a) => !existsSync(resolve(ROOT, a.path)));
if (stale.length > 0) {
  console.error(`\nSTALE ALLOWLIST ENTRIES (${stale.length}):\n`);
  for (const a of stale) console.error(`  ${a.path} — ${a.why}`);
  console.error(
    '\nRemove the entry, or fix the path. An exemption for a file that does not\n' +
      'exist is an exemption nobody has checked.\n',
  );
  process.exit(1);
}

const offenders = [];
for (const root of ROOTS) {
  for (const file of walk(join(ROOT, root))) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (isAllowed(rel)) continue;
    if (RAW_ENV_READ.test(stripComments(readFileSync(file, 'utf8')))) offenders.push(rel);
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
