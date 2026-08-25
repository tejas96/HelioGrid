import { LIVE_REGION_REASON } from './parity-vocabulary.mjs';

/**
 * CHECK (h)'s SANCTIONED EXEMPTIONS — every legitimate reason an accessibility word may appear on
 * one platform half and not the other, one entry, one reason each.
 *
 * WHY IT IS ITS OWN FILE, AND WHY EACH ONE IS NAMED. A gate this broad is mostly exemptions: the
 * two platforms genuinely do not have the same vocabulary, the web carries half its semantics in
 * its ELEMENTS, and a lexical scan cannot see a name that comes from content. An exemption written
 * as an unlabelled `continue` in the middle of a comparison is invisible — nobody can audit it,
 * nobody can count it, and it is how a gate quietly stops checking anything. Each key below is
 * TALLIED by semantic-parity.mjs and printed with its reason and its count on every run, green or
 * red, so what the check declined to look at is as visible as what it found.
 */
export const EXEMPTIONS = {
  WAIVED_SURFACE: {
    reason:
      'the component has no native half at all, waived by the `PRINT SURFACE` / `POINTER SURFACE` ' +
      'marker in its own types-file header — the same closed vocabulary this gate reads. There ' +
      'is no native half to disagree with.',
  },
  NO_RN_ROLE: {
    reason:
      "the web role has no React Native partner. `status` is the clearest case: RN's role " +
      'vocabulary has nothing for it, and the honest native form is a labelled live region, not a ' +
      'role — which is exactly what check (g) says. Landmark roles (`banner`, `navigation`, ' +
      '`main`, `complementary`, `contentinfo`, `region`, `form`, `search`) describe page regions ' +
      'that neither TalkBack nor VoiceOver models, `group` has no announced RN equivalent, and ' +
      "`presentation` / `none` describe RN's default.",
  },
  INDETERMINATE_PROGRESS: {
    reason:
      'the web declares `progressbar` for an operation with no measurable position and the ' +
      'native half must NOT. ARIA reads a progressbar with no `aria-valuenow` as ' +
      'indeterminate, which is legitimate and is what the design system spells. TalkBack and ' +
      'VoiceOver instead announce a PERCENTAGE for the role, so a position-less native ' +
      'progressbar promises a number it has nothing to put behind — which is precisely what ' +
      'check (g) refuses. The two checks would otherwise contradict each other on the same ' +
      'node: (h) demanding the partner role and (g) forbidding it. The honest native form is ' +
      'a labelled node that announces the work is happening, without the role. Fires only ' +
      'when the web side carries no `aria-valuenow` — a REAL meter, which has one, still ' +
      'owes its native partner a role plus an `accessibilityValue`.',
  },
  NO_WEB_ROLE: {
    reason:
      'the native role has no ARIA partner. `text` means "static text", which on the web is a ' +
      'plain element and needs no role; `keyboardkey` and `none` are likewise not ARIA words.',
  },
  ROLE_IN_ELEMENT: {
    reason:
      'the web half carries the role in its ELEMENT rather than in an attribute — `<button>` IS a ' +
      'button, `<ul>` IS a list, `<h2>` IS a header — and naming it again is what the ARIA ' +
      'redundancy lint forbids. React Native has no elements, so its half must spell the role ' +
      'out. Resolved through IMPLICIT_ROLE / INPUT_ROLE, matched by VALUE, so a native role the ' +
      'web markup does not imply still reports.',
  },
  ROLE_NORMALISED: {
    reason:
      'the two halves spell one role differently and mean the same thing. `menuitemradio` and ' +
      '`menuitemcheckbox` exist in ARIA and not in RN, so the native half announces `menuitem` ' +
      'and carries which-one-is-on in `accessibilityState.checked` — exactly what Pressable.native ' +
      '’s NATIVE_ROLE map does. `img`↔`image`, `heading`↔`header`, ' +
      '`slider`↔`adjustable`, `gridcell`↔`cell`, `togglebutton`↔`button`.',
  },
  PRIMITIVE_DEFAULT_ROLE: {
    reason:
      "the half renders the package's own `Pressable`, whose `accessibilityRole` DEFAULTS to " +
      '`button` (Pressable.types.ts: "Omitted means `button`"). The web half emits a real ' +
      '`<button>` and the native half emits `accessibilityRole="button"`, so neither has to write ' +
      'it. Only `button` is absorbed, and only for the package primitive — `RNPressable` and a ' +
      'bare `<div>` get nothing.',
  },
  DISABLED_FROM_PROP: {
    reason:
      'the half passes a plain `disabled` prop, which announces off on both platforms without any ' +
      'ARIA or RN state: `<button disabled>` leaves the tab order, and `Pressable.native` merges ' +
      'the prop into `accessibilityState.disabled` itself. `aria-disabled` / ' +
      '`accessibilityState.disabled` exist for the OTHER case — off but STILL REACHABLE, so the ' +
      'reason can be read — and no lexical check can tell the two apart.',
  },
  STATE_IN_ELEMENT: {
    reason:
      'the web half carries the state in its ELEMENT: `<input type="checkbox">` and ' +
      '`<input type="radio">` announce checked, `<option>` announces selected, `<details>` ' +
      'announces expanded. Adding `aria-checked` beside a real checkbox is the redundancy the ' +
      'ARIA lint forbids. React Native has no such elements, so its half must declare the state.',
  },
  NAME_FROM_CONTENT: {
    reason:
      'an accessible NAME has sources no attribute scan can see. On the web it usually comes from ' +
      'element CONTENT (`<button>Save</button>`), from a `<label htmlFor>`, or from `alt` / ' +
      '`title` / `placeholder`; on native from a `<Text>` child. Absence of the attribute ' +
      'therefore proves nothing, and a `label` difference is only reported when the partner shows ' +
      'no name source of ANY kind — which is the icon-only case, where there genuinely is none.',
  },
  OPAQUE_STATE: {
    reason:
      '`accessibilityState` was passed a variable or a spread rather than an object literal, so ' +
      'which members it carries cannot be read from the text. The comparison is suppressed for ' +
      'that half — under-reporting, on purpose.',
  },
  OPAQUE_ROLE: {
    reason:
      'the role was computed (`accessibilityRole={busy ? …}`) rather than written as a literal, ' +
      'so it cannot be read from the text. Same trade as OPAQUE_STATE. This is (g)’s blind ' +
      'spot too.',
  },
  LIVE_REGION: { reason: LIVE_REGION_REASON },
};
