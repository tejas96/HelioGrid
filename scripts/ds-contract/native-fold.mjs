/**
 * CHECK (f) — FOLDED CONTROL: `accessible` on a node whose subtree contains a focusable control.
 *
 * (f) IS (e)'s COUNTER-TRAP, WRITTEN AS A GATE. (e) — native-a11y.mjs — reports accessibility state
 * on a View that is not an accessibility element. The natural-looking repair for an (e) finding is
 * "add `accessible` to the wrapper", and that repair is the WORSE defect. Both must ship together.
 *
 * WHY. `accessible` (and `accessible={true}`) declares "this whole subtree is ONE element". Every
 * descendant stops being separately focusable, their labels concatenate into the parent's, and any
 * Pressable / Touchable / Button / TextInput inside — the 44dp retry, the fallback link, the row's
 * tick — goes out of reach of TalkBack and VoiceOver entirely. Nothing warns. The tree still
 * renders. A sighted reviewer sees a correctly-named panel. This is the natural "fix" for an (e)
 * finding, which is exactly why it must be gated rather than described: two live components shipped
 * it AFTER a repair round was explicitly warned about it in native-a11y.mjs's own header —
 * `Image/ImageStates.native.tsx` wrapped a 44dp retry Pressable, `QRCode/QRCode.native.tsx`
 * swallowed its own fallback link. Prose in a header is not a gate.
 *
 * WHAT IT DOES. For every JSX opening tag under packages/ui/src that carries a bare `accessible` or
 * `accessible={true}`, it walks the element's own subtree — from the `>` of the opening tag to its
 * matching close, same-name nesting counted, self-closing tags handled — and reports any focusable
 * control found inside: `Pressable`, `TouchableOpacity`, `TouchableHighlight`,
 * `TouchableWithoutFeedback`, `TouchableNativeFeedback`, `Button`, `TextInput`, `Switch`, or ANY
 * element carrying `onPress` / `onLongPress`. The node's OWN attributes are excluded — a
 * `<Pressable accessible onPress={…}>` with nothing focusable inside is the correct shape, not a
 * finding.
 *
 * WHAT IT CANNOT SEE — and this half was MEASURED, not guessed. Of the two live defects that
 * motivated (f), an injection reproducing Image/ImageStates fires; an injection reproducing
 * QRCode/QRCode.native.tsx DOES NOT, and would not have. QRCode's swallowed content is
 * `<LinkText>`, a local component that renders `<Text>` — selectable copy, not a focusable
 * control — so the fold there destroys three separately-read elements without tripping a single
 * pattern in CONTROL_TAGS. That is the shape of the remaining hole, stated exactly:
 *   · Folding NON-CONTROL content. Three sentences concatenated into one label is a real defect
 *     and this check calls it clean. It gates the CONTROL case only, which is the unreachable one.
 *   · A control reached through a component of the package's own — `<RetryAction>`, `<Chip>`,
 *     `<LinkText>` — that renders a Pressable one file away. Text matching does not follow a
 *     render, one file or one line away.
 *   · A control passed IN as `children` or through a `renderX` prop; the subtree here is the
 *     LITERAL subtree, not the rendered one.
 *   · `accessible` arriving through a `{...spread}`, or written as an expression
 *     (`accessible={alt !== ''}`) — neither is read, so neither is judged.
 * Every one of those under-reports. None of them invents work, which is the trade this gate keeps.
 */
import { ANY_TAG, blankStrings, openingTag, subtreeEnd } from './jsx.mjs';
import { lineOf, rel } from './lib.mjs';

/** Printed ONCE beneath the (f) findings — (e)'s counter-trap, now as its own failure. */
export const FOLD_EXPLAINER = [
  'THE (f) FOLD',
  '  TRAP. `accessible` — bare, or `accessible={true}` — declares that the node and everything',
  '  under it are ONE accessibility element. Every descendant stops being separately focusable,',
  '  their labels concatenate into the parent, and any focusable control inside (a 44dp retry',
  '  Pressable, a fallback link, a row tick, a TextInput) goes OUT OF REACH of TalkBack and',
  '  VoiceOver. Nothing warns, the tree still renders, and in review the panel looks correctly',
  '  named. This is the natural-looking repair for an (e) finding, which is why it is gated:',
  '  it shipped LIVE twice after a repair round was warned about it in prose.',
  '',
  '  THE FIX. Do NOT name the wrapper. Put the label on the node that ALREADY IS an',
  '  accessibility element — the Pressable / Touchable / Text the user actually lands on, or a',
  '  child View that carries a `role` and holds no control of its own. Leave the wrapper',
  '  unnamed so its children stay individually reachable and are read in order. If the grouping',
  '  itself must be announced, that is a `role` on the wrapper, never `accessible`.',
].join('\n');

