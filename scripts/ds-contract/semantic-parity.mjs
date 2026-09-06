/**
 * CHECK (h) — WEB/NATIVE SEMANTIC PARITY: the two platform halves of one component declaring
 * different accessibility vocabularies.
 *
 * WHY THIS CHECK EXISTS, AND WHY IT IS THE MOST OVERDUE ONE HERE. Round seven found nine defects
 * and SEVEN of them were one shape: the web half declares a role and an ARIA state, the native half
 * declares neither, so the control announces as a plain button and which-one-is-on is carried by
 * COLOUR ALONE — the F7-12 defect. `Switch`, `FieldModeToggle`, `OptionCardGroup`, `Tabs`,
 * `Checkbox`, `ListRow`, `SegmentedControl`, `CompareGrid`, `Menu`, `LanguageSwitcher`: every one.
 * Seven of nine defects in one round, in one mechanically comparable shape, and not one of the
 * seven checks (a)–(g) looked for it. (g) came the closest and said so in its own header — "the two
 * halves disagreed about what the component IS" — but only for the single tag where a
 * `progressbar` promise happens to be checkable from inside one file.
 *
 * WHAT IT DOES.
 *   1. Pairs the files. Inside every `components/<Name>/` and `primitives/<Name>/` folder, each
 *      `<Base>.tsx` pairs with `<Base>.native.tsx` — split siblings by matching BASENAME, so
 *      `MenuItemRow.tsx` pairs with `MenuItemRow.native.tsx` and not with `Menu.native.tsx`.
 *   2. Reads the accessibility vocabulary each half DECLARES (parity-declarations.mjs, against the
 *      pairs in parity-vocabulary.mjs and the role maps in parity-roles.mjs): role, checked,
 *      selected, expanded, busy, disabled, live, label.
 *   3. Reports a member declared by one half whose partner declares neither the partner spelling
 *      nor a sanctioned platform reason (parity-exemptions.mjs — every one of them named, counted
 *      and PRINTED on each run, so nothing is skipped invisibly). BOTH DIRECTIONS — native-only
 *      semantics are drift too, and round seven's repairs are exactly the moment for the reverse
 *      to start appearing.
 *
 * UNPAIRED SIBLINGS FALL BACK TO THE FOLDER, deliberately. `MenuTrigger.tsx` has no
 * `MenuTrigger.native.tsx` because the native half folds that markup into `Menu.native.tsx`. Rather
 * than report every such file as a total loss — noise, and noise is how a gate gets muted — an
 * unpaired file is compared against the UNION of the folder's other-platform files. That
 * under-reports (a member satisfied by a different file in the folder passes), which is the trade
 * this gate keeps everywhere else.
 *
 * ── WHAT THIS CHECK CANNOT DO, AND IT IS A BIG CAVEAT. ──────────────────────────────────────────
 * THIS IS A LEXICAL CHECK OVER DECLARATIONS. IT IS NOT A PROOF THAT THE RIGHT NODE CARRIES THEM.
 * It reads the words each file contains. It does not know which element a declaration sits on, that
 * the two halves put it on the SAME element, that the value is computed from the same state, or
 * that it is even reachable — a web half with `aria-checked` on a hidden input and a native half
 * with `accessibilityState={{ checked }}` on an unrelated decorative View both "declare checked",
 * and this check calls that pair clean. Every finding is a claim to CHECK by reading both files;
 * every green pair is "both halves say the word", never "both halves are correct". Specifically:
 *   · Presence, not placement. See above. This is the whole shape of the hole.
 *   · Presence, not truth. `accessibilityState={{ checked: false }}` hard-coded satisfies `checked`.
 *   · A declaration reached through a wrapper component of the package's own is not followed, and a
 *     `{...spread}` is not read — the same blind spots (e) and (f) carry.
 *   · A computed role or a variable `accessibilityState` is opaque and suppresses its own
 *     comparison (OPAQUE_ROLE / OPAQUE_STATE) rather than guessing.
 *   · Accessible NAMES are the weakest member here: on the web a name usually comes from element
 *     CONTENT (`<button>Save</button>`) and on native from a `<Text>` child, so a `label` finding
 *     is a prompt to look, not a defect proved. It is reported for the icon-only case, which is
 *     where the name genuinely has nowhere else to come from.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { maskComments } from './jsx.mjs';
import { byName, rel, tally, UI_SRC } from './lib.mjs';
import { declarations, mergeDeclarations } from './parity-declarations.mjs';
import { EXEMPTIONS } from './parity-exemptions.mjs';
import { compareRoles } from './parity-role-compare.mjs';
import { MEMBERS } from './parity-vocabulary.mjs';

/** Printed ONCE beneath the (h) findings. */
export const PARITY_EXPLAINER = [
  'THE (h) SEMANTIC SPLIT',
  '  TRAP. A component is TWO files, and only one of them is read at a time. The web half',
  '  declares `role` and an `aria-*` state; the native half is written later, against a phone',
  '  screen, where the visual state is obvious — so the role and the state are simply not',
  '  written. The control then announces as a plain button and WHICH ONE IS ON is carried by',
  '  colour alone. Nothing warns. Both halves typecheck, lint, render and look right. Round',
  '  seven found nine defects and SEVEN were this exact shape.',
  '',
  '  THE FIX. Semantics go through the primitive, not around it. `Pressable` takes',
  '  `accessibilityRole` and `accessibilityState` on BOTH halves (Pressable.types.ts) and maps',
  '  them to `aria-*` on web and `accessibilityState` on native, so one declaration serves both.',
  '  Reaching past the primitive for the platform pressable is how the 44dp floor and the',
  '  semantics were lost together.',
  '',
  '  AND READ BOTH FILES BEFORE BELIEVING A FINDING. This check compares the WORDS each half',
  '  declares. It cannot see which node carries them, whether the two halves put them on the',
  '  same element, or whether the value is right. A finding is a claim to check; a clean pair is',
  '  not a reviewed component.',
].join('\n');
/** Component-shaped folders under packages/ui/src: `components/<Name>` and `primitives/<Name>`. */
function componentFolders() {
  const out = [];
  for (const layer of ['components', 'primitives']) {
    const dir = join(UI_SRC, layer);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort(byName)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) out.push({ name, dir: full });
    }
  }
  return out;
}

