/**
 * MODULE 1 of 3 — checks (a), (b), (c) — PROP CONTRACTS: does each ported prop still MEAN what
 * the design system says?
 *
 * WHY. Three audit rounds found ~27 behaviour defects in packages/ui while build, typecheck, biome,
 * dependency-cruiser, sherif, adherence, env, boundaries and ds:check were all green. Those gates
 * measure SHAPE — the file exists, it parses, it imports in the allowed direction. None compares the
 * port's prop contract to the design system's, so none can see a prop ported with the wrong TYPE.
 * One class dominated and IS mechanically detectable: the DS types certain props as structural SPEC
 * OBJECTS — `ProvenanceProps | ProvenanceTierSpec`, `NamedGapSpec`, `ValueSourceSpec`,
 * `PendingActionSpec` — each rendered through its own helper (`renderProvenance`, `renderGap`,
 * `renderAttribution`, `renderPending`) or through the component that accepts one (`<Provenance>`,
 * `<ProvenanceTier>`, `<NamedGap>`, `<ValueSource>`, `<PendingAction>`); see SPECS below. Porting
 * agents repeatedly flattened them to a bare `ReactNode` and emitted `{value}` raw. That typechecks,
 * because `ReactNode` is a legal type, and it ships. Then a caller passes the object the design
 * system documents, React is handed a plain object as a child, and it throws.
 *
 * FINDINGS, per component folder in packages/ui/src/components/:
 *   (a) WEAKENED — the DS types a prop as one of the four spec unions; the port types that same
 *       prop with something mentioning none of them (`ReactNode`, `string`, …).
 *   (b) DROPPED  — the DS declares a prop the port declares NOWHERE: not in <Name>.types.ts and not
 *       in the platform-local Web<Name>Props / Native<Name>Props. That split is §2's own rule for
 *       `style` / `className`, so those two names are never a finding.
 *   (c) RAW EMIT — the folder imports a spec type but holds no use site for its renderer. The type
 *       came across, the renderer did not, so the value goes out raw.
 *
 * SOURCES. `contracts/<family>/<Name>.d.ts.txt`, pulled verbatim — it carries prop TYPES, the only
 * way (a) can be asked at all; repoint with --contracts. Unioned with the `Declared props:` allowlists
 * in `adherence.oxlintrc.json`: names only, so they feed (b) alone, but they do name sub-element
 * contracts like AccordionItem that the typings express as nested interfaces.
 *
 * WHAT IT CANNOT SEE — read this before trusting it; overstated coverage is how ~27 defects shipped
 * behind nine green gates. It reads DECLARATIONS, not renders, so one `renderProvenance(` call
 * passes (c) even if a second spec prop is emitted raw two lines down: (c) is a smoke alarm, not a
 * proof. It matches TEXT, not types — with no TypeScript program, "is this prop a spec union?" is
 * answered by whether the type text mentions a spec name, resolved through local aliases and
 * `extends` clauses to a fixpoint, so a prop reaching a spec through a mapped or conditional type,
 * or through an import renamed on the way in, reads as weakened and is a FALSE POSITIVE — widen the
 * resolution, never silence the check. Props the DS inherits ACROSS contract files (`extends
 * Omit<OperationProgressProps, …>`) are invisible and method shorthand (`onX(): void`) is not read
 * at all, so (b) under-reports; every ambiguity here resolves toward under-reporting on purpose,
 * because this gate must never invent work. Namespaces are FLATTENED — one per contract file, one
 * per component folder plus the non-component modules it imports (`utils/format` →
 * `utils/market-pack`, where several components legitimately declare their contract) — while
 * sibling COMPONENT folders are deliberately NOT followed, since pulling Provenance's props into
 * Accordion's would mask real findings. It says nothing about behaviour, defaults, focus order,
 * a11y, tokens, copy or state, roughly two thirds of what the audits found: this closes ONE class,
 * it does not replace reading the file. And it does not check the contracts are CURRENT — ds:pull
 * refreshes them and ds:check diffs the census, so a component with no contract file is skipped.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { ADHERENCE, byName, mentions, strip, UI, walkFiles } from './lib.mjs';

/**
 * The contract files are DATA this gate reads as TEXT — never compiled, never imported, never
 * type-checked. They are named `<Name>.d.ts.txt`, not `<Name>.d.ts`, because the content is the
 * design system's verbatim typings and every one of them opens `import React from "react"`:
 * under a `.d.ts` name turbo boundaries parsed all 95 as live TypeScript inside packages/theme
 * and reported 94 react-is-not-a-dependency violations, since that package declares no react by
 * design (`theme-standalone`, .dependency-cruiser.cjs). The `.txt` suffix is what makes every
 * toolchain — turbo boundaries, tsc's `src/**` glob, biome, knip, jscpd — stop claiming them,
 * with the bytes untouched. Keep `.d.ts` in the middle so the name still says what they are.
 */
