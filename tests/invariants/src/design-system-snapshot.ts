import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The design-system snapshot is ONE pull: every token its `tokens/*.css` declare equals the census
 * (`manifest.json`) pulled with it, name and value, both ways. The files are copied verbatim from
 * the live design system (`docs/engineering/17-ui-architecture-v2.md` §6), and a copy that dropped,
 * added or changed one value is red here by name — the census is the design system's own reading
 * of the same files.
 *
 * A name a file declares in more than one scope (field mode's `on` and `off`) holds one census
 * entry, and the census does not say which scope it read, so it matches any of them.
 */
const GENERATED = 'packages/theme/src/_generated';
const COMMENT = /\/\*[\s\S]*?\*\//g;
const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;

interface CensusToken {
  readonly name: string;
  readonly value: string;
  readonly definedIn: string;
}

export function runDesignSystemSnapshot(root: string): void {
  const generated = join(root, GENERATED);
  const census = JSON.parse(readFileSync(join(generated, 'manifest.json'), 'utf8')) as {
    tokens: CensusToken[];
  };
  const files = readdirSync(join(generated, 'tokens')).filter((file) => file.endsWith('.css'));
  if (census.tokens.length === 0 || files.length === 0) {
    throw new Error(
      'design-system-snapshot: no census tokens or no token files — a vacuous pass is worse than none',
    );
  }
  const pulled = new Set(files.map((file) => `tokens/${file}`));
  const missingFiles = [...new Set(census.tokens.map((token) => token.definedIn))]
    .filter((definedIn) => !pulled.has(definedIn))
    .map((definedIn) => `${definedIn} is in the census, not in the pull`);
  const problems = files.flatMap((file) => {
    const definedIn = `tokens/${file}`;
    const css = readFileSync(join(generated, 'tokens', file), 'utf8');
    return problemsIn(
      definedIn,
      declarationsOf(css),
      census.tokens.filter((token) => token.definedIn === definedIn),
    );
  });
  problems.push(...missingFiles);
  if (problems.length > 0) {
    throw new Error(
      `design-system-snapshot: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}\n\n  Pull the files and the census together from the live design system; never edit one by hand.`,
    );
  }
  console.log(`design-system snapshot — ${census.tokens.length} tokens equal the census`);
}

/** Every value each name takes in a file, in order — a name in two scopes has two. */
function declarationsOf(css: string): Map<string, string[]> {
  const declared = new Map<string, string[]>();
  for (const [, name, value] of css.replace(COMMENT, '').matchAll(DECLARATION)) {
    if (name !== undefined && value !== undefined) {
      declared.set(name, [...(declared.get(name) ?? []), value.trim()]);
    }
  }
  return declared;
}

/** The file and the census disagree: a name on one side only, or a value no declaration has. */
function problemsIn(
  definedIn: string,
  declared: Map<string, string[]>,
  listed: readonly CensusToken[],
): string[] {
  const inCensus = listed.flatMap((token) => {
    const values = declared.get(token.name);
    if (values === undefined)
      return [`${definedIn}: ${token.name} is in the census, not in the file`];
    if (values.includes(token.value.trim())) return [];
    return [
      `${definedIn}: ${token.name} reads ${values.join(' / ')}, the census says ${token.value}`,
    ];
  });
  const names = new Set(listed.map((token) => token.name));
  const inFile = [...declared.keys()]
    .filter((name) => !names.has(name))
    .map((name) => `${definedIn}: ${name} is in the file, not in the census`);
  return [...inCensus, ...inFile];
}
