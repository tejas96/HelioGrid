/**
 * CHECK (e) — INERT NATIVE ACCESSIBILITY: state hung on a node that is not an accessibility
 * element, so nothing is ever announced.
 *
 * (e) AND (f) ARE ONE PAIR AND MUST SHIP TOGETHER. (e) alone teaches the repair "add `accessible`
 * to the wrapper", which is the WORSE defect — it trades a silent state for an unreachable control.
 * That counter-trap lives in native-fold.mjs, as a gate rather than as prose, because prose in a
 * header is exactly what failed: this warning was written here, read, agreed with, and then
 * violated LIVE twice (Image/ImageStates, QRCode).
 *
 * WHY. In React Native a plain `<View>` is NOT an accessibility element. TalkBack and VoiceOver
 * walk elements, not the view tree, and a View becomes one only when it carries `accessible`, or a
 * role (`accessibilityRole` / its RN 0.71+ alias `role`). Hang `accessibilityState`,
 * `accessibilityLabel` or `accessibilityValue` on a View with neither and the props are INERT: they
 * typecheck, they lint, they render, and the screen reader never reads them. There is no runtime
 * warning, and a sighted reviewer sees a correct-looking prop.
 *
 * This produced FOUR separate live defects in this package — DataTable body rows, DataTable cards,
 * Kanban cards and the DataTable native grid caption — and, worse, TWICE a repair pass "fixed" a
 * defect by writing exactly this inert form. That is what makes it gate-worthy rather than
 * review-worthy: the shape is the natural thing to reach for, so it comes back.
 *
 * WHAT IT DOES. Scans every `<View>` / `<Animated.View>` opening tag under packages/ui/src, reads
 * the attributes at the tag's own nesting depth, and reports one that carries a trigger prop with
 * no `accessible`, no `accessibilityRole` and no `role`. `accessible={false}` does not count as
 * satisfying it — it asserts the opposite, so a label beside it is just as dead.
 *
 * WHAT IT CANNOT SEE. Only `View` and `Animated.View`: a wrapper component of the package's own
 * (`<Surface>`, `<Box>`) that forwards to a View is invisible, because text matching cannot follow
 * the forward. A tag carrying a `{...spread}` is SKIPPED — the spread may supply `accessible` from
 * the caller, and this gate under-reports rather than invents work, so `{...rest}` is a real place
 * for the defect to hide. The `aria-*` aliases (`aria-label`, `aria-busy`, `aria-selected`) are
 * equally inert on a roleless View and are NOT triggers here; the vocabulary is the three props the
 * four live defects were written with. It cannot judge whether a View that correctly carries a role
 * announces the right thing — only reading it tells you that. The one converse it CAN judge is the
 * fold, and that is (f); whether the two platform halves agree at all is (h).
 */
import { attributeNames, openingTag } from './jsx.mjs';
import { lineOf, rel } from './lib.mjs';

/** Printed ONCE beneath the (e) findings. The counter-trap is half the message: twice in this
 *  package a repair pass turned a silent state into an unreachable control by "fixing" it wrong. */
export const A11Y_EXPLAINER = [
  'THE (e) TRAP, AND THE COUNTER-TRAP THAT MATTERS AS MUCH',
  '  TRAP. In React Native a plain <View> is NOT an accessibility element. TalkBack and',
  '  VoiceOver walk elements, not the view tree. `accessibilityState` / `accessibilityLabel` /',
  '  `accessibilityValue` on a View with no `accessible` and no role (`accessibilityRole`, or',
  '  its RN 0.71+ alias `role`) are INERT — they typecheck, they lint, they render, and the',
  '  screen reader never reads them. No runtime warning; nothing looks wrong in review.',
  '',
  '  COUNTER-TRAP. The fix is NOT "add `accessible` to the wrapper". `accessible` folds the',
  '  whole subtree into ONE element: children stop being separately focusable, their labels are',
  '  concatenated, and any 44dp control inside — a row tick, a live cell, a row action — goes',
  '  out of reach of the screen reader. That trades a silent state for an unreachable control,',
  '  which is worse. Twice in this package a repair pass "fixed" a defect by writing exactly the',
  '  inert form above; do not now fix it by writing exactly the fold.',
  '',
  '  THE FIX. The state belongs on the node that ALREADY IS the accessibility element — the',
  '  Pressable / Touchable / Text the user actually lands on, or a View that already carries a',
  '  role. Only when no such node exists does the View need a `role` of its own, and then it is',
  '  a role, not `accessible`.',
].join('\n');

const TARGET = /<\s*(View|Animated\.View)\b/g;
/** Props that only do something on a node that IS an accessibility element. */
const TRIGGERS = new Set(['accessibilityState', 'accessibilityLabel', 'accessibilityValue']);
/** What makes a View an accessibility element. `role` is RN 0.71+'s alias for accessibilityRole. */
const SATISFIERS = new Set(['accessible', 'accessibilityRole', 'role']);

/** `accessible` satisfies unless it is written `accessible={false}`. */
function accessibleIsFalse(tagText) {
  return /\baccessible\s*=\s*\{\s*false\s*\}/.test(tagText);
}

/** (e) over every scanned source. `masked` is `source` with comment bodies blanked in place, so a
 *  `<View accessibilityLabel>` inside a worked example in a JSDoc block is prose, not a render. */
export function auditInertA11y(scanned) {
  const findings = [];
  for (const { file, source, masked } of scanned) findings.push(...inFile(file, source, masked));
  return findings;
}

function inFile(file, source, masked) {
  const findings = [];
  for (const match of masked.matchAll(TARGET)) {
    const tag = openingTag(masked, match.index + match[0].length);
    if (!tag || tag.spread) continue;
    const tagText = masked.slice(match.index, tag.end + 1);
    const names = attributeNames(tag.attrs);
    const triggers = [...names.keys()].filter((name) => TRIGGERS.has(name));
    if (triggers.length === 0) continue;
    const satisfied = [...names.keys()].filter(
      (name) => SATISFIERS.has(name) && !(name === 'accessible' && accessibleIsFalse(tagText)),
    );
    if (satisfied.length > 0) continue;
    findings.push(
      `(e) INERT A11Y  ${rel(file)}:${lineOf(source, match.index)}: <${match[1]}> carries ` +
        `${triggers.map((name) => `\`${name}\``).join(', ')} with no \`accessible\`, no ` +
        '`accessibilityRole` and no `role` — nothing is announced. See THE (e) TRAP below.',
    );
  }
  return findings;
}
