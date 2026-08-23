import type { ReactNode } from 'react';

/**
 * Product law, one declaration: no interactive target in this product measures under
 * 44×44 (docs/17 §4, ui-adherence). Both platform halves enforce it — the native half
 * reads this constant, Pressable.css carries the same two values for the web — so a
 * component composing Pressable cannot ship a small target.
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * What a target IS. The DS's own closed vocabulary, spelled the ARIA way because ARIA is the
 * finer of the two — `menuitemradio` exists there and not in React Native, and collapsing it on
 * the way IN would lose the distinction on the web half too.
 *
 * A pressable is always a REAL control, so this list holds only interactive roles: a heading, a
 * list or a progressbar is not something you press, and asking for one here would be asking the
 * primitive to stop being a button. `link` is deliberately absent — navigation is an `<a>`, not a
 * button wearing a link's clothes.
 */
export type PressableRole =
  | 'button'
  | 'checkbox'
  | 'combobox'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'radio'
  | 'switch'
  | 'tab';

/**
 * What a target's state IS — the five announcements a role needs beyond its name. The same five
 * RN's `AccessibilityState` carries, and each has an exact `aria-*` partner, so one declaration
 * serves both halves (Law 7).
 *
 * `disabled` is the top-level `disabled` prop unless it is restated here, and the two mean
 * different things: the prop makes a target INERT, this makes it merely SAY SO. A menu row that is
 * off for a stated reason has to stay reachable, or the sentence explaining it is announced to
 * nobody — that row is `disabled: true` in the state and NOT in the prop.
 */
export interface PressableAccessibilityState {
  /** OFF, BUT STILL REACHABLE — `aria-disabled` on web, `accessibilityState.disabled` on native.
   *  Defaults to the top-level `disabled` prop; set it alone to announce off without going inert. */
  disabled?: boolean;
  /** THE CHOSEN ONE OF A SET. `aria-selected` on a `tab`; `aria-pressed` on every other role,
   *  because ARIA gives `aria-selected` to no button. Native: `accessibilityState.selected`. */
  selected?: boolean;
  /** TICKED / UNTICKED, and `'mixed'` for a partly-ticked parent. `aria-checked`. */
  checked?: boolean | 'mixed';
  /** THIS TARGET'S OWN ACT IS IN FLIGHT. `aria-busy`. Not a page-level spinner. */
  busy?: boolean;
  /** THE THING THIS TARGET OPENS IS OPEN. `aria-expanded`. */
  expanded?: boolean;
}

export interface PressableProps {
  children?: ReactNode;
  onPress?: () => void;
  /** Disabled targets stay visible and keep their footprint; they never shrink the target. */
  disabled?: boolean;
  /** Accessible name — required whenever the children are not text (icon-only targets). */
  accessibilityLabel?: string;
  /**
   * WHAT THIS TARGET IS. Omitted means `button` — a bare `<button>` on web, `accessibilityRole
   * ="button"` on native, exactly what every caller got before this prop existed.
   *
   * A component that needs different semantics passes them HERE. It does not reach past the
   * primitive for the platform pressable: the 44px floor and the focus ring are the reason this
   * file exists, and no role turns either of them off.
   */
  accessibilityRole?: PressableRole;
  /**
   * WHAT THIS TARGET'S STATE IS. Announced alongside the name, so "which one is on" is never left
   * to a tint — the F7-12 defect. Web maps it to `aria-*`, native to `accessibilityState`; both
   * merge the top-level `disabled` in.
   */
  accessibilityState?: PressableAccessibilityState;
}
