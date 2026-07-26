import { theme } from '@heliogrid/tokens/theme';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/** _adherence allowlist: checked, onChange, label, disabled, id, style. */
export interface CheckboxProps {
  checked?: boolean;
  /** RN adaptation: receives the next checked value (web passes the change event). */
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  style?: ViewStyle;
}

/**
 * 20px checkbox. Unchecked = white + e1, checked = accent fill + white check.
 * RN adaptation: the check mark is a border-drawn L rotated −45° (no SVG dependency).
 */
export function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      nativeID={id}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      // 44pt target: 20px visual box — vertical hitSlop extends the touch area.
      hitSlop={{ top: 12, bottom: 12 }}
      style={[styles.row, style]}
    >
      <View
        style={[
          styles.box,
          checked ? styles.boxChecked : styles.boxUnchecked,
          disabled && styles.boxDisabled,
        ]}
      >
        {checked && <View style={[styles.check, disabled && styles.checkDisabled]} />}
      </View>
      {label != null && (
        // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role (TypeRole), not ARIA — RN has no DOM roles
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
  // 10 — ds-ref Checkbox box↔label gap (reference geometry, no spacing token).
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10 },
  box: {
    width: 20,
    height: 20,
    // 6 — ds-ref Checkbox box radius (matches rf-sm).
    borderRadius: theme.radius['rf-sm'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxUnchecked: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    ...theme.elevation.e1,
  },
  boxChecked: { backgroundColor: theme.colors.accent },
  boxDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    // RN has no `box-shadow: none` — zeroing opacity/elevation removes e1 on iOS + Android.
    shadowOpacity: 0,
    elevation: 0,
  },
  // Border-drawn check: 10×6 L-shape rotated −45°, optically centred.
  check: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors.surface,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  checkDisabled: { borderColor: theme.colors['text-disabled'] },
});
