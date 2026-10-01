import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every Biome plugin exists and covers a place that exists.
 *
 * A plugin is a .grit file named in biome.json with the globs it runs on. Biome says nothing when
 * a glob matches no file, so a renamed folder leaves the plugin covering nothing while lint stays
 * green. This holds the fixed folder of every positive glob — the part after a leading any-depth
 * segment and before the first wildcard, so a glob over `apps/web/features/**` fixes
 * `apps/web/features` — to exist in the repo, and every plugin file to exist. A glob that is all
 * wildcards fixes no folder.
 */
const BIOME_CONFIG = 'biome.json';
const WILDCARD = /[*?[{]/;

interface Plugin {
  readonly path: string;
  readonly includes: readonly string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** A plugin entry is a bare path or `{ path, includes }`, at the top level or in an override. */
function pluginsOf(config: unknown): Plugin[] {
  if (!isRecord(config)) return [];
  const overrides = Array.isArray(config.overrides) ? config.overrides : [];
  const lists = [config.plugins, ...overrides.map((o) => (isRecord(o) ? o.plugins : undefined))];
  return lists.flatMap((list) =>
    (Array.isArray(list) ? list : []).flatMap((entry): Plugin[] => {
      if (typeof entry === 'string') return [{ path: entry, includes: [] }];
      if (!isRecord(entry) || typeof entry.path !== 'string') return [];
      return [{ path: entry.path, includes: strings(entry.includes) }];
    }),
  );
}

/** The folder (or file) a glob fixes before its first wildcard, or null when it fixes none. */
function fixedPlace(glob: string): string | null {
  const segments = glob
    .replace(/^\*\*\//, '')
    .replace(/^\.\//, '')
    .split('/');
  const firstWild = segments.findIndex((segment) => WILDCARD.test(segment));
  const fixed = (firstWild === -1 ? segments : segments.slice(0, firstWild)).join('/');
  return fixed === '' ? null : fixed;
}

function scanPluginScopes(repo: string): { findings: string[]; plugins: number; places: number } {
  const configPath = join(repo, BIOME_CONFIG);
  const plugins = existsSync(configPath)
    ? pluginsOf(JSON.parse(readFileSync(configPath, 'utf8')))
    : [];
  if (plugins.length === 0) {
    throw new Error(
      `biome-plugin-scopes: read NO plugin from ${BIOME_CONFIG} — the config moved or its shape ` +
        'changed, and a scan of nothing reports a pass it never earned',
    );
  }
  const findings: string[] = [];
  let places = 0;
  for (const plugin of plugins) {
    if (!existsSync(join(repo, plugin.path))) {
      findings.push(`${BIOME_CONFIG}: plugin ${plugin.path} does not exist`);
    }
    for (const glob of plugin.includes.filter((include) => !include.startsWith('!'))) {
      const place = fixedPlace(glob);
      if (place === null) continue;
      places += 1;
      if (!existsSync(join(repo, place))) {
        findings.push(
          `${BIOME_CONFIG}: plugin ${plugin.path} includes \`${glob}\`, but ${place} does not ` +
            'exist — a renamed folder leaves the plugin covering nothing',
        );
      }
    }
  }
  return { findings, plugins: plugins.length, places };
}

export function findDeadPluginScopes(repo: string): string[] {
  return scanPluginScopes(repo).findings;
}

export function runBiomePluginScopes(repo: string): void {
  const { findings, plugins, places } = scanPluginScopes(repo);
  if (findings.length > 0) {
    throw new Error(
      `biome-plugin-scopes: a lint plugin covers nothing:\n  ${findings.join('\n  ')}`,
    );
  }
  console.log(
    `biome-plugin-scopes OK — ${plugins} plugins, each file present and all ${places} included places exist`,
  );
}