const CONTRACT_EXT = '.d.ts.txt';
/** The four spec unions, each with its helper first and then every component that accepts one. */
const SPECS = new Map([
  ['ProvenanceProps', ['renderProvenance', 'Provenance', 'ProvenanceTier']],
  ['ProvenanceTierSpec', ['renderProvenance', 'Provenance', 'ProvenanceTier']],
  ['NamedGapSpec', ['renderGap', 'NamedGap']],
  ['ValueSourceSpec', ['renderAttribution', 'ValueSource']],
  ['PendingActionSpec', ['renderPending', 'PendingAction']],
]);
/** §2's platform split: the web half owns `className`, the native half owns `style`. Not drift. */
const PLATFORM_LOCAL = new Set(['style', 'className']);
const MEMBER = /^\s*(?:readonly\s+)?['"]?([A-Za-z0-9_$]+)['"]?\s*\??\s*:\s*([\s\S]+)$/;
const DECL = /\b(?:export\s+)?(?:declare\s+)?(interface|type)\s+([A-Za-z0-9_$]+)/g;
const RELATIVE = /from\s*['"](\.[^'"]*)['"]/g;
const IMPORTED = /import[^;]*?\{([^}]*)\}[^;]*?from\s*['"][^'"]+['"]/g;

const nestDelta = (ch) => ('{(['.includes(ch) ? 1 : 0) - ('})]'.includes(ch) ? 1 : 0);

/** Top-level pieces from `open`: on a `{`, that block's members split at `;` and ending at the
 *  matching `}`; anywhere else, the one type text up to the first `;`. A top-level `,` is never a
 *  separator — it belongs to a generic argument list. */
function scanFrom(src, open) {
  const block = src[open] === '{';
  const stop = block ? 1 : 0;
  const parts = [];
  let depth = 0;
  let start = block ? open + 1 : open;
  let i = open;
  for (; i < src.length; i += 1) {
    const delta = nestDelta(src[i]);
    depth += delta;
    if (block && delta < 0 && depth === 0) break;
    if (delta !== 0 || src[i] !== ';' || depth !== stop) continue;
    if (!block) break;
    parts.push(src.slice(start, i));
    start = i + 1;
  }
  parts.push(src.slice(start, i));
  return parts;
}

function addMembers(props, members) {
  for (const member of members) {
    const typed = MEMBER.exec(member);
    if (!typed) continue;
    if (!props.has(typed[1])) props.set(typed[1], []);
    props.get(typed[1]).push(typed[2].trim().replace(/\s+/g, ' '));
  }
}

/** Prop names with their type text(s), plus every named type and the text defining it — an interface's
 *  `extends` clause or an alias's RHS, enough to trace a spec through any number of renaming hops. */
