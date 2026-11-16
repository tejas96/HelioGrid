import { theme } from '@heliogrid/theme';
import { type Ref, useRef } from 'react';
import type { AccessibilityRole, StyleProp, View, ViewStyle } from 'react-native';
import { Animated, Easing, Pressable as RNPressable, StyleSheet } from 'react-native';
import { usePalette } from '../Color/use-palette.native';
import { tapHaptic } from '../haptic.native';
import { useReducedMotion } from '../use-reduced-motion.native';
import { hapticOf } from './Pressable.logic';
import type { PressableProps, PressableRole, PressableSink } from './Pressable.types';
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

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

const SUNK: Record<PressableSink, number> = {
  control: theme.motion.press.scale,
  icon: theme.motion.press.iconScale,
};

/**
 * The press sinking and rising, on the UI thread over `fast`, as the web's `:active` does; under
 * reduced motion the sunk scale shows at once. The press itself never waits on it.
 */
function useSink(sink: PressableSink) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const to = (value: number) => {
    if (reduced) {
      scale.setValue(value);
      return;
    }
    Animated.timing(scale, {
      toValue: value,
      duration: theme.motion.durations.fast,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: true,
    }).start();
  };
  return { scale, sinkIn: () => to(SUNK[sink]), sinkOut: () => to(1) };
}

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
  sink = 'control',
  style,
  hostRef,
}: NativePressableProps) {
  const palette = usePalette();
  const { scale, sinkIn, sinkOut } = useSink(sink);
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
    <AnimatedPressable
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
      /* Never `false`: React Native writes any `disabled` it is given over the state above, so a
         `false` here would erase a stated-off control's "disabled" for the screen reader. */
      disabled={disabled ? true : undefined}
      onPress={press}
      onPressIn={sinkIn}
      onPressOut={sinkOut}
      android_ripple={ripples && !disabled ? ink : undefined}
      style={[base, { transform: [{ scale }] }, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
