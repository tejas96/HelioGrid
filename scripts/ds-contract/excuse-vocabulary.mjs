/**
 * CHECK (d)'s VOCABULARY — the closed phrase list, the candidate-name patterns, and the reader that
 * turns one comment into "these phrasings, next to these names".
 *
 * WHY IT IS ITS OWN FILE. The vocabulary is the part of (d) that CHANGES. It has been widened after
 * round six and again after round seven, while the resolution logic beside it has not moved. A list
 * that grows every audit round is its own responsibility, and keeping it here means widening it
 * never touches the code that decides what a hit MEANS.
 *
 * WHY CLOSED. Free-text matching turns a gate into a grep — the native-waiver header
 * makes the same argument about `POINTER SURFACE`. A closed list is a record of shapes that were
 * actually written; it is also, honestly, a record of the wordings the audits happened to use, and
 * a false excuse worded outside it is invisible.
 *
 * WIDENING IS SAFE, AND THIS IS WHY. A phrase alone cannot fail the gate. A phrase whose named
 * thing resolves to nothing lands in the INFORMATIONAL (d·i) bucket; only a phrase sitting beside a
 * name that EXISTS can fail. So the cost of a phrase that turns out to be innocent is a line in an
 * informational list, never a red gate.
 */

/** The phrasings the excuses actually used. Closed vocabulary — see the header.
 *
 *  ROUND SIX widened the first thirteen — harvested from the fourteen original false excuses, which
 *  made the list a record of one round's WORDING rather than of the SHAPE. Round six found a live
 *  one the list could not read (TimeField/time-parse.ts). The second group is that miss
 *  generalised: a thing declared absent, a capability deferred, and a port admitting to a sham.
 *
 *  ROUND SEVEN widened it again, for a different reason, and the reason is the one that matters.
 *  Every phrasing above names a THING — a component, a folder, a provider — so the resolver can
 *  ask "does that thing exist?". Round seven's primitive change (accessibilityRole and
 *  accessibilityState landing on `Pressable`) falsified a whole family of comments in one stroke,
 *  and not one of them named a thing:
 *
 *      "the primitive carries no checked state"
 *      "the primitive fixes accessibilityRole"
 *      "the primitive has no role prop"
 *
 *  Those name a CAPABILITY. `Pressable` resolves — it always did — so the folder-import exemption
 *  threw every one of them away, and the sentence sat there being false. The third group below is
 *  that shape, and it is resolved differently: capability-claims.mjs checks the claim against
 *  `packages/ui/src/primitives/Pressable/Pressable.types.ts` rather than against the name index. */
export const EXCUSES = [
  { label: 'belongs to the', re: /belongs to the/gi },
  { label: 'is not in this folder', re: /is not in this folder/gi },
  { label: 'does not own', re: /does not own/gi },
  { label: 'folder lands', re: /folder lands/gi },
  { label: 'family lands', re: /family lands/gi },
  { label: 'when it lands', re: /when it lands/gi },
  { label: 'does not yet carry', re: /does not yet carry/gi },
  { label: 'not yet available', re: /not yet available/gi },
  { label: 'for now', re: /for now/gi },
  { label: 'TODO', re: /\bTODO\b/g },
  { label: 'stand-in', re: /stand-in/gi },
  { label: 'local mirror', re: /local mirror/gi },
  { label: 'until … lands', re: /until\b[^.\n]{0,80}?\blands\b/gi },
  // Round six.
  { label: 'not in this folder', re: /not in this folder/gi },
  { label: 'cannot yet', re: /cannot yet/gi },
  { label: 'can not yet', re: /can not yet/gi },
  { label: 'no market pack', re: /\bno market pack/gi },
  { label: 'has no market pack', re: /has no market pack/gi },
  { label: 'nothing to read', re: /nothing to read/gi },
  { label: 'no route', re: /\bno route\b/gi },
  { label: 'this platform has no', re: /this platform has no/gi },
  { label: 'deliberately not read', re: /deliberately not read/gi },
  { label: 'pretends', re: /\bpretends?\b/gi },
  { label: 'not wired', re: /not wired/gi },
];

/** ROUND SEVEN — CAPABILITY-SHAPED claims. These name what the primitive CAN or CANNOT do, so a
 *  name-resolver has nothing to check; capability-claims.mjs reads the primitive's typings instead.
 *  Each `capability` is the member of `Pressable.types.ts` the sentence is asserting is absent. */
