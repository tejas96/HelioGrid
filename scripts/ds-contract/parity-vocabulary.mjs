/**
 * CHECK (h)'s VOCABULARY — the eight paired accessibility members, and how each one is spelled.
 *
 * (h) IS FOUR FILES, ONE JOB EACH. This one holds the PAIRS. parity-roles.mjs holds the ARIA↔RN
 * role translation, because role is the one member where the value decides. parity-exemptions.mjs
 * holds every sanctioned reason a member may appear on one side only. parity-declarations.mjs reads
 * one file and says what it declares, and semantic-parity.mjs pairs the halves and compares them.
 *
 * BOTH HALVES SPEAK BOTH DIALECTS, AND THAT IS NOT A MISTAKE. A web file in this package usually
 * declares its semantics as `accessibilityRole` / `accessibilityState` — because it passes them to
 * the shared `Pressable` primitive, which maps them to `aria-*` (Pressable.tsx) and to
 * `accessibilityState` (Pressable.native.tsx). Reading the web half with an `aria-*`-only
 * vocabulary would score every CORRECTLY ported control as declaring nothing. So each spelling
 * below is accepted on either side, and the comparison is over MEANING — which is the whole point
 * of the check.
 *
 * THE EXEMPTIONS ARE ENUMERATED, NEVER SILENT. Every reason a member may legitimately appear on one
 * side only is a named entry in parity-exemptions.mjs with a sentence attached, and it is tallied
 * and printed on every run. A skip nobody can see is how a gate quietly becomes decoration.
 */

/** The eight paired members. `spellings` are accepted on EITHER half — see the header. */
export const MEMBERS = [
  {
    name: 'role',
    web: 'role="X"',
    native: 'accessibilityRole',
    /** Value-aware: see ARIA_ROLE and NATIVE_ROLE below. Presence alone is not the test. */
    valued: true,
  },
  {
    name: 'checked',
    web: 'aria-checked',
    native: 'accessibilityState.checked',
    spellings: [/\baria-checked\s*[:=]/],
    state: true,
  },
  {
    name: 'selected',
    web: 'aria-selected / aria-pressed',
    native: 'accessibilityState.selected',
    spellings: [/\baria-selected\s*[:=]/, /\baria-pressed\s*[:=]/],
    state: true,
  },
  {
    name: 'expanded',
    web: 'aria-expanded',
    native: 'accessibilityState.expanded',
    spellings: [/\baria-expanded\s*[:=]/],
    state: true,
  },
  {
    name: 'busy',
    web: 'aria-busy',
    native: 'accessibilityState.busy',
    spellings: [/\baria-busy\s*[:=]/],
    state: true,
  },
  {
    name: 'disabled',
    web: 'aria-disabled',
    native: 'accessibilityState.disabled',
    spellings: [/\baria-disabled\s*[:=]/],
    state: true,
  },
  {
    name: 'live',
    web: 'aria-live',
    native: 'accessibilityLiveRegion',
    spellings: [/\baria-live\s*[:=]/, /\baccessibilityLiveRegion\s*[:=]/],
    /** INFORMATIONAL ONLY — see LIVE_REGION_REASON. */
    informational: true,
  },
  {
    name: 'label',
    web: 'aria-label / aria-labelledby',
    native: 'accessibilityLabel',
    spellings: [/\baria-label\s*[:=]/, /\baria-labelledby\s*[:=]/, /\baccessibilityLabel\s*[:=]/],
  },
];

/** The five members carried inside `accessibilityState={{ … }}`. */
export const STATE_MEMBERS = MEMBERS.filter((m) => m.state).map((m) => m.name);

/**
 * `aria-live` has no cross-platform partner and reporting it as a failure would be dishonest.
 * `accessibilityLiveRegion` is ANDROID ONLY — iOS has no equivalent prop at all; VoiceOver
 * announces changes through `AccessibilityInfo.announceForAccessibility`, which is an imperative
 * call, not a declaration, and therefore invisible to a lexical check. So a web `aria-live` with no
 * native partner may mean a real gap on Android, and it may equally mean the native half announces
 * correctly on both platforms by a route this check cannot read. It is reported, and it never
 * fails.
 */
export const LIVE_REGION_REASON =
  '`accessibilityLiveRegion` is Android-only and iOS announces imperatively via ' +
  '`AccessibilityInfo.announceForAccessibility`, which no lexical check can see — so this is ' +
  'reported and never failed.';
