import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * Product law, one declaration: no interactive target in this product measures under
 * 44×44 (docs/engineering/17 §4, ui-adherence). Both platform halves enforce it — the native half
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
  /** THE PAGE IN VIEW of a set of places — a settings side list's row. `aria-current="page"` on
   *  web; `selected` on native, which has no current. */
  current?: boolean;
}

/**
 * The ink a touch leaves. `bounded` spreads inside the target's own shape, `borderless` past it —
 * for an icon with no ground of its own — and `none` leaves the sink alone, for a target that draws
 * its own pressed look. Android draws its platform ripple, on a square target only: it draws a
 * bounded ripple square under round corners, and a clip would cut the target's shadow, so a rounded
 * target answers with its sink alone. The web draws one for a touch or a pen, never a mouse, which
 * has hover instead; iOS never ripples, its sink is the answer.
 */
export type PressableRipple = 'bounded' | 'borderless' | 'none';

/**
 * The light tap the phone gives as a press lands: `impact` for a primary act, `selection` for a
 * choice, `none` for neither. The web has no haptic engine and gives none.
 */
export type PressableHaptic = 'impact' | 'selection' | 'none';

export interface PressableProps {
  children?: ReactNode;
  onPress?: () => void;
  /** Disabled targets stay visible and keep their footprint; they never shrink the target. */
  disabled?: boolean;
  /** Accessible name — required whenever the children are not text (icon-only targets). */
  // biome-ignore lint/plugin/copy-prop-type: composed by the control that holds it, from its TranslatedText words and facts (a sheet's name)
  accessibilityLabel?: string;
  /** What the target does or holds beyond its name — said after it (`aria-description` on the web). */
  accessibilityHint?: TranslatedText;
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
  /** The ink a touch leaves (`PressableRipple`). Default `bounded`. */
  ripple?: PressableRipple;
  /** The tap the phone gives as the press lands (`PressableHaptic`). Default by role (`hapticOf`). */
  haptic?: PressableHaptic;
  /**
   * One option of a radio group: the group is ONE tab stop — the chosen option, else the first —
   * and the arrows move between its options (WAI-ARIA radio group). A phone has no tab order, so
   * its half ignores this.
   */
  focusGroup?: PressableFocusGroup;
}

export interface PressableFocusGroup {
  /** The group's one tab stop: the chosen option, else the first. */
  readonly tabbable: boolean;
  /** A key pressed on this option; `true` when the group used it, so the browser does not. */
  readonly onKey: (key: string) => boolean;
}
