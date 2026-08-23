/**
 * CHECK (g) — DISHONEST ROLE: `accessibilityRole="progressbar"` with no `accessibilityValue`.
 *
 * WHY. `progressbar` is a promise of a MEASURABLE position. TalkBack and VoiceOver announce a
 * percentage for it, and with no `accessibilityValue` there is nothing to announce, so the user is
 * told a determinate control exists and then told nothing about where it is. Twenty native files
 * declared it on an INDETERMINATE loading skeleton — a shimmer with no position at all — while the
 * web half of the same component announced `role="status"`, which is the honest role for "something
 * is happening, no position". The two halves disagreed about what the component IS.
 *
 * That last sentence is the reason check (h) exists — this file catches the one disagreement that
 * happens to have a signature inside a single tag; (h) compares the two halves directly.
 *
 * WHAT IT DOES. Reports any opening tag whose attributes carry the literal
 * `accessibilityRole="progressbar"` (or its RN 0.71+ alias `role="progressbar"`) and no
 * `accessibilityValue` and no `aria-valuenow` anywhere in that same tag.
 *
 * WHAT IT CANNOT SEE. It is a text match on a literal, so a role computed into a variable
 * (`accessibilityRole={busy ? 'progressbar' : 'none'}`) is invisible. The converse is worse and
 * entirely outside it: a tag that DOES carry `accessibilityValue` passes even when the value is
 * `{{ now: 0, min: 0, max: 0 }}`, or a constant, or the wrong quantity. Carrying a value is not the
 * same as being determinate — (g) proves the promise is not empty, never that it is kept.
 */
import { ANY_TAG, openingTag } from './jsx.mjs';
import { lineOf, rel } from './lib.mjs';

/** Printed ONCE beneath the (g) findings. */
export const ROLE_EXPLAINER = [
  'THE (g) DISHONEST ROLE',
  '  TRAP. `accessibilityRole="progressbar"` is a promise of a MEASURABLE position — screen',
  '  readers announce a percentage for it. With no `accessibilityValue` there is nothing to',
  '  announce: the user is told a determinate control exists and then told nothing about where',
  '  it is. Twenty native files declared it on an INDETERMINATE loading skeleton, while the web',
  '  half of the same component announced `role="status"`. The two halves disagreed about what',
  '  the component IS.',
  '',
  '  THE FIX. Determinate (a real meter, a real step count): keep `progressbar` and give it',
  '  `accessibilityValue={{ min, max, now }}`. Indeterminate (a shimmer, a skeleton, a spinner',
  '  with no position): drop `progressbar`. Announce the activity instead — the native match for',
  '  web `role="status"` is a live region with a label, not a position-less progressbar.',
].join('\n');

/** The role that promises a position, and the prop that has to keep the promise. */
const PROGRESSBAR_ROLE =
  /\b(accessibilityRole|role)\s*=\s*(?:"progressbar"|'progressbar'|\{\s*['"]progressbar['"]\s*\})/;
const HAS_VALUE = /\b(accessibilityValue|aria-valuenow)\s*=/;

export function auditRoleHonesty(scanned) {
  const findings = [];
  for (const { file, source, masked } of scanned) findings.push(...inFile(file, source, masked));
  return findings;
}

function inFile(file, source, masked) {
  const findings = [];
  for (const match of masked.matchAll(ANY_TAG)) {
    const tag = openingTag(masked, match.index + match[0].length);
    if (!tag) continue;
    const attrs = tag.attrs;
    if (!PROGRESSBAR_ROLE.test(attrs) || HAS_VALUE.test(attrs)) continue;
    findings.push(
      `(g) DISHONEST ROLE  ${rel(file)}:${lineOf(source, match.index)}: <${match[1]}> declares ` +
        '`progressbar` with no `accessibilityValue` anywhere on the tag. `progressbar` promises a ' +
        'MEASURABLE position and this one has none to give, so the screen reader announces a ' +
        'determinate control and then nothing about where it is. If it IS determinate, add ' +
        '`accessibilityValue={{ min, max, now }}`; if it is an indeterminate skeleton or shimmer, ' +
        'drop `progressbar` — the native match for the web half\'s `role="status"` is a labelled ' +
        'live region, not a position-less progressbar. See THE (g) DISHONEST ROLE below.',
    );
  }
  return findings;
}
