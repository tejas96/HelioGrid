import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { hueTintOf, isCategoryHue } from '../Avatar/Avatar.logic';
import type { BadgeProps, BadgeTone, ChipDensity, ChipProps, ChipTone } from './Chip.types';

/* The DS pill heights, the dot and the pill's inner gap — none of the three is on the 4px scale,
   so no theme token carries them. 44 is MIN_TOUCH_TARGET, the product's own floor. */
const PILL_H: Record<ChipDensity, number> = { expressive: 28, functional: 24 };
const DOT = 6;
const GAP = 6;

/** The dot's colour is the tone's `-text` partner — the only semantic colour that sets marks. */
const DOT_COLOR: Record<ChipTone, ThemeColor> = {
  neutral: colors['neutral-text'],
  success: colors['success-text'],
  warning: colors['warning-text'],
  danger: colors['danger-text'],
  info: colors['info-text'],
  accent: colors.accent,
};

/* [0] sets the WORDS, so it is the -text partner. --accent stays plain: it measures 4.65:1 on
   --accent-subtle and clears the floor unaided. Neutral has no tint to carry it — `neutral-bg` on
   a tile is ~1.01:1 — so it has no background here and takes the control fill. */
const BADGE: Record<ChipTone, { color: ThemeColor; background?: ThemeColor }> = {
  neutral: { color: colors['neutral-text'] },
  success: { color: colors['success-text'], background: colors['success-bg'] },
  warning: { color: colors['warning-text'], background: colors['warning-bg'] },
  danger: { color: colors['danger-text'], background: colors['danger-bg'] },
  info: { color: colors['info-text'], background: colors['info-bg'] },
  accent: { color: colors.accent, background: colors['accent-subtle'] },
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
  /* The chip in force is the accent wash, as every chosen filter is. Its edge is the wash itself,
     the same width as the resting hairline, so choosing a chip never changes its width. */
  chipActive: {
    backgroundColor: colors['accent-subtle'],
    borderWidth: 1,
    borderColor: colors['accent-subtle'],
  },
  /* A kind with nothing in it stays, quiet: a hairline pill on no fill. */
  chipEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors['line-soft'] },
  rest: { borderWidth: 1, borderColor: colors['line-soft'] },
  count: {
    minWidth: theme.spacing['sp-5'],
    height: theme.spacing['sp-5'],
    marginRight: -theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['line-tile'],
  },
  /* On the wash the slot is an outline in the accent: no fill the phone can mix reads there. */
  countActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  countWords: { fontFamily: theme.type.families.mono, fontVariant: ['tabular-nums'] },
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['r-pill'] },
  /* The pill's shape on the target too: Android draws no square ripple under a round pill. */
  target: { flexShrink: 0, borderRadius: theme.radius['r-pill'] },
});

/* The chosen chip's words: the accent words on the accent wash. */
const onWash: TextStyle = { color: colors['accent-text'] };

/** The chip in force is the accent wash; a kind with nothing in it a quiet hairline; else the fill. */
function chipFill(active: boolean, count: number | undefined, controlFill: ThemeColor): ViewStyle {
  if (active) return styles.chipActive;
  if (count === 0) return styles.chipEmpty;
  return { ...styles.rest, backgroundColor: controlFill };
}

/* The DS chip weight is --fw-medium, which the type scale's body-sm/caption roles do not carry;
   it rides on the Text primitive's style slot rather than in a second text component. */
const medium: TextStyle = { fontWeight: '500' };
/* The design system's iris weight. The theme holds no 600 weight token, so it is written as
   the number. */
const hueWeight: TextStyle = { fontWeight: '600' };

/**
 * A label's drawn height is a floor, so at a larger text size its words grow the pill instead of
 * clipping. A pressable pill keeps it fixed: its target gives back exactly the difference, and a
 * grown pill would draw over the rows above and below it.
 */
function pillStyle(density: ChipDensity, extra: ViewStyle, pressable = false): ViewStyle {
  const height = pressable ? { height: PILL_H[density] } : { minHeight: PILL_H[density] };
  return { ...styles.pill, ...height, ...extra };
}

interface NativeChipProps extends ChipProps {
  /** `style` lands on the visible PILL in both forms, never on the target (Chip.d.ts). */
  style?: StyleProp<ViewStyle>;
}

interface NativeBadgeProps extends BadgeProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Fully-pill filter chip. Active = the accent wash; a `count` rides after the words.
 *
 * **With `onClick` it is a Pressable with a 44×44 hit box around the 28px (24px functional)
 * pill**, the extra height taken back as negative margin so no row grows. **Without `onClick` it
 * is a plain View** — not focusable, not announced as a button.
 */
export function Chip({
  children,
  active = false,
  count,
  onClick,
  dot = false,
  tone = 'neutral',
  density = 'expressive',
  style,
}: NativeChipProps) {
  /* The opposite of what holds it (`F7-15`), flat whether it is a label or pressable. */
  const { controlFill } = useGround();
  const pill = (
    <View
      style={[
        pillStyle(density, chipFill(active, count, controlFill), onClick !== undefined),
        style,
      ]}
    >
      {dot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: active ? colors['accent-text'] : DOT_COLOR[tone] },
          ]}
        />
      ) : null}
      <Text
        variant={density === 'expressive' ? 'body-sm' : 'caption'}
        color={count === 0 && !active ? 'secondary' : 'primary'}
        style={active ? [medium, onWash] : medium}
      >
        {children}
      </Text>
      {count === undefined ? null : (
        <View style={[styles.count, active ? styles.countActive : undefined]}>
          <Text
            variant="caption"
            color="secondary"
            style={active ? [styles.countWords, onWash] : styles.countWords}
          >
            {String(count)}
          </Text>
        </View>
      )}
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

/** A tone's words and wash: an iris tone mixes its hue, every other tone reads `BADGE`. */
function badgePair(tone: BadgeTone): { color: ThemeColor; background?: ThemeColor } {
  if (!isCategoryHue(tone)) return BADGE[tone];
  const tint = hueTintOf(tone);
  return { color: tint.fg, background: tint.bg };
}

/**
 * Tinted semantic badge — semantic bg + `-text` partner. Never interactive; always a View. An iris
 * tone takes Avatar's iris rule (`hueTintOf`), so a role and a face share one mix.
 */
export function Badge({
  children,
  tone = 'neutral',
  density = 'expressive',
  style,
}: NativeBadgeProps) {
  const pair = badgePair(tone);
  const { controlFill } = useGround();
  return (
    <View style={[pillStyle(density, { backgroundColor: pair.background ?? controlFill }), style]}>
      <Text
        variant={density === 'expressive' ? 'body-sm' : 'caption'}
        style={[isCategoryHue(tone) ? hueWeight : medium, { color: pair.color }]}
      >
        {children}
      </Text>
    </View>
  );
}
