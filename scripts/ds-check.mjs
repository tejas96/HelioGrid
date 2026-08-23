#!/usr/bin/env node
/**
 * ds:check — the drift gate (docs/17-ui-architecture-v2.md §6).
 *
 * Compares the design system's component census against what packages/ui actually ships, and
 * fails CI on the two lists that mean something is WRONG rather than merely unfinished.
 *
 * SOURCE OF TRUTH A — the census — is the UNION of two things, not either one alone:
 *
 *   1. `packages/theme/src/_generated/manifest.json` → `components[].name`, and
 *   2. the component files of the staged pull, `<pull>/components/<category>/<Name>.jsx`.
 *
 * The union is deliberate. The manifest is a generated INDEX of the pull, so it can lag the
 * files it indexes: a component added to the design system between two index builds exists as
 * a .jsx file with no manifest entry, and reading the manifest alone would call it "not in the
 * design system" and mark the repo's port STALE — the loudest possible failure for the safest
 * possible change. The files can also lag the manifest in the other direction (a name listed,
 * its file not yet pulled). Neither is authoritative on its own; a name in EITHER is a name the
 * design system claims. Taking the union can only ever under-report drift, never invent it.
 *
 * The manifest also carries names the .jsx listing cannot: one file exports several components
 * (PreviewFrame.jsx ships PreviewFrame and PreviewFrameGroup), and those extra names are real
 * census entries, which is the other half of why both inputs are read.
 *
 * SOURCE OF TRUTH B — the repo — is likewise two things: the folders under
 * `packages/ui/src/components/`, and the names `packages/ui/src/index.ts` actually exports.
 * Folders alone would miss the multi-component files above (PreviewFrameGroup has no folder of
 * its own), so the export list is resolved THROUGH the `export *` barrels to a flat set of
 * names. A census name counts as built if it is either a folder or an exported name.
 *
 * The three lists, per §6:
 *   1. in the design system, not in the repo — informational, expected while phase 4 runs
 *   2. in the repo, not in the design system — STALE, fails
 *   3. present in both, but the port is structurally incomplete — DRIFT, fails
 *
 * List 3 checks the shape every ported component must have: <Name>.types.ts, <Name>.tsx,
 * index.ts, and <Name>.native.tsx. The native half is waived only by one of the ENUMERATED
 * markers in NATIVE_WAIVERS below, and the marker is read from the component's own types-file
 * header rather than from a list of component names kept here — a hardcoded name list is exactly
 * the kind of third copy §6 exists to abolish.
 *
 * WHY A MARKER AND NOT A SENTENCE. The waiver is a closed vocabulary on purpose. Matching free
 * text — "desktop only", "no phone form", "N/A on mobile" — would turn the gate into a grep for
 * excuses: every component that had not been ported yet could talk its way out, and the gate
 * would report zero drift on a repo that was half-finished. A marker has to be TYPED, it names
 * which of a small set of reasons applies, and `git grep 'POINTER SURFACE'` enumerates every
 * component currently claiming it. Adding a third kind means editing the array below and saying
 * why in the review — that friction is the feature.
 *
 * Usage:  node scripts/ds-check.mjs [--pull <dir>]
 *   --pull  the staged `ds:pull` output holding components/<category>/*.jsx. Defaults to
 *           packages/theme/src/_generated, which is where a committed pull lands; point it at
 *           the staging directory while a pull is still being reviewed.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MANIFEST = join(ROOT, 'packages/theme/src/_generated/manifest.json');
const UI_COMPONENTS = join(ROOT, 'packages/ui/src/components');
const UI_INDEX = join(ROOT, 'packages/ui/src/index.ts');
const DEFAULT_PULL = join(ROOT, 'packages/theme/src/_generated');

/**
 * The COMPLETE set of markers that waive `<Name>.native.tsx`. A component declares exactly one
 * of these in its own `<Name>.types.ts` header; nothing else in the file, and no prose anywhere
 * else in the repo, exempts it. Each entry records what the marker asserts, because the two
 * waivers are different claims and must not be used interchangeably:
 *
 *   PRINT SURFACE    — the component renders paper. `@page`, 96dpi sheet geometry and print
 *                      scoping have no React Native equivalent, and a phone never produces the
 *                      artefact. Declared by DrawingSheet and PagedDocument.
 *
 *   POINTER SURFACE  — the design system gives the component no phone form AND the phone shell
 *                      has no slot to host one, so a native half would be an invention this repo
 *                      made up rather than a port. This is a stronger claim than "we have not
 *                      built it yet" — that case belongs in list 1, not in a waiver. Use it only
 *                      when the design system says so in its own words and the mobile shell
 *                      corroborates it. Declared by Breadcrumb, whose DS source reads "desktop
 *                      only. On a phone the back affordance is the sheet or the top bar, never a
 *                      trail" and whose trail has a slot in AppShell's AppHeader and none in
 *                      MobileTopBar.
 */
const NATIVE_WAIVERS = ['PRINT SURFACE', 'POINTER SURFACE'];
/** How far into the types file the waiver has to appear — it is a header, not a footnote. */
const HEADER_CHARS = 1500;

function parsePullDir(argv) {
  const flag = argv.indexOf('--pull');
  if (flag !== -1 && argv[flag + 1]) return resolve(argv[flag + 1]);
  const inline = argv.find((a) => a.startsWith('--pull='));
  if (inline) return resolve(inline.slice('--pull='.length));
  return DEFAULT_PULL;
}

function directoriesIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());
}

/** Census part 1 — every name the generated manifest indexes. */
function manifestNames() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  return (manifest.components ?? []).map((entry) => entry.name).filter(Boolean);
}

