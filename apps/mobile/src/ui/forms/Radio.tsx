import { theme } from '@heliogrid/tokens/theme';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/** _adherence allowlist: checked, onChange, label, name, value, disabled, id, style. */
export interface RadioProps {
  checked?: boolean;
  /** RN adaptation: fires with `true` when this radio is selected (radios never untoggle). */
  onChange?: (checked: boolean) => void;
  label?: string;
  /** API parity with the web allowlist — RN has no native form grouping; the screen owns exclusivity. */
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
  style?: ViewStyle;
}

/** 20px radio. Checked = 2px accent inset ring + 10px accent dot (RN borders draw inside — exact match). */
export function Radio({
  checked = false,
  onChange,
  label,
  name: _name,
  value: _value,
  disabled = false,
  id,
  style,
}: RadioProps) {
  return (
    <Pressable
      nativeID={id}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => {
        if (!checked) onChange?.(true);
      }}
      // 44pt target: 20px visual circle — vertical hitSlop extends the touch area.
      hitSlop={{ top: 12, bottom: 12 }}
      style={[styles.row, style]}
    >
      <View
        style={[
          styles.circle,
          checked ? styles.circleChecked : styles.circleUnchecked,
          disabled && styles.circleDisabled,
        ]}
      >
        {checked && <View style={[styles.dot, disabled && styles.dotDisabled]} />}
      </View>
      {label != null && (
        <AppText
          role="body"
          color={disabled ? theme.colors['text-disabled'] : theme.colors['text-primary']}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 10 — ds-ref Radio circle↔label gap (reference geometry, no spacing token).
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10 },
  circle: {
    width: 20,
    height: 20,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  circleUnchecked: { ...theme.elevation.e1 },
  circleChecked: { borderWidth: 2, borderColor: theme.colors.accent },
  circleDisabled: {
    borderWidth: 0,
    // RN has no `box-shadow: none` — zeroing opacity/elevation removes e1 on iOS + Android.
    shadowOpacity: 0,
    elevation: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  dotDisabled: { backgroundColor: theme.colors['text-disabled'] },
});
