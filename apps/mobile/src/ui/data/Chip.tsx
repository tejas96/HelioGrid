import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Fully-pill chip (filter variant): white + e1 at rest, near-black `action-primary` fill
 * when active — never the accent. Badge: flat semantic tint + toned text. The fixed
 * heights (28/24) and 6px dot are _ds spec dimensions; pressable chips get vertical
 * hitSlop up to the 44pt target since the visual height sits below it.
 */

const TONE_FG = {
  neutral: theme.colors.neutral,
  success: theme.colors.success,
  warning: theme.colors.warning,
  danger: theme.colors.danger,
  info: theme.colors.info,
  accent: theme.colors.accent,
} as const;

const TONE_BG = {
  neutral: theme.colors['neutral-bg'],
  success: theme.colors['success-bg'],
  warning: theme.colors['warning-bg'],
  danger: theme.colors['danger-bg'],
  info: theme.colors['info-bg'],
  accent: theme.colors['accent-subtle'],
} as const;

export type ChipTone = keyof typeof TONE_FG;

const HEIGHT = { expressive: 28, functional: 24 } as const;
const DOT = 6;
const MIN_TARGET = 44;

export interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  dot?: boolean;
  tone?: ChipTone;
  density?: 'expressive' | 'functional';
  style?: ViewStyle;
}

export function Chip({
  children,
  active = false,
  onClick,
  dot = false,
  tone = 'neutral',
  density = 'expressive',
  style,
}: ChipProps) {
  const h = HEIGHT[density];
  const slop = (MIN_TARGET - h) / 2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !onClick }}
      disabled={!onClick}
      onPress={onClick}
      hitSlop={{ top: slop, bottom: slop }}
      style={({ pressed }) => [
        styles.chip,
        { height: h },
        active ? styles.chipActive : styles.chipRest,
        pressed && { transform: [{ scale: theme.motion.pressScale.button }] },
        style,
      ]}
    >
      {dot && (
        <View
          style={[styles.dot, { backgroundColor: active ? theme.colors.surface : TONE_FG[tone] }]}
        />
      )}
      <AppText
        role={density === 'expressive' ? 'body-sm' : 'caption'}
        weight="500"
        color={active ? theme.colors.surface : theme.colors['text-primary']}
        numberOfLines={1}
      >
        {children}
      </AppText>
    </Pressable>
  );
}

export interface BadgeProps {
  children: ReactNode;
  tone?: ChipTone;
  density?: 'expressive' | 'functional';
  style?: ViewStyle;
}

export function Badge({ children, tone = 'neutral', density = 'expressive', style }: BadgeProps) {
  return (
    <View
      style={[styles.badge, { height: HEIGHT[density], backgroundColor: TONE_BG[tone] }, style]}
    >
      <AppText
        role={density === 'expressive' ? 'body-sm' : 'caption'}
        weight="500"
        color={TONE_FG[tone]}
        numberOfLines={1}
      >
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: DOT,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  chipRest: {
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  chipActive: {
    backgroundColor: theme.colors['action-primary'],
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: theme.radius['r-pill'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
});
