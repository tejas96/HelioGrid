import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

/**
 * Floating white card — no structural border, e2 at rest. RN adaptations: the web hover
 * raise (e3, -1px) maps to press feedback (scale 0.97); the web selected ring
 * (`0 0 0 2px var(--accent)`) has no RN shadow equivalent, so a constant 2dp border is
 * reserved (transparent at rest → accent when selected) and padding compensates, so
 * selecting never shifts layout.
 */

const RING = theme.spacing['sp-0-5'];

export interface CardProps {
  children: ReactNode;
  density?: 'expressive' | 'functional';
  interactive?: boolean;
  selected?: boolean;
  style?: ViewStyle;
  onClick?: () => void;
}

export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  style,
  onClick,
}: CardProps) {
  const isExpr = density === 'expressive';
  const shape: ViewStyle = {
    borderRadius: isExpr ? theme.radius['r-card-expressive'] : theme.radius['r-card-functional'],
    padding: (isExpr ? theme.spacing['sp-6'] : theme.spacing['sp-4']) - RING,
    borderColor: selected ? theme.colors.accent : 'transparent',
  };
  if (interactive || onClick) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onClick}
        style={({ pressed }) => [
          styles.base,
          shape,
          pressed && { transform: [{ scale: theme.motion.pressScale.button }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.base, shape, style]}>{children}</View>;
}

export interface IconCircleProps {
  icon: ReactNode;
  color?: string;
  size?: number;
  density?: 'expressive' | 'functional';
  style?: ViewStyle;
}

/** Signature circular icon container — a soft 6% tint of a semantic/brand colour. */
export function IconCircle({
  icon,
  color = theme.colors.accent,
  size,
  density = 'expressive',
  style,
}: IconCircleProps) {
  const d = size ?? (density === 'expressive' ? theme.spacing['sp-10'] : theme.spacing['sp-8']);
  return (
    <View style={[styles.circle, { width: d, height: d, backgroundColor: tint6(color) }, style]}>
      {icon}
    </View>
  );
}

/** RN has no color-mix(): `color-mix(in srgb, color 6%, white)` computed per channel. */
function tint6(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return theme.colors['accent-subtle'];
  const n = Number.parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c * 0.06 + 255 * 0.94);
  return `rgb(${mix((n >> 16) & 0xff)},${mix((n >> 8) & 0xff)},${mix(n & 0xff)})`;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderWidth: RING,
    ...theme.elevation.e2,
  },
  circle: {
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
