import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderActionReason } from '../ActionReason/ActionReason.native';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

interface NativeButtonProps extends ButtonProps {
  /** Lands on the pill, never on the reason column — the DS contract for `style`. */
  style?: StyleProp<ViewStyle>;
}

interface VariantVisual {
  background: string;
  color: string;
  elevation?: ViewStyle;
}

/* Primary is near-black. The accent is never a button fill. */
const VARIANT: Record<ButtonVariant, VariantVisual> = {
  primary: { background: theme.colors['action-primary'], color: theme.colors['text-inverse'] },
  secondary: {
    background: theme.colors.surface,
    color: theme.colors['text-primary'],
    elevation: theme.elevation.e2,
  },
  /* Web ghost reads --control-edge so field mode can ring it; RN has no field-mode edge yet. */
  ghost: { background: 'transparent', color: theme.colors['text-secondary'] },
  destructive: { background: theme.colors['danger-text'], color: theme.colors['text-inverse'] },
};

const SIZE: Record<ButtonSize, ViewStyle> = {
  lg: { height: theme.spacing['sp-12'], paddingHorizontal: theme.spacing['sp-6'] },
  md: { height: theme.spacing['sp-10'], paddingHorizontal: theme.spacing['sp-5'] },
  sm: { height: theme.spacing['sp-8'], paddingHorizontal: theme.spacing['sp-4'] },
};

const LABEL_SIZE: Record<ButtonSize, TextStyle> = {
  lg: { fontSize: theme.type.roles.button.fontSize },
  md: { fontSize: theme.type.roles.button.fontSize },
  sm: { fontSize: theme.type.roles['body-sm'].fontSize },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { backgroundColor: theme.colors['canvas-sunken'] },
  label: {
    fontFamily: theme.type.families.sans,
    fontWeight: '500',
    letterSpacing: theme.type.roles.button.letterSpacing,
  },
  column: { alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  columnFull: { alignSelf: 'stretch' },
});

/**
 * Same contract, same behaviour as the web half. Two mappings are worth naming:
 *
 *  · The pressed scale and the 44px floor come from the Pressable primitive, so this file neither
 *    re-answers them nor can undercut them. There is no hover on touch, so the hover elevation the
 *    web half raises has no counterpart here.
 *  · `disabledReason` — RN keeps a disabled element in the accessibility tree (unlike the web's
 *    native `disabled`, which leaves the tab order), so the control can carry its real disabled
 *    state and the sentence beneath it is still reachable by a screen reader.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  disabledReason,
  loading = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  onClick,
  style,
}: NativeButtonProps) {
  const visual = VARIANT[variant];
  /* Same resolver as the web half — a string, an `ActionReasonSpec` or a ready node all land on
     ActionReason, and a spec with no sentence resolves to nothing and states nothing. */
  const reason = renderActionReason(disabledReason);
  const stated = disabled && reason !== null;
  const labelColor = disabled ? theme.colors['text-disabled'] : visual.color;

  const pill = (
    <Pressable
      disabled={disabled}
      onPress={onClick}
      style={[
        styles.pill,
        SIZE[size],
        { backgroundColor: visual.background },
        disabled ? undefined : visual.elevation,
        disabled ? styles.disabled : undefined,
        fullWidth ? styles.fullWidth : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, LABEL_SIZE[size], { color: labelColor }]}>{children}</Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );

  if (!stated) {
    return pill;
  }
  return (
    <View style={[styles.column, fullWidth ? styles.columnFull : undefined]}>
      {pill}
      {reason}
    </View>
  );
}
