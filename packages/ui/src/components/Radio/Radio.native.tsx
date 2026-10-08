import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { RadioProps } from './Radio.types';

interface NativeRadioProps extends RadioProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  rowLabelled: {
    justifyContent: 'flex-start',
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* RN has no inset box-shadow: the checked 2px accent ring is a border of the same weight. */
  boxChecked: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  boxDisabled: {
    borderWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  dotDisabled: {
    backgroundColor: theme.colors['text-disabled'],
  },
});

/**
 * 20px radio, 44px target — the target comes from the Pressable primitive, which owns it.
 *
 * `name` and `value` are group bookkeeping the caller reads; RN has no form element to hand
 * them to, so they do not appear in the tree. THE ROLE AND THE CHOICE GO THROUGH THE PRIMITIVE:
 * `accessibilityRole="radio"` with `accessibilityState.checked` is the RN reading of the real
 * `<input type="radio">` the web half draws, so which one is on is announced rather than left to
 * the accent ring — the `F7-12` defect — and the 44px law is kept at the same time.
 */
export function Radio({
  checked = false,
  onChange,
  label,
  disabled = false,
  style,
}: NativeRadioProps) {
  /* The opposite of what holds it (`F7-15`): the well on the page, white inside a tile. */
  const { controlFill, controlFillDisabled } = useGround();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      onPress={onChange}
      disabled={disabled}
      accessibilityLabel={label}
      style={[styles.row, label !== undefined ? styles.rowLabelled : null, style]}
    >
      <View
        style={[
          styles.box,
          { backgroundColor: controlFill },
          checked ? styles.boxChecked : null,
          // Sunk below the fill, on the page and in a tile alike — see the web half.
          disabled ? [styles.boxDisabled, { backgroundColor: controlFillDisabled }] : null,
        ]}
      >
        {checked ? <View style={[styles.dot, disabled ? styles.dotDisabled : null]} /> : null}
      </View>
      {label !== undefined ? (
        <Text variant="body" color={disabled ? 'disabled' : 'primary'}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
