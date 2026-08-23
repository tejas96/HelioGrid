import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { SwitchProps } from './Switch.types';

interface NativeSwitchProps extends SwitchProps {
  style?: StyleProp<ViewStyle>;
}

const THUMB_TRAVEL = 20;

/**
 * 52x32 switch, spring thumb. Track `--canvas-sunken` when off, `--accent` when on.
 *
 * Web's hit box is a `<label>` wrapping a visually hidden `<input role="switch">`; RN has no
 * hidden-input construction, so the whole row is one Pressable (which owns the 44dp floor). The
 * track's field-mode `--control-edge` has no RN counterpart — field mode is a web custom-property
 * override — so the native track carries no edge. `aria-invalid`/`aria-describedby` have none
 * either, so an errored switch's sentence is a sibling the screen reader reaches by swipe rather
 * than a description tied to the control.
 */
export function Switch({
  checked = false,
  onChange,
  label,
  error,
  disabled = false,
  style,
}: NativeSwitchProps) {
  const offset = useRef(new Animated.Value(checked ? THUMB_TRAVEL : 0)).current;
  const hasError = error !== undefined && error !== null && error !== false;

  useEffect(() => {
    Animated.timing(offset, {
      toValue: checked ? THUMB_TRAVEL : 0,
      duration: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings.spring),
      useNativeDriver: true,
    }).start();
  }, [checked, offset]);

  const control = (
    <Pressable
      accessibilityLabel={label}
      /* A SWITCH SAYS IT IS A SWITCH, AND SAYS WHICH WAY IT IS SET. The web half is
         `role="switch" aria-checked={checked}` on the hidden input; on touch the only other
         channel is the track fill and the thumb's position — status by colour alone (F7-12) —
         so the state goes through the primitive rather than being left to the tint. */
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      style={[styles.row, hasError ? undefined : style]}
    >
      <View
        style={[
          styles.track,
          checked && !disabled ? styles.trackOn : undefined,
          hasError ? styles.trackError : undefined,
        ]}
      >
        <Animated.View style={[styles.thumb, { transform: [{ translateX: offset }] }]} />
      </View>
      {label !== undefined ? (
        <Text variant="body" color={disabled ? 'disabled' : 'primary'}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );

  if (!hasError) {
    return control;
  }
  /* The sentence sits UNDER the row, never inside the pressable — tapping the reason must not
     toggle the switch. `style` lands on the wrapper, exactly as the web half does. */
  return (
    <View style={[styles.wrap, style]}>
      {control}
      <Text variant="caption" color="danger">
        {error}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: theme.spacing['sp-3'],
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  trackOn: {
    backgroundColor: theme.colors.accent,
  },
  trackError: {
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
  },
  thumb: {
    position: 'absolute',
    top: theme.spacing['sp-1'],
    left: theme.spacing['sp-1'],
    width: 24,
    height: 24,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  wrap: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-1'],
  },
});