/** Census part 2 — every component file in the staged pull, whether indexed or not. */
function pulledNames(pullDir) {
  const componentsDir = join(pullDir, 'components');
  const names = [];
  for (const category of directoriesIn(componentsDir)) {
    for (const file of readdirSync(join(componentsDir, category))) {
      if (file.endsWith('.jsx')) names.push(basename(file, '.jsx'));
    }
  }
  return names;
}

/** Comments quote export statements they are explaining; strip them before matching. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function resolveModule(spec, fromDir) {
  const base = resolve(fromDir, spec);
  const candidates = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/** `{ a, b as c }` → ['a', 'c']; the local alias is the name the consumer sees. */
function namesInBraces(clause) {
  return clause
    .split(',')
    .map((part) => part.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map((part) => {
      const [, alias] = part.split(/\s+as\s+/);
      return (alias ?? part).trim();
    });
}

function collectNamedExports(source, into) {
  const named = /export\s+(?:type\s+)?\{([^}]*)\}/g;
  for (const match of source.matchAll(named)) {
    for (const name of namesInBraces(match[1])) into.add(name);
  }
  const declared =
    /export\s+(?:declare\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/g;
  for (const match of source.matchAll(declared)) into.add(match[1]);
}

/**
 * Every name reachable from a module, following relative `export *` re-exports. `visited`
 * makes the cyclic barrel graph terminate.
 */
function exportedNames(file, visited = new Set()) {
  const names = new Set();
  if (!file || visited.has(file)) return names;
  visited.add(file);
  const source = stripComments(readFileSync(file, 'utf8'));
  collectNamedExports(source, names);
  const star = /export\s+\*\s+from\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(star)) {
    if (!match[1].startsWith('.')) continue;
    for (const name of exportedNames(resolveModule(match[1], dirname(file)), visited)) {
      names.add(name);
    }
  }
  return names;
}

/**
 * The repo's COMPONENT names, as opposed to its whole export surface. Stale detection has to
 * run at this granularity: the flat export set also holds every prop interface and helper,
 * none of which the design system's manifest enumerates, so diffing it would report hundreds
 * of type names as "removed from the design system" and bury the one real regression.
 */
function repoComponentNames() {
  const names = new Set(directoriesIn(UI_COMPONENTS));
  const source = stripComments(readFileSync(UI_INDEX, 'utf8'));
  const barrel = /from\s*['"]\.\/components\/([A-Za-z0-9_$]+)['"]/g;
  for (const match of source.matchAll(barrel)) names.add(match[1]);
  return names;
}

/**
 * The sanctioned waiver a component declares in its own types-file header, or null. Only the
 * exact strings in NATIVE_WAIVERS count, and only inside the header window — a component cannot
 * argue its way out in prose.
 */
function nativeWaiver(dir, name) {
  const typesFile = join(dir, `${name}.types.ts`);
  if (!existsSync(typesFile)) return null;
  const header = readFileSync(typesFile, 'utf8').slice(0, HEADER_CHARS);
  return NATIVE_WAIVERS.find((marker) => header.includes(marker)) ?? null;
}

function missingFiles(name) {
  const dir = join(UI_COMPONENTS, name);
  const present = new Set(readdirSync(dir));
  const required = [`${name}.types.ts`, `${name}.tsx`, 'index.ts'];
  const missing = required.filter((file) => !present.has(file));
  const native = `${name}.native.tsx`;
  if (!present.has(native) && nativeWaiver(dir, name) === null) missing.push(native);
  return missing;
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function printList(heading, note, lines) {
  console.log(`\n${heading} — ${lines.length}`);
  console.log(`  ${note}`);
  if (lines.length === 0) {
    console.log('  (none)');
    return;
  }
  for (const line of lines) console.log(`  - ${line}`);
}

function main() {
  const pullDir = parsePullDir(process.argv.slice(2));
  const fromManifest = manifestNames();
  const fromPull = pulledNames(pullDir);
  const census = new Set([...fromManifest, ...fromPull]);

  const folders = new Set(directoriesIn(UI_COMPONENTS));
  const repoNames = new Set([...folders, ...exportedNames(UI_INDEX)]);
  const repoComponents = repoComponentNames();

  const notBuilt = sorted([...census].filter((name) => !repoNames.has(name)));
  const stale = sorted([...repoComponents].filter((name) => !census.has(name)));

  const incomplete = [];
  for (const name of sorted(folders)) {
    if (!census.has(name)) continue;
    const missing = missingFiles(name);
    if (missing.length > 0) incomplete.push(`${name}: missing ${missing.join(', ')}`);
  }

  console.log('ds:check — design system census vs packages/ui');
  console.log(`  manifest:     ${MANIFEST.replace(`${ROOT}/`, '')} (${fromManifest.length} names)`);
  console.log(`  staged pull:  ${pullDir} (${fromPull.length} component files)`);
  console.log(`  census:       ${census.size} names (union)`);
  console.log(`  repo:         ${folders.size} component folders, ${repoNames.size} names`);

  printList(
    '1. IN THE DESIGN SYSTEM, NOT IN THE REPO',
    'not yet built — informational while phase 4 runs',
    notBuilt,
  );
  printList(
    '2. IN THE REPO, NOT IN THE DESIGN SYSTEM',
    'STALE — the design system dropped it and the port was left behind',
    stale,
  );
  printList(
    '3. IN BOTH, PORT STRUCTURALLY INCOMPLETE',
    `DRIFT — <Name>.types.ts / <Name>.tsx / index.ts, plus <Name>.native.tsx unless the types header declares one of: ${NATIVE_WAIVERS.join(', ')}`,
    incomplete,
  );

  const failed = stale.length > 0 || incomplete.length > 0;
  console.log(failed ? '\nFAIL — lists 2 and 3 must be empty.\n' : '\nOK — no drift.\n');
  process.exitCode = failed ? 1 : 0;
}

main();
