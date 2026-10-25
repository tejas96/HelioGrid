import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { SwitchProps } from './Switch.types';

interface NativeSwitchProps extends SwitchProps {
  style?: StyleProp<ViewStyle>;
}

const THUMB_TRAVEL = 20;

/**
 * 52x32 switch, spring thumb. The track takes the control fill when off, `--accent` when on; the
 * thumb is the opposite of its track — the ground, white on the accent.
 *
 * Web's hit box is a `<label>` wrapping a visually hidden `<input role="switch">`; RN has no
 * hidden-input construction, so the whole row is one Pressable (which owns the 44dp floor). The
 * track's field-mode `--control-edge` has no RN counterpart — field mode is a web custom-property
 * override — so the native track carries no edge. `aria-invalid`/`aria-describedby` have none
 * either, so an errored switch's sentence is a sibling the screen reader reaches by swipe rather
 * than a description tied to the control.
 *
 * A `description` is drawn inside the Pressable, so a tap on it throws the switch and the row
 * stays ONE accessibility element, named by its title, with the description as its hint — said
 * after the name, never folded into it.
 */
export function Switch({
  checked = false,
  onChange,
  label,
  description,
  toggleAt = 'start',
  ariaLabel,
  error,
  disabled = false,
  style,
}: NativeSwitchProps) {
  const offset = useRef(new Animated.Value(checked ? THUMB_TRAVEL : 0)).current;
  const hasError = error !== undefined && error !== null && error !== false;
  const { ground, controlFill, controlFillDisabled } = useGround();
  const on = checked && !disabled;
  const atEnd = toggleAt === 'end';
  const described = description !== undefined;

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
      accessibilityLabel={ariaLabel ?? label}
      accessibilityHint={described ? description : undefined}
      /* A SWITCH SAYS IT IS A SWITCH, AND SAYS WHICH WAY IT IS SET. The web half is
         `role="switch" aria-checked={checked}` on the hidden input; on touch the only other
         channel is the track fill and the thumb's position — status by colour alone (F7-12) —
         so the state goes through the primitive rather than being left to the tint. */
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      style={[styles.row, atEnd ? styles.rowAtEnd : undefined, hasError ? undefined : style]}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: disabled ? controlFillDisabled : controlFill },
          on ? styles.trackOn : undefined,
          hasError ? styles.trackError : undefined,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: knobColor(on, disabled, ground) },
            disabled ? styles.thumbDisabled : undefined,
            { transform: [{ translateX: offset }] },
          ]}
        />
      </View>
      <SwitchWords label={label} description={description} disabled={disabled} atEnd={atEnd} />
    </Pressable>
  );

  if (!hasError) {
    return control;
  }
  /* The sentence sits UNDER the row, never inside the pressable — tapping the reason must not
     toggle the switch. `style` lands on the wrapper, exactly as the web half does. */
  return (
    <View style={[styles.wrap, atEnd ? styles.wrapAtEnd : undefined, style]}>
      {control}
      <Text variant="caption" color="danger">
        {error}
      </Text>
    </View>
  );
}

/** The words beside the track: the label alone, or the title over its description. */
function SwitchWords({
  label,
  description,
  disabled,
  atEnd,
}: Pick<SwitchProps, 'label' | 'description'> & { disabled: boolean; atEnd: boolean }) {
  const ink = disabled ? 'secondary' : 'primary';
  if (description === undefined) {
    if (label === undefined) return null;
    return (
      <Text variant="body" color={ink} style={atEnd ? styles.wordsAtEnd : undefined}>
        {label}
      </Text>
    );
  }
  return (
    <View style={[styles.words, atEnd ? styles.wordsAtEnd : undefined]}>
      {label !== undefined ? (
        <Text variant="body-sm" color={ink} style={medium}>
          {label}
        </Text>
      ) : null}
      <Text variant="caption" color="secondary">
        {description}
      </Text>
    </View>
  );
}

/* The title's weight is --fw-medium, which the body-sm role does not carry; it rides on the Text
   primitive's style slot, as `Chip`'s does. */
const medium: TextStyle = { fontWeight: `${theme.type.weights.medium}` };

/**
 * The knob is the opposite of its track: white on the accent, the ground on the control fill, and
 * `--text-disabled` on the disabled fill, where the ground would hide which way it is set.
 */
function knobColor(on: boolean, disabled: boolean, ground: string): string {
  if (disabled) return theme.colors['text-disabled'];
  // biome-ignore lint/plugin/raw-white: on-accent — a knob or a mark on the accent or the dark fill
  return on ? theme.colors.surface : ground;
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
  /* The track at the row's end: the words lead and take the rest of the width. Grow, never a
     flex basis of 0 — in a column whose height follows its content, a zero basis collapses the
     row to its 44 floor. */
  rowAtEnd: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  words: {
    flexDirection: 'column',
    gap: theme.spacing['sp-0-5'],
    flexShrink: 1,
    minWidth: 0,
  },
  wordsAtEnd: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  track: {
    width: 52,
    flexShrink: 0,
    height: 32,
    borderRadius: theme.radius['r-pill'],
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
    ...theme.elevation.e2,
  } /* The track flattens when disabled and the knob must too, or a dead switch keeps a raised
     white knob floating in a sunken groove. */,
  thumbDisabled: { shadowOpacity: 0, elevation: 0 },

  wrap: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-1'],
  },
  wrapAtEnd: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
});
