import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every branded type is enrolled with the cast check.
 *
 * A brand makes a shared fact unspeakable outside its owner, and TypeScript's one hole is a cast.
 * The cast check closes that hole — but only for brands named in its registry, which is kept by
 * hand: the `brand-cast-<owner>.grit` Biome plugins, one per owning package, each naming its brands
 * twice — once in its `includes` list and once in its regular expression. A cast is refused only
 * when BOTH match, so a brand is enrolled only when it is in both. A brand declared and never
 * listed there is unguarded, and the two are indistinguishable from lint's output: it is green
 * either way. This asserts the registry is COMPLETE, so landing a brand and guarding it become one
 * act rather than two.
 *
 * It reads the declaration shape this repo actually uses — a `unique symbol` minted in the owning
 * file, carried on the type as a readonly index — so a brand written any other way is invisible
 * here and the gap column says so.
 */
const REGISTRY = 'packages/config/biome';
const CAST_PLUGIN = /^brand-cast-[\w-]+\.grit$/;
const SYMBOL = /declare const (\w+)\s*:\s*unique symbol\s*;/g;

interface Brand {
  readonly name: string;
  readonly owner: string;
}

function sourceFiles(repo: string): string[] {
  return execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'packages'],
    {
      cwd: repo,
      encoding: 'utf8',
    },
  )
    .split('\n')
    .filter((f) => f.endsWith('.ts') && !f.includes('/dist/') && !f.includes('/_generated/'))
    .filter((f) => existsSync(join(repo, f)));
}

/** Every branded type declared under `packages/`, with the file that mints it. */
export function declaredBrands(repo: string): Brand[] {
  const brands: Brand[] = [];
  for (const file of sourceFiles(repo)) {
    const text = readFileSync(join(repo, file), 'utf8');
    for (const [, symbol] of text.matchAll(SYMBOL)) {
      const carried = new RegExp(`export type (\\w+)\\s*=[^;]*?\\[\\s*${symbol}\\s*\\]`, 'gs');
      for (const match of text.matchAll(carried)) {
        const name = match[1];
        if (name) brands.push({ name, owner: file });
      }
    }
  }
  return brands.sort((a, b) => a.name.localeCompare(b.name));
}

/** The brands one cast plugin refuses a cast to: those in its `includes` list AND its pattern. */
function enrolledIn(grit: string): string[] {
  const code = grit.replace(/^\s*\/\/.*$/gm, '');
  const listed = [...code.matchAll(/includes\s+"([^"]+)"/g)].map((m) => m[1] ?? '');
  const pattern = /r"\(\?s\)\(\?:([^)]*)\)/.exec(code)?.[1]?.split('|') ?? [];
  return listed.filter((name) => pattern.includes(name));
}

/** The names the cast check will actually refuse a cast to. */
export function registeredBrands(repo: string): string[] {
  const dir = join(repo, REGISTRY);
  const plugins = existsSync(dir) ? readdirSync(dir).filter((file) => CAST_PLUGIN.test(file)) : [];
  if (plugins.length === 0) {
    throw new Error(`brand-registry: no brand-cast-<owner>.grit plugin found in ${REGISTRY}`);
  }
  return plugins.flatMap((file) => enrolledIn(readFileSync(join(dir, file), 'utf8')));
}

export function runBrandRegistry(repo: string): void {
  const declared = declaredBrands(repo);
  if (declared.length === 0) {
    throw new Error(
      'brand-registry: found NO branded type under packages/ — the declaration shape it reads has ' +
        'changed, and an empty scan reports a pass it never earned',
    );
  }
  const registered = registeredBrands(repo);
  const unguarded = declared.filter((b) => !registered.includes(b.name));
  if (unguarded.length > 0) {
    throw new Error(
      'brand-registry: a brand is declared but not enrolled with the cast check, so a cast to it ' +
        'is unguarded and the check still prints a pass:\n  ' +
        unguarded.map((b) => `${b.name} (${b.owner})`).join('\n  ') +
        `\n  Add it to BOTH lists of ${REGISTRY}/brand-cast-<owning package>.grit.`,
    );
  }
  console.log(
    `brand-registry OK — ${declared.length} branded types declared, every one enrolled with the cast check`,
  );
}
