import type { AriaAttributes, CSSProperties } from 'react';
import { classNames } from '../class-names';
import type { PressableAccessibilityState, PressableProps, PressableRole } from './Pressable.types';

interface WebPressableProps extends PressableProps {
  className?: string;
  /**
   * A caller's own frame, when the pressable IS the surface — the `style` a DS component
   * spreads onto its shell. The native half has always taken one (Law 7: a prop on one
   * platform only is a defect), so a whole-card target had nowhere to put the caller's frame
   * on web and silently dropped it.
   */
  style?: CSSProperties;
}

/**
 * `selected` means "the chosen one of this set", and ARIA spells that two ways: `aria-selected`
 * for a `tab`, `aria-pressed` for everything else — no button-shaped role takes `aria-selected`.
 * One prop, so a caller never has to know which; the map below is the whole of the difference.
 */
const SELECTED_ATTR: Record<PressableRole, 'aria-pressed' | 'aria-selected'> = {
  button: 'aria-pressed',
  checkbox: 'aria-pressed',
  combobox: 'aria-pressed',
  menuitem: 'aria-pressed',
  menuitemcheckbox: 'aria-pressed',
  menuitemradio: 'aria-pressed',
  radio: 'aria-pressed',
  switch: 'aria-pressed',
  tab: 'aria-selected',
};

/** The DS state object as `aria-*`. Undefined members are dropped by React, so an omitted state
 *  emits no attributes at all and the element is byte-for-byte what it was before. */
function ariaState(
  role: PressableRole,
  disabled: boolean,
  state: PressableAccessibilityState = {},
): AriaAttributes {
  const selected = SELECTED_ATTR[role];
  /* The native `disabled` attribute already announces off AND removes the target from the walk.
     `aria-disabled` is for the other case only — off, but still reachable, so the reason for it
     can be read. Emitting both would say the same thing twice. */
  const announced = state.disabled ?? disabled;
  return {
    'aria-disabled': announced && !disabled ? true : undefined,
    'aria-selected': selected === 'aria-selected' ? state.selected : undefined,
    'aria-pressed': selected === 'aria-pressed' ? state.selected : undefined,
    'aria-checked': state.checked,
    'aria-busy': state.busy,
    'aria-expanded': state.expanded,
  };
}

/**
 * The one pressable. Owns the 44px minimum target, the focus ring, the pressed state and
 * the disabled treatment — a component never re-implements any of these (docs/engineering/17 §4).
 *
 * SEMANTICS COME THROUGH IT, NOT AROUND IT. `accessibilityRole` and `accessibilityState` are here
 * so that a checkbox, a radio, a tab or a menu row can say what it is and which one is on WITHOUT
 * dropping to the bare element — which is how four components lost the 44px floor and two lost
 * their semantics. `hg-pressable` is unconditional: the class carries the floor and the focus
 * ring, and no role can switch either off.
 */
export function Pressable({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  className,
  style,
}: WebPressableProps) {
  return (
    <button
      type="button"
      /* `button` is the element's own role — naming it again is the redundancy lint's whole point. */
      role={accessibilityRole === 'button' ? undefined : accessibilityRole}
      className={classNames('hg-pressable', className)}
      style={style}
      disabled={disabled}
      aria-label={accessibilityLabel}
      {...ariaState(accessibilityRole, disabled, accessibilityState)}
      onClick={onPress}
    >
      {children}
    </button>
  );
}
