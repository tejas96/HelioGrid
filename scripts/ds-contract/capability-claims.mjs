/**
 * CHECK (d), SECOND RESOLVER — CAPABILITY-SHAPED FALSE EXCUSES: a comment that excuses a shortfall
 * by naming something the PRIMITIVE supposedly cannot do, about a capability the primitive now has.
 *
 * WHY IT IS NOT JUST ANOTHER PHRASE IN THE LIST. Every phrasing in excuse-vocabulary.mjs's first
 * two groups names a THING — a component, a folder, a provider — and excuse-index.mjs answers by
 * asking whether that thing exists. Round seven's primitive change falsified a whole family of
 * comments in one stroke, and not one of them named a thing:
 *
 *     "the primitive carries no checked state"
 *     "the primitive fixes accessibilityRole"
 *     "the primitive has no role prop"
 *
 * Those name a CAPABILITY. `Pressable` resolves — it always did — and the folder-import exemption
 * then threw every one of them away, because a folder that writes `<Pressable>` binds the name.
 * Both halves of (d)'s machinery were working exactly as designed and the sentence sat there being
 * false. So this resolver asks a different question of a different source: not "does the NAME
 * exist?" against the package index, but "does the CAPABILITY exist?" against
 * `packages/ui/src/primitives/Pressable/Pressable.types.ts`.
 *
 * WHY THAT FILE AND NOT A LIST HERE. A hardcoded copy of the primitive's capabilities is the third
 * copy §6 exists to abolish — it would go stale the next time the primitive grows a prop, and this
 * check would then be excusing the excuses. The inventory is READ from the typings: the props of
 * `PressableProps`, the members of `PressableAccessibilityState`, and the literals of the
 * `PressableRole` union. Delete a prop from that file and the matching claim becomes TRUE again on
 * the next run, with no edit here.
 *
 * WHAT IT DOES.
 *   1. match a capability phrasing (CAPABILITY_EXCUSES) in any comment under packages/ui/src;
 *   2. require `Pressable` or `primitive` within WINDOW characters — the claim has to be ABOUT the
 *      primitive for the primitive's typings to be able to answer it;
 *   3. take the capability words near the phrase (`checked`, `selected`, `role`, `label`, a role
 *      literal such as `switch`, …) and look each one up in the inventory.
 *
 * A capability that EXISTS makes the sentence false — a (d) violation, same heading as the rest of
 * the check. A capability that does not exist is a REAL GAP and lands in (d·i), informational, for
 * the same reason the name resolver does it: `link` is deliberately absent from `PressableRole`,
 * and a comment saying so is the only record of that decision.
 *
 * WHAT IT CANNOT SEE. It reads comments, against a closed phrase list, and the list is once again a
 * record of the wordings ONE round happened to use — "the primitive is not built for that" is
 * invisible. The `Pressable`/`primitive` proximity requirement means the same false claim written
 * about the primitive without naming it is missed; that is deliberate under-reporting, because
 * without it "hard-codes" matches every sentence in the package about a CSS value. It reads only
 * the Pressable primitive: an equally false claim about `Field`, `Text` or `Surface` is unseen. And
 * it proves the CAPABILITY exists, never that this component should be using it — a finding is a
 * claim to check, exactly as the rest of (d) is.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPABILITY_EXCUSES, hitsIn, matchesOf, quoteAt, WINDOW } from './excuse-vocabulary.mjs';
import { comments, lineOf, rel, strip, UI_SRC } from './lib.mjs';

const PRESSABLE_TYPES = join(UI_SRC, 'primitives/Pressable/Pressable.types.ts');
/** The claim has to be ABOUT the primitive whose typings answer it; without this, "hard-codes"
 *  matches half the package. `Pressable` by name, not the bare word "primitive". */
const ABOUT_PRIMITIVE = /\bPressable\b/;
/** …and it must not be about a DIFFERENT primitive. `packages/ui/src/primitives/` holds eight, and
 *  "the Text primitive carries no a11y role" is a true sentence about a file this check does not
 *  read. Only the words immediately before the phrase are consulted, because that is where the
 *  subject of "<X> primitive carries no …" sits. */
const OTHER_PRIMITIVE = /\b(Text|Field|Icon|Box|Surface|Portal|StatusMark)\s+primitive\s*$/;
const SUBJECT = 40;
/** How far past the phrase its OBJECT can sit. "carries no ___" names the capability immediately
 *  after itself, so this is deliberately short: at ±WINDOW, one sentence about `expanded` picked up
 *  every other accessibility word in the paragraph and reported five capabilities for one claim. */
const REACH = 72;

/** Capability words a sentence can use, and the inventory entry each one is asserting is absent.
 *  `kind` picks which of the three inventories answers; `key` is what to look for in it. */