const WAIVERS = ['PRINT SURFACE', 'POINTER SURFACE'];
const HEADER_CHARS = 1500;

/** The closed waiver vocabulary, read from the component's own types-file header — the component's own
 *  types-file header. Read rather than copied, so a third list cannot go stale. */
function waiverOf(dir, name) {
  const types = join(dir, `${name}.types.ts`);
  if (!existsSync(types)) return null;
  const header = readFileSync(types, 'utf8').slice(0, HEADER_CHARS);
  return WAIVERS.find((marker) => header.includes(marker)) ?? null;
}

const MEMBER_BY_NAME = new Map(MEMBERS.map((m) => [m.name, m]));

/** The sanctioned reason `to` may lack `member` without that being drift, or null if there is none.
 *  Every branch here is an entry in parity-exemptions.mjs, tallied and printed on every run. */
function excused(member, to, toSide) {
  if (member.state && to.opaqueState) return 'OPAQUE_STATE';
  if (member.name === 'disabled' && to.implicitState.has('disabled')) return 'DISABLED_FROM_PROP';
  if (member.state && toSide === 'web' && to.implicitState.has(member.name)) {
    return 'STATE_IN_ELEMENT';
  }
  if (member.name === 'label' && to.namedSomehow) return 'NAME_FROM_CONTENT';
  return null;
}

