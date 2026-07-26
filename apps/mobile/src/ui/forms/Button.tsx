import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/** _adherence allowlist: children, variant, size, disabled, loading, icon, iconRight, fullWidth, style, onClick. */
export interface ButtonProps {
  children: ReactNode;
  /** `danger` does not exist — mockup bug; canonical is `destructive` (docs/10 §6). */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  onClick?: () => void;
}

/* ds-ref Button.jsx geometry: lg 48 / md 40 / sm 32; pads from the spacing scale. */
const SIZES = {
  lg: { height: 48, paddingHorizontal: theme.spacing['sp-6'] },
  md: { height: 40, paddingHorizontal: theme.spacing['sp-5'] },
  sm: { height: 32, paddingHorizontal: theme.spacing['sp-4'] },
} as const;

const VARIANTS = {
  primary: {
    rest: { backgroundColor: theme.colors['action-primary'] },
    pressed: { backgroundColor: theme.colors['action-primary-pressed'] },
    color: theme.colors.surface,
  },
  secondary: {
    rest: { backgroundColor: theme.colors.surface, ...theme.elevation.e1 },
    pressed: null,
    color: theme.colors['text-primary'],
  },
  ghost: {
    rest: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: theme.colors['neutral-bg'] },
    color: theme.colors['text-secondary'],
  },
  // No hover on touch: the web's darkened destructive hover has no RN equivalent —
  // press feedback is the 0.97 scale (destructive pressed bg stays --danger).
  destructive: {
    rest: { backgroundColor: theme.colors.danger },
    pressed: null,
    color: theme.colors.surface,
  },
} as const;

/** Primary action is near-black — the strongest identity marker. Always pill-shaped. */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  onClick,
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];
  const inert = disabled || loading;
  const textColor = disabled ? theme.colors['text-disabled'] : v.color;
  // 44pt target: md (40) and sm (32) extend their touch area via hitSlop.
  const slop = Math.max(0, (44 - s.height) / 2);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onClick}
      hitSlop={slop > 0 ? { top: slop, bottom: slop } : undefined}
      style={({ pressed }) => [
        styles.base,
        s,
        v.rest,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !inert && styles.pressedScale,
        pressed && !inert && v.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <AppText
            role={size === 'sm' ? 'body-sm' : 'button'}
            weight="500"
            color={textColor}
            style={size === 'sm' ? styles.smTracking : undefined}
          >
            {children}
          </AppText>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  disabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    // RN has no `box-shadow: none` — zeroing opacity/elevation removes e1 on iOS + Android.
    shadowOpacity: 0,
    elevation: 0,
  },
  pressedScale: { transform: [{ scale: theme.motion.pressScale.button }] },
  smTracking: { letterSpacing: theme.typography.button.letterSpacing },
});
