#!/usr/bin/env node
/**
 * Per-PROP coverage of the web↔RN component contract.
 *
 * `packages/ui-api` made parity mechanical per COMPONENT: each platform's `api-parity.ts`
 * asserts `satisfies ComponentApiSurface`, and an `UncoveredComponents` check fails when a
 * component exists on one platform and not the contract. But every one of those assertions
 * iterates `keyof ComponentApiSurface` — so a prop that is in NEITHER the contract nor the two
 * `declare const` blocks is invisible to all three. They are three hand-maintained lists of
 * the same names, and nothing compared them to the components themselves.
 *
 * That is not hypothetical: it hid `AvatarGroup.people`, where RN declared a `readonly` array
 * and web a mutable one, so `people={PEOPLE as const}` compiled on RN and failed on web —
 * exactly the StatusChip class of defect the package was built to stop.
 *
 * WHY A SCRIPT rather than a type-level assertion (the repo prefers lint/types over scripts):
 * web's prop interfaces extend `ButtonHTMLAttributes` and friends, so `keyof WebButtonProps`
 * is ~250 DOM attributes. "Authored here" versus "inherited from the DOM" is not expressible
 * in type space — but it is exactly a declaration's OWN members, which the TypeScript compiler
 * API reads directly. This is the simplest honest mechanism, not a preference for scripts.
 *
 * Scope, stated plainly: this compares NAMES, not types. Type-level drift within a contracted
 * prop is already caught by the two `satisfies` directions in each api-parity.ts.
 */
import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const ROOT = resolve(import.meta.dirname, '..');
process.chdir(ROOT);

/**
 * Props a platform declares that are deliberately NOT in the shared contract, with a reason
 * each — the same discipline GLOBAL_TABLES uses in the tenancy scan. An entry without a reason
 * is indistinguishable from a prop that slipped through.
 */
const NOT_SHARED = {
  'ListRow.onClick':
    'platform-shaped handler: web is MouseEventHandler<HTMLDivElement>, RN is () => void. ' +
    'Neither is assignable to the other, so no single declaration holds both (ui-api §2).',
  'Radio.onChange':
    'platform-shaped handler: web inherits ChangeEventHandler<HTMLInputElement>, RN declares ' +
    '(checked: boolean) => void (ui-api §2, forms.ts).',
  'IconButton.size':
    'web constrains size to the literal union 32 | 40 | 48; RN takes a number, because RN ' +
    'sizes come from theme.spacing rather than a fixed DOM-pixel ladder (ui-api, forms.ts).',

  // ── Reported as "RN only" for a structural reason, not drift ──────────────────────────
  // Web INHERITS these from the DOM interface it extends; RN has no DOM, so its mirror must
  // DECLARE them. This gate keeps only repo-declared properties (that is what makes "authored"
  // separable from web's ~250 inherited attributes), so the web side is filtered out and the
  // pair looks one-sided. Both platforms accept the prop; only the two declarations differ,
  // which is ui-api §2 — a handler no single type can hold.
  ...Object.fromEntries(
    ['Button.onClick', 'Card.onClick', 'Chip.onClick', 'IconButton.onClick'].map((k) => [
      k,
      'web inherits it from ButtonHTMLAttributes/HTMLAttributes (MouseEventHandler), RN ' +
        'declares () => void. Same capability, no assignable common type (ui-api §2).',
    ]),
  ),
  'Input.onChange':
    'web inherits ChangeEventHandler<HTMLInputElement>, RN declares (text: string) => void.',
  'Input.value':
    'web inherits value from InputHTMLAttributes (string | number | readonly string[]); RN ' +
    'declares string. The DOM union is wider than anything RN can accept.',
  'Input.type':
    'web inherits the full HTML input type union; RN maps to keyboardType/secureTextEntry and ' +
    'declares its own narrow set.',
  'TextLink.href':
    'web-only by nature: an anchor target. RN navigates by typed route name ' +
    '(apps/mobile/src/navigation/routes.ts), never a URL.',
  'TextLink.onClick': 'the web half of the href/onPress pair — see TextLink.onPress.',
  'TextLink.onPress':
    'the RN half: RN presses, the DOM clicks. Pairing them into one contract prop would force ' +
    "one platform to carry the other's event shape.",
};

