import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

/** _adherence allowlist: children, size, label, variant, disabled, style, onClick. */
export interface IconButtonProps {
  /**
   * The icon element. RN has no `currentColor` inheritance — pass the icon its
   * colour explicitly: surface → text-primary, dark → surface, ghost → text-secondary,
   * disabled → text-disabled.
   */
  children: ReactNode;
  size?: number;
  /** REQUIRED — icon-only control; becomes the accessibilityLabel. */
  label: string;
  variant?: 'surface' | 'dark' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  onClick?: () => void;
}

const VARIANTS = {
  surface: {
    rest: { backgroundColor: theme.colors.surface, ...theme.elevation.e1 },
    pressed: null,
  },
  dark: {
    rest: { backgroundColor: theme.colors['action-primary'] },
    pressed: null,
  },
  ghost: {
    rest: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: theme.colors['neutral-bg'] },
  },
} as const;

/** Perfect-circle icon button. White fill + e1 at rest. Press scale 0.94. */
export function IconButton({
  children,
  size = 40,
  label,
  variant = 'surface',
  disabled = false,
  style,
  onClick,
}: IconButtonProps) {
  const v = VARIANTS[variant];
  // 44pt target: visual circles smaller than 44 extend their touch area via hitSlop.
  const slop = Math.max(0, (44 - size) / 2);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onClick}
      hitSlop={slop > 0 ? { top: slop, bottom: slop, left: slop, right: slop } : undefined}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        v.rest,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressedScale,
        pressed && !disabled && v.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
  disabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    // RN has no `box-shadow: none` — zeroing opacity/elevation removes e1 on iOS + Android.
    shadowOpacity: 0,
    elevation: 0,
  },
  pressedScale: { transform: [{ scale: theme.motion.pressScale.iconButton }] },
});
