import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Every prop the design system declares for a component is declared by its port.
 *
 * The contracts are the design system's verbatim typings, pulled as `<family>/<Name>.d.ts.txt` —
 * read as TEXT, never compiled — unioned with the `Declared props:` allowlists of the pulled
 * adherence config, which name sub-element contracts like AccordionItem. A prop is DROPPED when the
 * port declares it nowhere: not in `<Name>.types.ts`, not in the platform-local Web/Native props,
 * and not in any NON-component module the folder imports, followed transitively — workspace
 * packages included, because a formatter's options may live in `@heliogrid/domain`. Sibling
 * component folders are never followed: pulling Provenance's props into Accordion's would hide a
 * real drop. `style` and `className` are the platform split's own names and never a finding.
 *
 * It reads declarations as text, so every ambiguity resolves toward UNDER-reporting: a prop the
 * design system inherits across contract files, or writes as method shorthand (`onX(): void`), is
 * not read. A component with no contract file, or no port folder, is not judged.
 */
const CONTRACTS = 'packages/theme/src/_generated/contracts';
const ADHERENCE = 'packages/theme/src/_generated/adherence.oxlintrc.json';
const COMPONENTS = 'packages/ui/src/components';
const CONTRACT_EXT = '.d.ts.txt';
const PLATFORM_LOCAL = new Set(['style', 'className']);
const MEMBER = /^\s*(?:readonly\s+)?['"]?([A-Za-z0-9_$]+)['"]?\s*\??\s*:\s*([\s\S]+)$/;
const DECLARATION = /\b(?:export\s+)?(?:declare\s+)?(interface|type)\s+([A-Za-z0-9_$]+)/g;
const RELATIVE = /from\s*['"](\.[^'"]*)['"]/g;
const WORKSPACE = /from\s*['"]@heliogrid\/([a-z-]+)['"]/g;

interface Declarations {
  readonly props: Set<string>;
  readonly types: Set<string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const nestDelta = (ch: string) => ('{(['.includes(ch) ? 1 : 0) - ('})]'.includes(ch) ? 1 : 0);

function walk(dir: string, test: (name: string) => boolean): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full, test);
    return test(entry) ? [full] : [];
  });
}

/** Top-level pieces from `open`: on a `{`, that block's members split at `;` up to the matching `}`;
 *  anywhere else, the one type text up to the first `;`. A top-level `,` belongs to a generic list. */
function piecesFrom(src: string, open: number): string[] {
  const block = src[open] === '{';
  const stop = block ? 1 : 0;
  const pieces: string[] = [];
  let depth = 0;
  let start = block ? open + 1 : open;
  let i = open;
  for (; i < src.length; i += 1) {
    const delta = nestDelta(src[i] ?? '');
    depth += delta;
    if (block && delta < 0 && depth === 0) break;
    if (delta !== 0 || src[i] !== ';' || depth !== stop) continue;
    if (!block) break;
    pieces.push(src.slice(start, i));
    start = i + 1;
  }
  pieces.push(src.slice(start, i));
  return pieces;
}