/**
 * Prop names that are platform-OWNED wherever they appear, so listing them per component would
 * be 17 identical entries. `style` is the whole of category 1 in ui-api's header: web takes
 * `CSSProperties`, RN takes `ViewStyle`, and they are not the same prop wearing two hats —
 * no single declaration can hold both, and neither is assignable to the other.
 */
const PLATFORM_OWNED = new Set(['style']);

/**
 * Every `*Props` declaration, mapped to the props it contributes to the SHARED surface.
 *
 * A TypeChecker, not a syntax walk. The syntax version read a declaration's OWN members, which
 * had two holes that both read as "covered": `export type XProps = Omit<Y,'z'>` matched no
 * branch and registered an EMPTY set (turning that component's whole comparison off while the
 * gate printed OK), and props reached through `extends` from a local base were never followed.
 * Resolving the type gets both right — and "authored here" becomes expressible: keep only
 * properties whose DECLARATION lives in this repo, which drops web's ~250 inherited DOM
 * attributes and RN's inherited View props by construction rather than by allowlist.
 *
 * `unanalysable` is returned separately and FAILS the gate: a component the parser cannot read
 * must be loud, never silently empty. That distinction is the whole lesson of this rewrite.
 */
function authoredProps(patterns) {
  // api-parity.ts declares assertion helpers (`MissingContractProps`) that end in `Props` but
  // are not component APIs. They are the gate's own scaffolding, not part of the surface.
  const files = patterns.flatMap((p) => globSync(p)).filter((f) => !f.endsWith('api-parity.ts'));
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.Latest,
    jsx: ts.JsxEmit.ReactJSX,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const byComponent = new Map();
  const unanalysable = [];

  for (const file of files) {
    const sf = program.getSourceFile(file);
    if (!sf) continue;
    ts.forEachChild(sf, (node) => {
      const declName = node.name?.text;
      if (!declName?.endsWith('Props')) return;
      if (!ts.isInterfaceDeclaration(node) && !ts.isTypeAliasDeclaration(node)) return;
      const component = declName.replace(/Props$/, '');
      const symbol = checker.getSymbolAtLocation(node.name);
      const type = symbol && checker.getDeclaredTypeOfSymbol(symbol);
      const props = type ? checker.getPropertiesOfType(type) : undefined;
      if (!props?.length) {
        // Zero resolved properties is either a genuinely empty type or a type the checker
        // could not resolve. Neither should silently mean "nothing to compare".
        unanalysable.push(`${component} (${file})`);
        return;
      }
      const set = byComponent.get(component) ?? new Set();
      for (const p of props) {
        const declFile = p.declarations?.[0]?.getSourceFile().fileName ?? '';
        // Inherited from the platform (DOM lib, react, react-native) — not our surface.
        if (declFile.includes('node_modules') || declFile.includes('/typescript/lib/')) continue;
        set.add(p.getName());
      }
      byComponent.set(component, set);
    });
  }
  return { byComponent, unanalysable };
}

/** Property names the contract declares, per component (`XxxApi` → `Xxx`). */
function contractProps() {
  const byComponent = new Map();
  for (const file of globSync('packages/ui-api/src/*.ts')) {
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    ts.forEachChild(sf, (node) => {
      const declName = node.name?.text;
      if (!declName?.endsWith('Api') || !ts.isInterfaceDeclaration(node)) return;
      const component = declName.replace(/Api$/, '');
      const set = byComponent.get(component) ?? new Set();
      for (const m of node.members) if (m.name?.text) set.add(m.name.text);
      byComponent.set(component, set);
    });
  }
  return byComponent;
}

// `.ts` as well as `.tsx`: a props type may live beside its component in a plain module, and
// globbing only `.tsx` silently skipped it.
const web = authoredProps(['packages/ui/src/**/*.tsx', 'packages/ui/src/**/*.ts']);
const native = authoredProps(['apps/mobile/src/ui/**/*.tsx', 'apps/mobile/src/ui/**/*.ts']);
const contract = contractProps();

