#!/usr/bin/env node
/**
 * `.env.example` names every schema variable (M5).
 *
 * It is the only record of what the app needs to boot. A schema variable it never mentions is one
 * the next person cannot know to set, and the failure surfaces as a boot crash with no clue what is
 * absent. The test is "named in the file", not "assigned in it": a var deliberately left unset is
 * documented by the comment explaining WHY — API_URL is platform-determined and says so, CI is set
 * by the runner. An assignment-only test would falsely fire on exactly the variables whose absence
 * is most considered. WHERE `process.env` may be read is Biome's `noProcessEnv`, whose one
 * allowlist is the override in biome.json.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SCHEMA_DIR = resolve(ROOT, 'packages/env/src/schema');
const schemaVars = new Set();
for (const file of readdirSync(SCHEMA_DIR)) {
  if (!file.endsWith('.ts') || file === 'fragments.ts') continue;
  for (const m of readFileSync(join(SCHEMA_DIR, file), 'utf8').matchAll(
    /^ {2}([A-Z][A-Z0-9_]*):/gm,
  )) {
    schemaVars.add(m[1]);
  }
}
// A scan that read no variable would report "all 0 documented": a pass it never earned.
if (schemaVars.size === 0) {
  console.error(
    `no schema variable read from ${SCHEMA_DIR} — the scan matched nothing, so it proves nothing`,
  );
  process.exit(1);
}

const exampleText = readFileSync(resolve(ROOT, '.env.example'), 'utf8');
const unnamed = [...schemaVars].filter((v) => !new RegExp(`\\b${v}\\b`).test(exampleText)).sort();
if (unnamed.length > 0) {
  console.error(
    `${unnamed.length} env var(s) in the schema but never named in .env.example:\n` +
      unnamed.map((v) => `  - ${v}`).join('\n') +
      '\n\nAdd each with a value, or with a comment saying why it carries none.\n',
  );
  process.exit(1);
}

console.log(`.env.example documents all ${schemaVars.size} schema variables`);