function parseDeclarations(source) {
  const src = strip(source);
  const props = new Map();
  const defs = new Map();
  for (const match of src.matchAll(DECL)) {
    const [, kind, name] = match;
    const after = match.index + match[0].length;
    let brace = -1;
    if (kind === 'interface') {
      brace = src.indexOf('{', after);
      defs.set(name, src.slice(after, brace === -1 ? after : brace));
    } else {
      const eq = src.indexOf('=', after);
      if (eq === -1 || /[;{]/.test(src.slice(after, eq))) continue;
      const rhs = scanFrom(src, eq + 1)[0];
      defs.set(name, rhs);
      brace = rhs.includes('{') ? eq + 1 + rhs.indexOf('{') : -1;
    }
    if (brace !== -1) addMembers(props, scanFrom(src, brace));
  }
  return { props, defs, src };
}

/** The spec names PLUS every local type reaching one, to a fixpoint — `CompareProvenanceSpec` counts. */
function specBearing(defs) {
  const bearing = new Set(SPECS.keys());
  for (let size = -1; size !== bearing.size; ) {
    size = bearing.size;
    for (const [name, text] of defs) if (mentions(text, bearing)) bearing.add(name);
  }
  return bearing;
}

/** One contract per component: `<family>/<Name>.d.ts.txt`, flattened to a single namespace.
 *  The `.txt` suffix is the whole point — see CONTRACT_EXT below. */
export function readContracts(dir) {
  const contracts = new Map();
  if (!existsSync(dir)) return contracts;
  for (const file of walkFiles(dir, (name) => name.endsWith(CONTRACT_EXT))) {
    contracts.set(basename(file, CONTRACT_EXT), parseDeclarations(readFileSync(file, 'utf8')));
  }
  return contracts;
}

/** The component folder as one blob — types file and both platform files — widened with every
 *  NON-component module reachable by relative import, transitively; the walk stops dead at
 *  `components/`. Only `src`, which check (c) reads, stays folder-local. */
function readPort(name) {
  const dir = join(UI, name);
  if (!existsSync(dir)) return null;
  const queue = walkFiles(dir, (file) => /\.tsx?$/.test(file));
  const own = parseDeclarations(queue.map((file) => readFileSync(file, 'utf8')).join('\n'));
  const seen = new Set(queue);
  const shared = [];
  for (let i = 0; i < queue.length; i += 1) {
    for (const match of readFileSync(queue[i], 'utf8').matchAll(RELATIVE)) {
      const base = resolve(dirname(queue[i]), match[1]);
      const tries = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')];
      const target = tries.find((path) => existsSync(path));
      if (!target || seen.has(target) || target.startsWith(`${UI}/`)) continue;
      seen.add(target);
      shared.push(target);
      queue.push(target);
    }
  }
  const outer = parseDeclarations(shared.map((file) => readFileSync(file, 'utf8')).join('\n'));
  for (const [prop, types] of outer.props) if (!own.props.has(prop)) own.props.set(prop, types);
  for (const [type, text] of outer.defs) if (!own.defs.has(type)) own.defs.set(type, text);
  return own;
}

/** Which component's contract declares each named type — `AccordionItem` → `Accordion`. */
function typeOwners(contracts) {
  const owner = new Map();
  for (const [component, contract] of contracts) {
    if (!owner.has(component)) owner.set(component, component);
    for (const type of contract.defs.keys()) if (!owner.has(type)) owner.set(type, component);
  }
  return owner;
}

/** `Declared props:` allowlists, attributed to the component that owns the element's interface.
 *  Names only, so this feeds check (b) alone. */
function adherenceProps(contracts) {
  const byComponent = new Map();
  if (!existsSync(ADHERENCE)) return byComponent;
  const owner = typeOwners(contracts);
  const config = JSON.parse(readFileSync(ADHERENCE, 'utf8'));
  for (const entry of config.rules?.['no-restricted-syntax'] ?? []) {
    const declared = /Declared props:\s*([^.]*)\./.exec(entry?.message ?? '');
    const element = /name\.name='([A-Za-z0-9_$]+)'/.exec(entry?.selector ?? '')?.[1];
    const owns = owner.get(element) ?? owner.get(`${element}Props`);
    if (!declared || !owns) continue;
    if (!byComponent.has(owns)) byComponent.set(owns, new Set());
    for (const prop of declared[1].split(',')) byComponent.get(owns).add(prop.trim());
  }
  return byComponent;
}

/** Spec types the folder imports with no USE SITE — `renderProvenance(` or `<ProvenanceTier`. */
function unrenderedSpecs(src) {
  const missing = [];
  for (const part of [...src.matchAll(IMPORTED)].flatMap((m) => m[1].split(','))) {
    const spec = /^\s*(?:type\s+)?([A-Za-z0-9_$]+)/.exec(part)?.[1] ?? '';
    const [helper, ...tags] = SPECS.get(spec) ?? [];
    if (!helper || missing.some((entry) => entry.spec === spec)) continue;
    const uses = [`\\b${helper}\\s*\\(`, ...tags.map((tag) => `<\\s*${tag}\\b`)].join('|');
    if (!new RegExp(uses).test(src)) missing.push({ spec, helper, tags });
  }
  return missing;
}

function auditComponent(name, contract, extraProps) {
  const port = readPort(name);
  if (!port) return [];
  const dsSpecs = specBearing(contract.defs);
  const portSpecs = specBearing(port.defs);
  const out = [];
  for (const [prop, types] of contract.props) {
    const dsType = types.find((type) => mentions(type, dsSpecs));
    const ported = port.props.get(prop);
    if (!dsType || !ported || ported.some((type) => mentions(type, portSpecs))) continue;
    out.push(
      `(a) WEAKENED  ${name}.${prop}: DS \`${dsType}\` → port \`${ported.join(' | ')}\`. A caller ` +
        'passing the documented spec object hands React a raw object as a child.',
    );
  }
  for (const prop of new Set([...contract.props.keys(), ...(extraProps ?? [])])) {
    if (PLATFORM_LOCAL.has(prop) || port.props.has(prop)) continue;
    out.push(
      `(b) DROPPED   ${name}.${prop}: declared by the design system, declared nowhere in the port ` +
        `— not in ${name}.types.ts, not in Web${name}Props / Native${name}Props.`,
    );
  }
  for (const { spec, helper, tags } of unrenderedSpecs(port.src)) {
    out.push(
      `(c) RAW EMIT  ${name}: imports \`${spec}\`, but the folder has no \`${helper}(\` call and ` +
        `no <${tags.join('> / <')}> — the spec type came across, its renderer did not.`,
    );
  }
  return out;
}

/** Every (a)/(b)/(c) finding, plus the counts the report header prints. */
export function auditContracts(contractsDir) {
  const contracts = readContracts(contractsDir);
  const extras = adherenceProps(contracts);
  const findings = [];
  let audited = 0;
  for (const name of [...contracts.keys()].sort(byName)) {
    if (!existsSync(join(UI, name))) continue;
    audited += 1;
    findings.push(...auditComponent(name, contracts.get(name), extras.get(name)));
  }
  return {
    findings: findings.sort(byName),
    contracts: contracts.size,
    allowlists: extras.size,
    audited,
  };
}