/** One direction of one pair. `from` declared it; does `to` declare the partner? */
function compare(context, out) {
  const { from, to, fromSide, at, partnerLabel, exemptions } = context;
  const toSide = fromSide === 'web' ? 'native' : 'web';
  for (const name of [...from.members].sort(byName)) {
    if (to.members.has(name)) continue;
    const member = MEMBER_BY_NAME.get(name);
    const exemption = excused(member, to, toSide);
    if (exemption !== null) {
      tally(exemptions, exemption, `${at} [${name}]`);
      continue;
    }
    const line =
      `${at}: the ${fromSide} half declares \`${member[fromSide]}\` and the ${toSide} half ` +
      `(${partnerLabel}) declares neither \`${member[toSide]}\` nor a documented platform reason.`;
    if (member.informational) {
      out.informational.push(
        `(h·i) LIVE REGION  ${line} ${EXEMPTIONS.LIVE_REGION.reason} Check by hand whether the ` +
          'native half announces the change at all.',
      );
      tally(exemptions, 'LIVE_REGION', `${at} [${name}]`);
      continue;
    }
    out.findings.push(
      `(h) SEMANTIC DRIFT  ${line} ` +
        (member.name === 'label'
          ? 'An accessible NAME can also come from element content, so read both halves before ' +
            'repairing — the case this catches is the icon-only target, where it cannot. '
          : 'The control announces without it, and on the native side that means its state is ' +
            'carried by COLOUR ALONE (F7-12). ') +
        'Both halves take `accessibilityRole` / `accessibilityState` through the `Pressable` ' +
        'primitive, which maps them to `aria-*` on web and `accessibilityState` on native — one ' +
        'declaration serves both. THIS IS A LEXICAL CHECK: it compares the words each half ' +
        'declares, not which node carries them. See THE (h) SEMANTIC SPLIT below.',
    );
  }
  compareRoles(context, out);
}

function noNativeHalf({ name, dir }, webCount, exemptions, out) {
  const waiver = waiverOf(dir, name);
  if (waiver) {
    tally(exemptions, 'WAIVED_SURFACE', `${name} (${waiver})`);
    return;
  }
  out.informational.push(
    `(h·i) NO NATIVE HALF  ${rel(dir)}/: ${webCount} web file(s) and no ` +
      '`*.native.tsx`, and the types-file header carries neither `PRINT SURFACE` nor ' +
      '`POINTER SURFACE`. There is nothing to compare, and no gate owns the missing native half.',
  );
}

/** Both directions of every file in one folder. Returns how many exact basename pairs it saw. */
function auditFolder({ dir }, files, exemptions, out) {
  const web = files.filter((f) => !f.endsWith('.native.tsx'));
  const native = files.filter((f) => f.endsWith('.native.tsx'));
  const cache = new Map(
    files.map((f) => [
      f,
      declarations(maskComments(readFileSync(join(dir, f), 'utf8')), sideOf(f)),
    ]),
  );
  const folder = {
    web: mergeDeclarations(web.map((f) => cache.get(f))),
    native: mergeDeclarations(native.map((f) => cache.get(f))),
  };
  let pairs = 0;
  for (const file of files) {
    const isNative = file.endsWith('.native.tsx');
    const base = file.replace(/(\.native)?\.tsx$/, '');
    const partner = isNative ? `${base}.tsx` : `${base}.native.tsx`;
    const paired = files.includes(partner);
    if (paired && !isNative) pairs += 1;
    compare(
      {
        from: cache.get(file),
        to: paired ? cache.get(partner) : folder[isNative ? 'web' : 'native'],
        fromSide: isNative ? 'native' : 'web',
        at: rel(join(dir, file)),
        partnerLabel: paired ? partner : `no ${partner} — folder union`,
        exemptions,
      },
      out,
    );
  }
  return pairs;
}

export function auditSemanticParity() {
  const out = { findings: [], informational: [] };
  const exemptions = new Map();
  let pairs = 0;
  for (const folder of componentFolders()) {
    const files = readdirSync(folder.dir)
      .filter((f) => f.endsWith('.tsx'))
      .sort(byName);
    const native = files.filter((f) => f.endsWith('.native.tsx'));
    if (native.length === 0) {
      noNativeHalf(folder, files.length, exemptions, out);
      continue;
    }
    pairs += auditFolder(folder, files, exemptions, out);
  }
  return { ...out, exemptions, pairs };
}

const sideOf = (file) => (file.endsWith('.native.tsx') ? 'native' : 'web');

/** The sanctioned exemptions that were actually applied, each with its reason. Printed by the entry
 *  point so no exemption is ever a silent skip. */
export function exemptionReport(exemptions) {
  const lines = [];
  for (const [key, entry] of [...exemptions.entries()].sort((a, b) => byName(a[0], b[0]))) {
    lines.push(`  · ${key} ×${entry.count} — ${EXEMPTIONS[key].reason}`);
  }
  return lines;
}
