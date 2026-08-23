import { openingTag } from './jsx.mjs';
import { ARIA_ROLE, IMPLICIT_ROLE, INPUT_ROLE, NATIVE_ROLE } from './parity-roles.mjs';
import { MEMBERS, STATE_MEMBERS } from './parity-vocabulary.mjs';

/**
 * CHECK (h)'s READER — everything one file DECLARES, and everything its markup carries without
 * declaring it.
 *
 * WHY IT IS ITS OWN FILE. Reading a file is a different job from comparing two of them, and it is
 * the job that has to be pessimistic. Every function here answers "what can I actually see in this
 * text?", and every one of them is allowed to answer "I cannot tell" — an opaque `accessibilityState`
 * or a computed role sets a flag rather than guessing, and the comparison next door turns that flag
 * into a named, counted exemption instead of a finding.
 *
 * TWO KINDS OF ANSWER, AND THE DIFFERENCE MATTERS.
 *   · DECLARED — the file wrote the word. These ORIGINATE findings: a declaration on one half is
 *     what the other half has to match.
 *   · IMPLICIT — the file's markup carries the meaning without writing it. `<h2>` announces as a
 *     heading, `<input type="checkbox">` announces checked, a `disabled` prop announces off, the
 *     package's `Pressable` defaults to `button`. These only ever SATISFY; they never originate.
 *     Treating them as declarations reported every heading, list and button in the package as
 *     native-side drift, which is the difference between a gate people read and a gate people mute.
 */