/** Where a declaration's member block opens: -1 for one without a block, null for no declaration. */
function blockOpening(src: string, kind: string | undefined, after: number): number | null {
  if (kind === 'interface') return src.indexOf('{', after);
  const equals = src.indexOf('=', after);
  if (equals === -1 || /[;{]/.test(src.slice(after, equals))) return null;
  const rhs = piecesFrom(src, equals + 1)[0] ?? '';
  return rhs.includes('{') ? equals + 1 + rhs.indexOf('{') : -1;
}

/** The prop names every interface and object-literal type declares, and the names of those types. */
function declarations(source: string): Declarations {
  const src = stripComments(source);
  const found: Declarations = { props: new Set(), types: new Set() };
  for (const match of src.matchAll(DECLARATION)) {
    const [whole, kind, name] = match;
    const brace = blockOpening(src, kind, match.index + whole.length);
    if (brace === null) continue;
    found.types.add(name ?? '');
    if (brace === -1) continue;
    for (const member of piecesFrom(src, brace)) {
      const prop = MEMBER.exec(member)?.[1];
      if (prop !== undefined) found.props.add(prop);
    }
  }
  return found;
}

/** Each component's contract, by component name. */
function contractsOf(repo: string): Map<string, Declarations> {
  const dir = join(repo, CONTRACTS);
  if (!existsSync(dir)) return new Map();
  return new Map(
    walk(dir, (name) => name.endsWith(CONTRACT_EXT)).map((file) => [
      (file.split('/').at(-1) ?? '').slice(0, -CONTRACT_EXT.length),
      declarations(readFileSync(file, 'utf8')),
    ]),
  );
}

/** Which component's contract declares each named type — `AccordionItem` belongs to `Accordion`. */
function typeOwners(contracts: Map<string, Declarations>): Map<string, string> {
  const owner = new Map<string, string>();
  for (const [component, contract] of contracts) {
    if (!owner.has(component)) owner.set(component, component);
    for (const type of contract.types) if (!owner.has(type)) owner.set(type, component);
  }
  return owner;
}

const textField = (entry: unknown, key: string): string => {
  const value = isRecord(entry) ? entry[key] : undefined;
  return typeof value === 'string' ? value : '';
};

/** The adherence config's restricted-syntax entries, or none when it is absent. */
function adherenceEntries(repo: string): unknown[] {
  const path = join(repo, ADHERENCE);
  if (!existsSync(path)) return [];
  const config: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const rules =
    isRecord(config) && isRecord(config.rules) ? config.rules['no-restricted-syntax'] : [];
  return Array.isArray(rules) ? rules : [];
}

/** The `Declared props:` allowlists, attributed to the component whose contract names the element. */
function allowlistedProps(
  repo: string,
  contracts: Map<string, Declarations>,
): Map<string, Set<string>> {
  const owner = typeOwners(contracts);
  const byComponent = new Map<string, Set<string>>();
  for (const entry of adherenceEntries(repo)) {
    const declared = /Declared props:\s*([^.]*)\./.exec(textField(entry, 'message'))?.[1];
    const element = /name\.name='([A-Za-z0-9_$]+)'/.exec(textField(entry, 'selector'))?.[1] ?? '';
    const owns = owner.get(element) ?? owner.get(`${element}Props`);
    if (declared === undefined || owns === undefined) continue;
    const props = byComponent.get(owns) ?? new Set<string>();
    for (const prop of declared.split(',')) props.add(prop.trim());
    byComponent.set(owns, props);
  }
  return byComponent;
}

/** The props the port declares: its folder, plus every non-component module it reaches by import.
 *  The folder and the modules it reaches are read as two texts, so a declaration left open at the
 *  end of one never swallows the other. */
function portProps(repo: string, folder: string): Set<string> {
  const components = join(repo, COMPONENTS);
  const own = walk(folder, (name) => /\.tsx?$/.test(name));
  const queue = [...own];
  const seen = new Set(queue);
  for (let i = 0; i < queue.length; i += 1) {
    const file = queue[i] ?? '';
    const source = readFileSync(file, 'utf8');
    const bases = [
      ...[...source.matchAll(RELATIVE)].map((m) => resolve(dirname(file), m[1] ?? '')),
      ...[...source.matchAll(WORKSPACE)].map((m) => join(repo, 'packages', m[1] ?? '', 'src')),
    ];
    for (const base of bases) {
      const tries = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')];
      const target = tries.find((path) => existsSync(path));
      if (target === undefined || seen.has(target) || target.startsWith(`${components}/`)) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  const read = (files: string[]) => files.map((file) => readFileSync(file, 'utf8')).join('\n');
  return new Set([
    ...declarations(read(own)).props,
    ...declarations(read(queue.slice(own.length))).props,
  ]);
}

function scanDesignSystemProps(repo: string): { findings: string[]; audited: number } {
  const contracts = contractsOf(repo);
  const allowlists = allowlistedProps(repo, contracts);
  const findings: string[] = [];
  let audited = 0;
  for (const name of [...contracts.keys()].sort((a, b) => a.localeCompare(b))) {
    const folder = join(repo, COMPONENTS, name);
    if (!existsSync(folder)) continue;
    audited += 1;
    const declared = portProps(repo, folder);
    const wanted = new Set([
      ...(contracts.get(name)?.props ?? []),
      ...(allowlists.get(name) ?? []),
    ]);
    for (const prop of wanted) {
      if (PLATFORM_LOCAL.has(prop) || declared.has(prop)) continue;
      findings.push(
        `${COMPONENTS}/${name}: ${name}.${prop} is declared by the design system and nowhere in ` +
          `the port — not in ${name}.types.ts, not in Web${name}Props / Native${name}Props`,
      );
    }
  }
  if (audited === 0) {
    throw new Error(
      `design-system-props: found ${contracts.size} contracts under ${CONTRACTS} and no ` +
        `component of the same name under ${COMPONENTS} — a scan of nothing reports a pass it ` +
        'never earned',
    );
  }
  return { findings, audited };
}

export function findDroppedDesignSystemProps(repo: string): string[] {
  return scanDesignSystemProps(repo).findings;
}

export function runDesignSystemProps(repo: string): void {
  const { findings, audited } = scanDesignSystemProps(repo);
  if (findings.length > 0) {
    throw new Error(
      'design-system-props: a prop the design system declares was dropped by its port:\n  ' +
        findings.join('\n  '),
    );
  }
  console.log(
    `design-system-props OK — ${audited} components, every design-system prop declared by its port`,
  );
}
