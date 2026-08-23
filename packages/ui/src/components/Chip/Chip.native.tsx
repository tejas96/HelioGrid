import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { BadgeProps, ChipDensity, ChipProps, ChipTone } from './Chip.types';

/* The DS pill heights, the dot and the pill's inner gap — none of the three is on the 4px scale,
   so no theme token carries them. 44 is MIN_TOUCH_TARGET, the product's own floor. */
const PILL_H: Record<ChipDensity, number> = { expressive: 28, functional: 24 };
const DOT = 6;
const GAP = 6;

/** The dot's colour is the tone's `-text` partner — the only semantic colour that sets marks. */
const DOT_COLOR: Record<ChipTone, string> = {
  neutral: theme.colors['neutral-text'],
  success: theme.colors['success-text'],
  warning: theme.colors['warning-text'],
  danger: theme.colors['danger-text'],
  info: theme.colors['info-text'],
  accent: theme.colors.accent,
};

/* [0] sets the WORDS, so it is the -text partner. --accent stays plain: it measures 4.65:1 on
   --accent-subtle and clears the floor unaided. */
const BADGE: Record<ChipTone, { color: string; background: string }> = {
  neutral: { color: theme.colors['neutral-text'], background: theme.colors['neutral-bg'] },
  success: { color: theme.colors['success-text'], background: theme.colors['success-bg'] },
  warning: { color: theme.colors['warning-text'], background: theme.colors['warning-bg'] },
  danger: { color: theme.colors['danger-text'], background: theme.colors['danger-bg'] },
  info: { color: theme.colors['info-text'], background: theme.colors['info-bg'] },
  accent: { color: theme.colors.accent, background: theme.colors['accent-subtle'] },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: GAP,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  chipRest: { backgroundColor: theme.colors.surface, ...theme.elevation.e1 },
  chipActive: { backgroundColor: theme.colors['action-primary'] },
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['r-pill'] },
  target: { flexShrink: 0 },
});

/* The DS chip weight is --fw-medium, which the type scale's body-sm/caption roles do not carry;
   it rides on the Text primitive's style slot rather than in a second text component. */
const medium: TextStyle = { fontWeight: '500' };

function pillStyle(density: ChipDensity, extra: ViewStyle): ViewStyle {
  return { ...styles.pill, height: PILL_H[density], ...extra };
}

interface NativeChipProps extends ChipProps {
  /** `style` lands on the visible PILL in both forms, never on the target (Chip.d.ts). */
  style?: StyleProp<ViewStyle>;
}

interface NativeBadgeProps extends BadgeProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Fully-pill filter chip. Active = near-black fill.
 *
 * **With `onClick` it is a Pressable with a 44×44 hit box around the 28px (24px functional)
 * pill**, the extra height taken back as negative margin so no row grows. **Without `onClick` it
 * is a plain View** — not focusable, not announced as a button.
 */
export function Chip({
  children,
  active = false,
  onClick,
  dot = false,
  tone = 'neutral',
  density = 'expressive',
  style,
}: NativeChipProps) {
  const pill = (
    <View style={[pillStyle(density, active ? styles.chipActive : styles.chipRest), style]}>
      {dot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: active ? theme.colors['text-inverse'] : DOT_COLOR[tone] },
          ]}
        />
      ) : null}
      <Text
        variant={density === 'expressive' ? 'body-sm' : 'caption'}
        color={active ? 'inverse' : 'primary'}
        style={medium}
      >
        {children}
      </Text>
    </View>
  );

  if (onClick === undefined) return pill;

  /* Pressable owns the 44px floor; the negative margin gives the extra height back to the row. */
  return (
    <Pressable
      onPress={onClick}
      style={[styles.target, { marginVertical: (PILL_H[density] - MIN_TOUCH_TARGET) / 2 }]}
    >
      {pill}
    </Pressable>
  );
}

/** Tinted semantic badge — semantic bg + `-text` partner. Never interactive; always a View. */
export function Badge({
  children,
  tone = 'neutral',
  density = 'expressive',
  style,
}: NativeBadgeProps) {
  const pair = BADGE[tone];
  return (
    <View style={[pillStyle(density, { backgroundColor: pair.background }), style]}>
      <Text
        variant={density === 'expressive' ? 'body-sm' : 'caption'}
        style={[medium, { color: pair.color }]}
      >
        {children}
      </Text>
    </View>
  );
}