const ROLE_LITERAL =
  /\b(?:accessibilityRole|role)\s*=\s*(?:"([a-zA-Z]+)"|'([a-zA-Z]+)'|\{\s*['"]([a-zA-Z]+)['"]\s*\})/g;
const ROLE_ANY = /\b(?:accessibilityRole|role)\s*=/g;
const STATE_OPEN = /\baccessibilityState\s*=\s*\{/g;
const ELEMENT = /<\s*([a-z][a-z0-9]*)\b/g;
const INPUT_TAG = /<\s*input\b/g;
const TYPE_ATTR = /\btype\s*=\s*["']([a-z]+)["']/;
/** The package's own primitive, whose `accessibilityRole` defaults to `button` — NOT `RNPressable`,
 *  which is React Native's and defaults to nothing. */
const PACKAGE_PRESSABLE = /<\s*Pressable[\s/>]/;
/** A plain `disabled` prop, in any of the shapes a component writes it. */
const DISABLED_PROP = /\bdisabled\s*=|\sdisabled(?=[\s/>])/;
const OPTION_TAG = /<\s*option\b/;
const DETAILS_TAG = /<\s*details\b/;
/** Every accessible-name source a text scan CAN see; see EXEMPTIONS.NAME_FROM_CONTENT. */
// `>{expr}<` and `>word<` are the CONTENT markers: an element whose children are literal text
// or an interpolation is named by that content, which is how the web half normally spells a
// name and what NAME_FROM_CONTENT's own reason describes. Without them this fired on every
// correctly-named web element whose native partner folds the same words into one
// accessibilityLabel — RN has no screen-reader-only text node, so that fold is the correct
// native technique, not drift.
/** A progressbar that reports a position. Both spellings, because a real meter may pass the
 *  value through the primitive rather than as a literal attribute. */
const VALUE_NOW = /\baria-valuenow\s*=|\baccessibilityValue\s*=/;

const NAME_SOURCE =
  /<\s*label\b|\bhtmlFor\s*=|\balt\s*=|\btitle\s*=|\bplaceholder\s*=|<\s*Text[\s/>]|>\s*\{[^}]+\}\s*<|>\s*[A-Za-z][^<>{}]*<[/]/;

/** Index of the `}` closing the brace at `i`, or -1. */
function braceEnd(text, i) {
  let depth = 0;
  for (let j = i; j < text.length; j += 1) {
    if (text[j] === '{') depth += 1;
    else if (text[j] === '}') {
      depth -= 1;
      if (depth === 0) return j;
    }
  }
  return -1;
}

/** `body` with every nested `{}` / `()` / `[]` span removed, so only its OWN keys survive. */
function topLevelOnly(body) {
  let nest = 0;
  let top = '';
  for (const ch of body) {
    if ('{(['.includes(ch)) nest += 1;
    else if ('})]'.includes(ch)) nest -= 1;
    else if (nest === 0) top += ch;
  }
  return top;
}

/** Top-level keys of the object literal that starts at `i` (which sits on its `{`). */
function objectKeys(text, i) {
  const end = braceEnd(text, i);
  return end === -1 ? null : topLevelOnly(text.slice(i + 1, end));
}

/** Which `accessibilityState` members this file writes, and whether any state is unreadable. */
function stateMembers(masked) {
  const found = new Set();
  let opaque = false;
  for (const match of masked.matchAll(STATE_OPEN)) {
    let i = match.index + match[0].length;
    while (/\s/.test(masked[i])) i += 1;
    if (masked[i] !== '{') {
      opaque = true;
      continue;
    }
    const top = objectKeys(masked, i);
    if (top === null) {
      opaque = true;
      continue;
    }
    if (/\.\.\./.test(top)) opaque = true;
    for (const name of STATE_MEMBERS) if (new RegExp(`\\b${name}\\b`).test(top)) found.add(name);
  }
  return { found, opaque };
}

/** Roles this file declares, canonicalised through `map`. `null` entries are the sanctioned
 *  no-partner roles and are collected separately so the exemption can be reported, not hidden. */
function declaredRoles(masked, map) {
  const canonical = new Set();
  const noPartner = new Set();
  const written = new Set();
  for (const match of masked.matchAll(ROLE_LITERAL)) {
    const value = match[1] ?? match[2] ?? match[3];
    written.add(value);
    const canon = value in map ? map[value] : (ARIA_ROLE[value] ?? null);
    if (canon === null) noPartner.add(value);
    else canonical.add(canon);
  }
  const literals = [...masked.matchAll(ROLE_LITERAL)].length;
  const all = [...masked.matchAll(ROLE_ANY)].length;
  return { canonical, noPartner, written, opaque: all > literals };
}

/** Roles the web markup carries in its ELEMENTS rather than in a `role=` attribute. */
function implicitRoles(masked) {
  const roles = new Set();
  for (const match of masked.matchAll(ELEMENT)) {
    const name = match[1];
    if (!(name in IMPLICIT_ROLE)) continue;
    if (IMPLICIT_ROLE[name] !== null) roles.add(IMPLICIT_ROLE[name]);
  }
  for (const match of masked.matchAll(INPUT_TAG)) {
    const tag = openingTag(masked, match.index + match[0].length);
    const type = tag ? TYPE_ATTR.exec(tag.attrs)?.[1] : undefined;
    roles.add(type && type in INPUT_ROLE ? INPUT_ROLE[type] : 'textbox');
  }
  return roles;
}

/** Everything one half declares. `side` decides which role map and whether elements count. */
export function declarations(masked, side) {
  const members = new Set();
  for (const member of MEMBERS) {
    if (!member.spellings) continue;
    if (member.spellings.some((re) => re.test(masked))) members.add(member.name);
  }
  const state = stateMembers(masked);
  for (const name of state.found) members.add(name);
  const roles = declaredRoles(masked, side === 'native' ? NATIVE_ROLE : ARIA_ROLE);
  /** AN IMPLICIT ROLE SATISFIES, IT NEVER ORIGINATES. `<h2>` really does announce as a heading, so
   *  it answers a native `accessibilityRole="header"` — but it is not a DECLARATION the native half
   *  is failing to match, and treating it as one reported every heading, list and button in the
   *  package. Kept out of `canonical` (which drives findings) and into `implicit` (which absorbs
   *  them). */
  const implicit = side === 'web' ? implicitRoles(masked) : new Set();
  /** The package primitive defaults to `button` on BOTH halves — see PRIMITIVE_DEFAULT_ROLE. */
  const primitive = PACKAGE_PRESSABLE.test(masked);
  if (primitive) implicit.add('button');
  return {
    members,
    roles,
    implicit,
    primitive,
    opaqueState: state.opaque,
    /** States a half carries without declaring them — see DISABLED_FROM_PROP / STATE_IN_ELEMENT. */
    implicitState: implicitStates(masked, side),
    namedSomehow: NAME_SOURCE.test(masked),
    /** Whether a declared progressbar reports a POSITION. A web progressbar with no
     *  `aria-valuenow` is indeterminate — legitimate in ARIA, and the one case where demanding
     *  the native partner role would contradict check (g). See INDETERMINATE_PROGRESS. */
    hasValueNow: VALUE_NOW.test(masked),
  };
}

function implicitStates(masked, side) {
  const states = new Set();
  if (DISABLED_PROP.test(masked)) states.add('disabled');
  if (side !== 'web') return states;
  for (const match of masked.matchAll(INPUT_TAG)) {
    const tag = openingTag(masked, match.index + match[0].length);
    const type = tag ? TYPE_ATTR.exec(tag.attrs)?.[1] : undefined;
    if (type === 'checkbox' || type === 'radio') states.add('checked');
  }
  if (OPTION_TAG.test(masked)) states.add('selected');
  if (DETAILS_TAG.test(masked)) states.add('expanded');
  return states;
}

/** Every role this half can be said to carry — what it wrote, plus what its markup implies. */
export const satisfying = (declaration) =>
  new Set([...declaration.roles.canonical, ...declaration.implicit]);

export const emptyDeclaration = () => ({
  members: new Set(),
  roles: { canonical: new Set(), noPartner: new Set(), written: new Set(), opaque: false },
  implicit: new Set(),
  primitive: false,
  opaqueState: false,
  implicitState: new Set(),
  namedSomehow: false,
});

export function mergeDeclarations(list) {
  const out = emptyDeclaration();
  for (const d of list) {
    for (const m of d.members) out.members.add(m);
    for (const r of d.roles.canonical) out.roles.canonical.add(r);
    for (const r of d.roles.noPartner) out.roles.noPartner.add(r);
    for (const r of d.roles.written) out.roles.written.add(r);
    for (const r of d.implicit) out.implicit.add(r);
    for (const s of d.implicitState) out.implicitState.add(s);
    out.roles.opaque ||= d.roles.opaque;
    out.opaqueState ||= d.opaqueState;
    out.primitive ||= d.primitive;
    out.namedSomehow ||= d.namedSomehow;
  }
  return out;
}