/** `accessible` written as an assertion. TWO regexes because `openingTag` reports attributes with
 *  every `{…}` interior REMOVED — `accessible={true}` arrives there as bare `accessible=`,
 *  indistinguishable from `accessible={false}`. So the bare form is read from the attribute text
 *  (where `accessible=` correctly fails the negative lookahead) and the explicit-true form from the
 *  whole tag. Both are read STRING-BLANKED, so `accessibilityLabel="not accessible"` is not
 *  mistaken for the prop. `accessible={someExpression}` matches neither, and is not read. */
const ACCESSIBLE_BARE = /\baccessible\b(?!\s*=)/;
const ACCESSIBLE_TRUE = /\baccessible\b\s*=\s*\{\s*true\s*\}/;
/** React Native's focusable controls. A folded subtree makes every one of these unreachable. */
const CONTROL_TAGS = [
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
  'Button',
  'TextInput',
  'Switch',
];
const CONTROL_TAG_RE = new RegExp(`<\\s*(${CONTROL_TAGS.join('|')})(?![A-Za-z0-9_$])`, 'g');
/** …and anything at all that takes a press, whatever it is spelled. */
const CONTROL_HANDLER_RE = /\b(onPress|onLongPress)\s*=/g;

/** Focusable control SITES inside `subtree`, one per line — `<Pressable onPress={…}>` is one
 *  unreachable control, not two — each described by everything that made it one. */
function controlsIn(subtree, source, from) {
  const sites = new Map();
  const scan = (re, describe) => {
    for (const hit of subtree.matchAll(new RegExp(re.source, re.flags))) {
      const line = lineOf(source, from + hit.index);
      if (!sites.has(line)) sites.set(line, new Set());
      sites.get(line).add(describe(hit));
    }
  };
  scan(CONTROL_TAG_RE, (hit) => `<${hit[1]}>`);
  scan(CONTROL_HANDLER_RE, (hit) => `\`${hit[1]}\``);
  return [...sites.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([line, what]) => `${[...what].join(' ')} at line ${line}`);
}

export function auditFolds(scanned) {
  const findings = [];
  for (const { file, source, masked } of scanned) findings.push(...inFile(file, source, masked));
  return findings;
}

function inFile(file, source, masked) {
  const findings = [];
  for (const match of masked.matchAll(ANY_TAG)) {
    const tag = openingTag(masked, match.index + match[0].length);
    if (!tag) continue;
    const tagText = blankStrings(masked.slice(match.index, tag.end + 1));
    if (!ACCESSIBLE_BARE.test(blankStrings(tag.attrs)) && !ACCESSIBLE_TRUE.test(tagText)) continue;
    if (masked[tag.end - 1] === '/') continue;
    const close = subtreeEnd(masked, match[1], tag.end + 1);
    if (close === -1) continue;
    const controls = controlsIn(
      blankStrings(masked.slice(tag.end + 1, close)),
      source,
      tag.end + 1,
    );
    if (controls.length === 0) continue;
    const list = controls.join(', ');
    findings.push(
      `(f) FOLDED CONTROL  ${rel(file)}:${lineOf(source, match.index)}: <${match[1]}> carries ` +
        `\`accessible\`, which folds its whole subtree into ONE element — but that subtree holds ` +
        `${controls.length} focusable control site(s): ${list}. Each is now UNREACHABLE to TalkBack ` +
        'and VoiceOver. Do not name the wrapper: move the label onto the node that ALREADY IS an ' +
        'accessibility element (the Pressable / Touchable / Text the user lands on, or a child ' +
        'View carrying a `role` and no control), and leave this wrapper unnamed so its children ' +
        'stay individually reachable. See THE (f) FOLD below.',
    );
  }
  return findings;
}
