import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useGround } from '../../primitives/Ground/Ground.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { CheckboxProps } from './Checkbox.types';

interface NativeCheckboxProps extends CheckboxProps {
  style?: StyleProp<ViewStyle>;
}

const BOX = 20;
const TICK = 12;

const styles = StyleSheet.create({
  target: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
  },
  labelled: { justifyContent: 'flex-start' },
  box: {
    width: BOX,
    height: BOX,
    borderRadius: theme.radius['rf-sm'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: theme.colors.accent },
});

/**
 * 20px box, 44px target — the same two rectangles the web half draws. `id` has no native
 * counterpart and is accepted and ignored, the way the DS's own web `id` is only ever the label's
 * `for`.
 *
 * **The role and the tick go through the primitive**, which owns both the 44px floor and the
 * pressed treatment: `accessibilityRole="checkbox"` plus `accessibilityState.checked` is the RN
 * reading of the real `<input type="checkbox">` the web half draws. Announcing that state is this
 * control's whole contract, so it is never left to the accent fill.
 */
export function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  ariaLabel,
  style,
}: NativeCheckboxProps) {
  const tick = disabled ? theme.colors['text-disabled'] : theme.colors['text-inverse'];
  /* The opposite of what holds it (`F7-15`): the well on the page, white inside a tile. */
  const { controlFill, controlFillDisabled } = useGround();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      /* A visible `label` is the name; `ariaLabel` names the bare tick, and never both. */
      accessibilityLabel={label ?? ariaLabel}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      style={[styles.target, label === undefined ? undefined : styles.labelled, style]}
    >
      <View
        style={[
          styles.box,
          { backgroundColor: controlFill },
          checked ? styles.boxChecked : undefined,
          // Sunk below the fill, on the page and in a tile alike — see the web half.
          disabled ? { backgroundColor: controlFillDisabled } : undefined,
        ]}
      >
        {checked ? (
          <Svg width={TICK} height={TICK} viewBox="0 0 12 12" fill="none">
            <Path
              d="M2.5 6.5L5 9l4.5-5"
              stroke={tick}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
      {label === undefined ? null : <Text color={disabled ? 'disabled' : 'primary'}>{label}</Text>}
    </Pressable>
  );
}
