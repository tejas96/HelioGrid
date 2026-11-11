import type { Ref } from 'react';
import type {
  AccessibilityRole,
  PressableStateCallbackType,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Pressable as RNPressable, StyleSheet } from 'react-native';
import { usePalette } from '../Color/use-palette.native';
import { tapHaptic } from '../haptic.native';
import { hapticOf } from './Pressable.logic';
import type { PressableProps, PressableRole } from './Pressable.types';
import { MIN_TOUCH_TARGET } from './Pressable.types';

interface NativePressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  /** The pressable view itself, for a caller that moves the screen reader's focus to it. */
  hostRef?: Ref<View>;
}

/* Android draws a bounded ripple over the whole view, square corners included, and clips neither
   it nor the view's shadow apart, so a rounded target answers with its sink alone. */
function isRounded(style: StyleProp<ViewStyle>): boolean {
  const radius = StyleSheet.flatten(style)?.borderRadius;
  return radius !== undefined && radius !== 0;
}

const base: ViewStyle = {
  minWidth: MIN_TOUCH_TARGET,
  minHeight: MIN_TOUCH_TARGET,
  alignItems: 'center',
  justifyContent: 'center',
};

const pressedStyle: ViewStyle = { transform: [{ scale: 0.97 }] };

/**
 * The DS role vocabulary as React Native's. Identity except for the two menu roles: RN has
 * `menuitem` and no `menuitemradio`/`menuitemcheckbox`, so the row announces as a menu item and
 * `accessibilityState.checked` carries which one is on — which is exactly what TalkBack and
 * VoiceOver read out. The distinction is kept in the DS type so the web half can still spell it.
 */
const NATIVE_ROLE: Record<PressableRole, AccessibilityRole> = {
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  menuitem: 'menuitem',
  menuitemcheckbox: 'menuitem',
  menuitemradio: 'menuitem',
  radio: 'radio',
  switch: 'switch',
  tab: 'tab',
};

/**
 * The one pressable. Owns the 44px minimum target (MIN_TOUCH_TARGET), the pressed state
 * and the disabled semantics — a component never re-implements any of these (docs/engineering/17 §4).
 *
 * SEMANTICS COME THROUGH IT, NOT AROUND IT. `accessibilityRole` and `accessibilityState` are here
 * so that a checkbox, a radio, a tab or a menu row can say what it is and which one is on WITHOUT
 * dropping to RN's own `Pressable` — which is how four components lost the 44px floor and two lost
 * their semantics. `base` is applied first and always: no role can switch the floor off.
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
  haptic,
  style,
  hostRef,
}: NativePressableProps) {
  const palette = usePalette();
  const felt = hapticOf(accessibilityRole, haptic);
  /* The ripple is the words' own ink, faint: it reads on any ground the target sits on. Android
     draws it under the children; iOS ignores it. */
  const ink = { color: `${palette['text-primary']}24`, borderless: ripple === 'borderless' };
  const ripples = ripple === 'borderless' || (ripple === 'bounded' && !isRounded(style));
  const press =
    onPress === undefined
      ? undefined
      : () => {
          tapHaptic(felt);
          onPress();
        };
  return (
    <RNPressable
      ref={hostRef}
      accessibilityRole={NATIVE_ROLE[accessibilityRole]}
      /* An omitted `state.disabled` follows the prop — today's behaviour exactly. Stating it
         announces off WITHOUT going inert, which is the reachable-with-a-reason row. */
      accessibilityState={{
        selected: accessibilityState?.selected ?? accessibilityState?.current,
        checked: accessibilityState?.checked,
        /* Passed as the caller states it. Android rebuilds the spoken label only while the state
           carries a `busy` key, and speaks "busy" only for `true`: a control that stops being busy
           states `false`, or TalkBack keeps saying "…, busy" after the work is done. */
        busy: accessibilityState?.busy,
        expanded: accessibilityState?.expanded,
        disabled: accessibilityState?.disabled ?? disabled,
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={press}
      android_ripple={ripples && !disabled ? ink : undefined}
      style={(state: PressableStateCallbackType) => [
        base,
        state.pressed && !disabled ? pressedStyle : undefined,
        style,
      ]}
    >
      {children}
    </RNPressable>
  );
}