// An exemption for a prop that no longer exists on both platforms, or that HAS since been
// added to the contract, is an exemption nobody has revisited — the rot guard this file's own
// comment claims to be borrowing from GLOBAL_TABLES, and did not have.
const staleExemptions = Object.keys(NOT_SHARED).filter((key) => {
  const [component, prop] = key.split('.');
  const w = web.byComponent.get(component);
  const n = native.byComponent.get(component);
  if (!w || !n) return true; //           component gone from a platform
  if (!w.has(prop) && !n.has(prop)) return true; // prop gone from both
  return (contract.get(component) ?? new Set()).has(prop); // now contracted: exemption moot
});
if (staleExemptions.length > 0) {
  console.error(`\nSTALE NOT_SHARED ENTRIES (${staleExemptions.length}):\n`);
  for (const k of staleExemptions.sort()) console.error(`  ${k} — ${NOT_SHARED[k]}`);
  console.error(
    '\nEach names a prop that no longer exists on either platform, whose component is gone,\n' +
      'or that is now IN the contract. Remove the entry — a stale exemption hides the fact\n' +
      'that nobody has rechecked these decisions.\n',
  );
  process.exit(1);
}

const unanalysable = [...web.unanalysable, ...native.unanalysable];
const offenders = [];
const oneSided = [];
for (const [component, webSet] of web.byComponent) {
  const nativeSet = native.byComponent.get(component);
  if (!nativeSet) continue; // component-level coverage is api-parity.ts's job, not this one
  const declared = contract.get(component) ?? new Set();
  const skip = (prop) => PLATFORM_OWNED.has(prop) || `${component}.${prop}` in NOT_SHARED;
  for (const prop of webSet) {
    if (skip(prop) || declared.has(prop)) continue;
    if (nativeSet.has(prop)) offenders.push(`${component}.${prop}`);
    // A prop on ONE platform only is the commonest Law 7 failure, and it passed this gate AND
    // both platforms' typechecks: each platform compiles against its own props, and the two
    // `satisfies` assertions only iterate keys the CONTRACT already names.
    else oneSided.push(`${component}.${prop}  (web only)`);
  }
  for (const prop of nativeSet) {
    if (skip(prop) || declared.has(prop) || webSet.has(prop)) continue;
    oneSided.push(`${component}.${prop}  (RN only)`);
  }
}

if (unanalysable.length > 0) {
  console.error(`\nUNANALYSABLE PROPS TYPES (${unanalysable.length}):\n`);
  for (const u of unanalysable.sort()) console.error(`  ${u}`);
  console.error(
    '\nThe checker resolved no properties for these, so their parity is UNCHECKED. That must\n' +
      'fail rather than pass quietly — an empty prop set is indistinguishable from a covered\n' +
      'component. Give the type a shape the checker can resolve, or exclude it deliberately.\n',
  );
  process.exit(1);
}

if (offenders.length > 0 || oneSided.length > 0) {
  if (offenders.length > 0) {
    console.error(`\nPROPS ON BOTH PLATFORMS BUT NOT IN THE CONTRACT (${offenders.length}):\n`);
    for (const o of offenders.sort()) console.error(`  ${o}`);
    console.error(
      '\nA prop both platforms declare is part of the shared surface — add it to the matching\n' +
        '`*Api` interface in packages/ui-api/src/, so the two `satisfies` directions start\n' +
        'checking its TYPE on both platforms. If it genuinely cannot be shared (a platform-\n' +
        'shaped handler, say), add it to NOT_SHARED in this file WITH A REASON.\n',
    );
  }
  if (oneSided.length > 0) {
    console.error(`\nPROPS ON ONE PLATFORM ONLY (${oneSided.length}) — Law 7 lockstep:\n`);
    for (const o of oneSided.sort()) console.error(`  ${o}`);
    console.error(
      '\nWeb and RN ship the same prop surface in the same slice. Mirror the prop on the other\n' +
        'platform and add it to the contract, or record it in NOT_SHARED WITH A REASON if it is\n' +
        'genuinely platform-owned.\n',
    );
  }
  process.exit(1);
}

const covered = [...contract.values()].reduce((n, s) => n + s.size, 0);
console.log(
  `ui parity OK — ${covered} contract props across ${contract.size} components; ` +
    `no prop authored on both platforms is missing from it`,
);
