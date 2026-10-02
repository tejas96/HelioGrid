import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `.env.example` names every schema variable.
 *
 * It is the only record of what the app needs to boot. A schema variable it never mentions is one
 * the next person cannot know to set, and the failure surfaces as a boot crash with no clue what is
 * absent. The test is "named in the file", not "assigned in it": a variable deliberately left unset
 * is documented by the comment explaining WHY — API_URL is platform-determined and says so, CI is
 * set by the runner. An assignment-only test would fire on exactly the variables whose absence is
 * most considered. WHERE `process.env` may be read is Biome's `noProcessEnv`.
 */
const SCHEMA_DIR = 'packages/env/src/schema';
const EXAMPLE = '.env.example';
/** Shared pieces the schemas compose, not a schema of their own. */
const NOT_A_SCHEMA = 'fragments.ts';
const SCHEMA_VARIABLE = /^ {2}([A-Z][A-Z0-9_]*):/gm;

function schemaVariables(repo: string): string[] {
  const dir = join(repo, SCHEMA_DIR);
  if (!existsSync(dir)) return [];
  const names = readdirSync(dir)
    .filter((file) => file.endsWith('.ts') && file !== NOT_A_SCHEMA)
    .flatMap((file) =>
      [...readFileSync(join(dir, file), 'utf8').matchAll(SCHEMA_VARIABLE)].map((m) => m[1] ?? ''),
    );
  return [...new Set(names)].sort();
}

function scanEnvExample(repo: string): { findings: string[]; variables: number } {
  const variables = schemaVariables(repo);
  if (variables.length === 0) {
    throw new Error(
      `env-example-complete: read NO schema variable from ${SCHEMA_DIR} — the scan matched ` +
        'nothing, so it proves nothing',
    );
  }
  const examplePath = join(repo, EXAMPLE);
  if (!existsSync(examplePath)) {
    return {
      findings: [`${EXAMPLE}: missing — no file names what the app needs to boot`],
      variables: variables.length,
    };
  }
  const example = readFileSync(examplePath, 'utf8');
  const findings = variables
    .filter((name) => !new RegExp(`\\b${name}\\b`).test(example))
    .map((name) => `${EXAMPLE}: never names ${name}, which the schema in ${SCHEMA_DIR} reads`);
  return { findings, variables: variables.length };
}

export function findUndocumentedEnv(repo: string): string[] {
  return scanEnvExample(repo).findings;
}

export function runEnvExampleComplete(repo: string): void {
  const { findings, variables } = scanEnvExample(repo);
  if (findings.length > 0) {
    throw new Error(
      `env-example-complete: a schema variable is never named in ${EXAMPLE}:\n  ` +
        findings.join('\n  ') +
        '\n  Add each with a value, or with a comment saying why it carries none.',
    );
  }
  console.log(`env-example-complete OK — ${EXAMPLE} names all ${variables} schema variables`);
}