const CAPABILITIES = [
  { word: /\bchecked\b/i, kind: 'state', key: 'checked', says: '`accessibilityState.checked`' },
  { word: /\bselected\b/i, kind: 'state', key: 'selected', says: '`accessibilityState.selected`' },
  { word: /\bexpanded\b/i, kind: 'state', key: 'expanded', says: '`accessibilityState.expanded`' },
  { word: /\bbusy\b/i, kind: 'state', key: 'busy', says: '`accessibilityState.busy`' },
  { word: /\bdisabled\b/i, kind: 'state', key: 'disabled', says: '`accessibilityState.disabled`' },
  {
    word: /\baccessibilityRole\b|\brole\b/i,
    kind: 'prop',
    key: 'accessibilityRole',
    says: '`accessibilityRole`',
  },
  {
    word: /\baccessibilityState\b/i,
    kind: 'prop',
    key: 'accessibilityState',
    says: '`accessibilityState`',
  },
  {
    word: /\baccessibilityLabel\b/i,
    kind: 'prop',
    key: 'accessibilityLabel',
    says: '`accessibilityLabel`',
  },
  { word: /\bswitch\b/i, kind: 'role', key: 'switch', says: 'the `switch` role' },
  { word: /\bcheckbox\b/i, kind: 'role', key: 'checkbox', says: 'the `checkbox` role' },
  { word: /\bradio\b/i, kind: 'role', key: 'radio', says: 'the `radio` role' },
  { word: /\btab\b/i, kind: 'role', key: 'tab', says: 'the `tab` role' },
  { word: /\bmenuitem\b/i, kind: 'role', key: 'menuitem', says: 'the `menuitem` role' },
  {
    word: /\bmenuitemradio\b/i,
    kind: 'role',
    key: 'menuitemradio',
    says: 'the `menuitemradio` role',
  },
  {
    word: /\bmenuitemcheckbox\b/i,
    kind: 'role',
    key: 'menuitemcheckbox',
    says: 'the `menuitemcheckbox` role',
  },
  { word: /\blink\b/i, kind: 'role', key: 'link', says: 'the `link` role' },
];

const MEMBER = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\??\s*:/gm;
const LITERAL = /'([a-zA-Z]+)'/g;

/** The body of `interface <name> { … }` or `type <name> = … ;`, comments stripped. */
function blockOf(source, opener, closer) {
  const at = source.indexOf(opener);
  if (at === -1) return '';
  const from = at + opener.length;
  const to = source.indexOf(closer, from);
  return to === -1 ? source.slice(from) : source.slice(from, to);
}

/** What the primitive can do TODAY, read from its typings — never a copy kept here. Returns null
 *  when the file is missing, and the check then reports nothing rather than guessing. */
export function pressableInventory(path = PRESSABLE_TYPES) {
  if (!existsSync(path)) return null;
  const source = strip(readFileSync(path, 'utf8'));
  const props = new Set(
    matchesOf(blockOf(source, 'interface PressableProps {', '\n}'), MEMBER).map((m) => m[1]),
  );
  const state = new Set(
    matchesOf(blockOf(source, 'interface PressableAccessibilityState {', '\n}'), MEMBER).map(
      (m) => m[1],
    ),
  );
  const role = new Set(
    matchesOf(blockOf(source, 'type PressableRole =', ';'), LITERAL).map((m) => m[1]),
  );
  return { prop: props, state, role, path: rel(path) };
}

/** THE SPECIFIC BEATS THE GENERIC. "the primitive has no `link` role" names a ROLE VALUE, and its
 *  bare word `role` also matches the `accessibilityRole` PROP entry — which would report that the
 *  primitive does carry `accessibilityRole`, an answer to a question nobody asked. When any role
 *  literal is named, the prop entry stands down. */
function claimsNear(window) {
  const hits = CAPABILITIES.filter((capability) => capability.word.test(window));
  if (!hits.some((hit) => hit.kind === 'role')) return hits;
  return hits.filter((hit) => hit.key !== 'accessibilityRole');
}

/** Is this hit a claim about the `Pressable` primitive, and if so which capabilities does it name?
 *  `null` when the sentence is about something else — a different primitive, or nothing nameable. */
function claimOf(block, hit) {
  const context = block.text.slice(
    Math.max(0, hit.index - WINDOW),
    hit.index + hit.length + WINDOW,
  );
  if (!ABOUT_PRIMITIVE.test(context)) return null;
  const subject = block.text.slice(Math.max(0, hit.index - SUBJECT), hit.index);
  if (OTHER_PRIMITIVE.test(subject.replace(/\s+/g, ' '))) return null;
  return claimsNear(block.text.slice(hit.index, hit.index + hit.length + REACH));
}

function recordClaims(claims, seed, hit, inventory, out) {
  for (const claim of claims) {
    const store = inventory[claim.kind].has(claim.key) ? out.violations : out.informational;
    const key = `${seed.at}|${claim.key}`;
    if (!store.has(key)) store.set(key, { ...seed, claim, phrases: new Set() });
    store.get(key).phrases.add(hit.label);
  }
}

function scanFile({ file, source }, inventory, out) {
  for (const block of comments(source)) {
    for (const hit of hitsIn(block, CAPABILITY_EXCUSES)) {
      const claims = claimOf(block, hit);
      if (claims === null) continue;
      const line = lineOf(source, block.start) + lineOf(block.text, hit.index) - 1;
      const seed = { at: `${rel(file)}:${line}`, quote: quoteAt(block.text, hit.index) };
      recordClaims(claims, seed, hit, inventory, out);
    }
  }
}

export function auditCapabilityClaims(files, path = PRESSABLE_TYPES) {
  const inventory = pressableInventory(path);
  if (inventory === null) return { findings: [], informational: [] };
  const out = { violations: new Map(), informational: new Map() };
  for (const entry of files) scanFile(entry, inventory, out);
  return {
    findings: [...out.violations.values()].map(
      (v) =>
        `(d) FALSE EXCUSE  ${v.at}: "${v.quote}" — but the primitive DOES carry ${v.claim.says}, ` +
        `declared in ${inventory.path}. The comment names a CAPABILITY, not a component, which is ` +
        `why the name resolver could not call it; pass the state through the primitive instead of ` +
        `leaving it to the tint. Matched on ${[...v.phrases].join(', ')}.`,
    ),
    informational: [...out.informational.values()].map(
      (v) =>
        `(d·i) REAL GAP    ${v.at}: "${v.quote}" — ${v.claim.says} is genuinely absent from ` +
        `${inventory.path}. Left visible on purpose; matched on ${[...v.phrases].join(', ')}.`,
    ),
  };
}