export const CAPABILITY_EXCUSES = [
  { label: 'primitive carries no', re: /primitive\s+carries\s+no\b/gi },
  { label: 'primitive fixes', re: /primitive\s+fixes\b/gi },
  /** One optional qualifier, because "the RN Pressable primitive has no …" is how it is actually
   *  written — an exact "the primitive has no" matched none of the live sentences. */
  { label: 'the primitive has no', re: /the\s+(?:\w+\s+){0,2}primitive\s+has\s+no\b/gi },
  { label: 'carries no checked', re: /carries\s+no\s+checked\b/gi },
  { label: 'carries no selected', re: /carries\s+no\s+selected\b/gi },
  { label: 'no role prop', re: /\bno\s+role\s+prop\b/gi },
  { label: 'hard-codes', re: /\bhard-?codes\b/gi },
];

/** How far either side of the phrase a name still counts as "named by" the excuse. */
export const WINDOW = 240;
/** Cited, not asserted. Apostrophes make single quotes useless here ("the family's Foo"). */
const CITED = /"[^"\n]{0,240}"|“[^”\n]{0,240}”/g;
/** Strong candidates: worth reporting even when they resolve to nothing (a real gap). */
const BACKTICKED = /`\s*([A-Z][A-Za-z0-9_$]*)/g;
const TAGGED = /<\s*([A-Z][A-Za-z0-9_$]*)/g;
const HUMPED = /\b([A-Z][a-z0-9]+(?:[A-Z][A-Za-z0-9]*)+)\b/g;
/** Weak candidates: a single-hump capital is usually just a sentence start, so these are reported
 *  ONLY when they resolve — "Until"/"The"/"Selection" are not exported by anything. */
const BARE = /\b([A-Z][a-z][A-Za-z0-9]*)\b/g;

/** Names that are never a ported component: React, React Native and TypeScript vocabulary. The
 *  list only suppresses the INFORMATIONAL half — a real gap is never spelled `ReactNode`. */
export const NOT_COMPONENTS = new Set([
  'ReactNode',
  'ReactElement',
  'JSX',
  'React',
  'StyleSheet',
  'ViewStyle',
  'TextStyle',
  'Platform',
  'Animated',
  'Omit',
  'Pick',
  'Partial',
  'Record',
  'Readonly',
  'Array',
  'Promise',
  'Map',
  'Set',
  'Date',
  'Intl',
  'Math',
  'Object',
  'JSON',
  'Number',
  'String',
  'Boolean',
  'View',
  'ScrollView',
  'SafeAreaView',
  'KeyboardAvoidingView',
  'FlatList',
  'SectionList',
  'TextInput',
  'TouchableOpacity',
  'ActivityIndicator',
  'Dimensions',
  'AccessibilityInfo',
]);

export const matchesOf = (text, re) => [...text.matchAll(new RegExp(re.source, re.flags))];

/** Character spans inside the comment that are quoting rather than asserting. */
function citedSpans(text) {
  return matchesOf(text, CITED).map((m) => [m.index, m.index + m[0].length]);
}

/** Capitalised names near the phrase, split by how much weight a bare capital deserves. */
export function candidates(window) {
  const strong = new Set();
  for (const re of [BACKTICKED, TAGGED, HUMPED]) {
    for (const m of matchesOf(window, re)) strong.add(m[1]);
  }
  const weak = new Set();
  for (const m of matchesOf(window, BARE)) if (!strong.has(m[1])) weak.add(m[1]);
  return { strong, weak };
}

/** One line of prose from the comment, so the reader sees the excuse rather than a line number. */
export function quoteAt(text, index) {
  const from = text.lastIndexOf('\n', index) + 1;
  const to = text.indexOf('\n', index) === -1 ? text.length : text.indexOf('\n', index);
  const line = text
    .slice(from, to)
    .replace(/^\s*[*/]*\s*/, '')
    .trim();
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

/** Every phrase from `vocabulary` in one comment, minus the ones sitting inside a "citation". */
export function hitsIn(block, vocabulary) {
  const cited = citedSpans(block.text);
  const hits = [];
  for (const excuse of vocabulary) {
    for (const hit of matchesOf(block.text, excuse.re)) {
      if (cited.some(([from, to]) => hit.index >= from && hit.index < to)) continue;
      hits.push({ index: hit.index, length: hit[0].length, label: excuse.label });
    }
  }
  return hits;
}
