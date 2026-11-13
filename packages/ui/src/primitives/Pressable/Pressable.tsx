import type { AriaAttributes, CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { classNames } from '../class-names';
import { useReducedMotion } from '../use-reduced-motion';
import type {
  PressableAccessibilityState,
  PressableFocusGroup,
  PressableProps,
  PressableRipple,
  PressableRole,
} from './Pressable.types';

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
    'aria-current': state.current === true ? 'page' : undefined,
  };
}

/** How long an ink is kept: its animation's length (`--dur-ambient`) and a margin, then it goes. */
const INK_LIFE_MS = 700;

/**
 * A touch's ink on the web (`Pressable.css`): a circle grown from the touch point by transform and
 * faded by opacity, then removed. A bounded ink sits in a layer clipped to the target's own shape;
 * the target is a positioning box only while an ink is on it. It is drawn into the DOM outside
 * React, so no press re-renders the tree. A mouse gets none — hover is its answer.
 */
function drawInk(event: PointerEvent<HTMLButtonElement>, ripple: PressableRipple) {
  if (event.pointerType === 'mouse') return;
  const host = event.currentTarget;
  const box = host.getBoundingClientRect();
  const bounded = ripple === 'bounded';
  const size = bounded
    ? Math.hypot(box.width, box.height) * 2
    : Math.max(box.width, box.height) * 1.6;
  const ink = document.createElement('span');
  ink.className = 'hg-pressable-ink';
  ink.style.width = `${size}px`;
  ink.style.height = `${size}px`;
  ink.style.left = `${(bounded ? event.clientX - box.left : box.width / 2) - size / 2}px`;
  ink.style.top = `${(bounded ? event.clientY - box.top : box.height / 2) - size / 2}px`;
  let layer: HTMLElement = ink;
  if (bounded) {
    layer = document.createElement('span');
    layer.className = 'hg-pressable-ink-clip';
    layer.append(ink);
  }
  host.dataset.inking = '';
  host.append(layer);
  window.setTimeout(() => {
    layer.remove();
    if (host.querySelector('.hg-pressable-ink') === null) host.removeAttribute('data-inking');
  }, INK_LIFE_MS);
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
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  ripple = 'bounded',
  focusGroup,
  className,
  style,
}: WebPressableProps) {
  const reduced = useReducedMotion();
  const inks = ripple !== 'none' && !reduced;
  return (
    <button
      type="button"
      /* `button` is the element's own role — naming it again is the redundancy lint's whole point. */
      role={accessibilityRole === 'button' ? undefined : accessibilityRole}
      className={classNames('hg-pressable', className)}
      style={style}
      disabled={disabled}
      aria-label={accessibilityLabel}
      aria-description={accessibilityHint}
      {...ariaState(accessibilityRole, disabled, accessibilityState)}
      onClick={onPress}
      tabIndex={focusGroup === undefined ? undefined : focusGroup.tabbable ? 0 : -1}
      onKeyDown={focusGroup === undefined ? undefined : (event) => keyOf(event, focusGroup)}
      onPointerDown={inks ? (event) => drawInk(event, ripple) : undefined}
    >
      {children}
    </button>
  );
}

/** A key the group walks with is the group's; every other key is the button's own. */
function keyOf(event: KeyboardEvent<HTMLButtonElement>, group: PressableFocusGroup): void {
  if (group.onKey(event.key)) event.preventDefault();
}
