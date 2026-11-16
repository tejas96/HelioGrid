import { theme } from '@heliogrid/theme';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { GlyphInkContext, ShellGlyph } from '../AppShell/ShellGlyph.native';
import { hueTintOf, isCategoryHue } from '../Avatar/Avatar.logic';
import type { BadgeProps, BadgeTone, ChipDensity, ChipProps, ChipTone } from './Chip.types';

/* The pill heights are tokens but a pick's; the dot and the pill's inner gap are not on the 4px
   scale, so no theme token carries them. 44 is MIN_TOUCH_TARGET, the product's own floor. */
const PILL_H: Record<ChipDensity, number> = {
  filter: theme.layout['filter-chip-h'],
  expressive: theme.layout['chip-h'],
  functional: theme.layout['badge-h'],
  pick: 36,
};
const DOT = 6;
const GAP = 6;

/* [0] sets the WORDS, so it is the -text partner. --accent stays plain: it measures 4.65:1 on
   --accent-subtle and clears the floor unaided. Neutral has no tint to carry it — `neutral-bg` on
   a tile is ~1.01:1 — so it has no background here and takes the control fill. */
const BADGE: Record<ChipTone, { color: ThemeColor; background?: ThemeColor }> = {
  neutral: { color: TONE.neutral.ink },
  success: { color: TONE.success.ink, background: TONE.success.tint },
  warning: { color: TONE.warning.ink, background: TONE.warning.tint },
  danger: { color: TONE.danger.ink, background: TONE.danger.tint },
  info: { color: TONE.info.ink, background: TONE.info.tint },
  accent: { color: TONE.accent.ink, background: TONE.accent.tint },
};

const styles = StyleSheet.create({
  /** A mark before the words takes two of the leading edge back. */
  lead: { paddingLeft: theme.spacing['sp-2'] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: GAP,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  /* The chip in force is OneOhm's quiet choice: an ink outline the same width as the resting
     hairline, so choosing a chip never changes its width; the fill stays the control's. */
  chipActive: {
    borderWidth: 1,
    borderColor: colors['text-primary'],
  },
  /* A kind with nothing in it stays, quiet: a hairline pill on no fill. */
  chipEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors['line-soft'] },
  rest: { borderWidth: 1, borderColor: colors['line-soft'] },
  /* A pick: the strong hairline at rest, the ink ring in force. */
  pickRest: { borderWidth: 1.5, borderColor: colors['line-strong'] },
  pickActive: { borderWidth: 1.5, borderColor: colors['text-primary'] },
  pickPad: { paddingHorizontal: theme.spacing['sp-4'] },
  countWords: { fontFamily: theme.type.families.mono, fontVariant: ['tabular-nums'] },
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['r-pill'] },
  /* The pill's shape on the target too: Android draws no square ripple under a round pill. */
  target: { flexShrink: 0, borderRadius: theme.radius['r-pill'] },
  /* OneOhm's badge: one height and the label's size at either density, radius 8; the neutral one
     drawn inside a hairline, as its outline badge is. */
  badge: {
    minHeight: theme.layout['badge-h'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-badge'],
  },
  badgeOutline: { borderWidth: 1, borderColor: colors['line-soft'] },
});

/* The chosen chip's words and count: ink. */
const inForce: TextStyle = { color: colors['text-primary'] };

/** A pick's own edge: the strong hairline at rest, the ink ring in force; other densities none. */
function pickLook(density: ChipDensity, active: boolean) {
  if (density !== 'pick') return undefined;
  return [styles.pickPad, active ? styles.pickActive : styles.pickRest];
}

/** The chip in force is an ink outline; a kind with nothing in it a quiet hairline; else the fill. */
function chipFill(active: boolean, count: number | undefined, controlFill: ThemeColor): ViewStyle {
  if (active) return { ...styles.chipActive, backgroundColor: controlFill };
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
 * Fully-pill filter chip. Active = an ink outline; a `count` rides after the words.
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
  glyph,
  leading,
  groupName,
  style,
}: NativeChipProps) {
  /* The opposite of what holds it (`F7-15`), flat whether it is a label or pressable. */
  const { controlFill } = useGround();
  const pill = (
    <View
      style={[
        pillStyle(density, chipFill(active, count, controlFill), onClick !== undefined),
        pickLook(density, active),
        glyph !== undefined || (leading !== undefined && leading !== null)
          ? styles.lead
          : undefined,
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: TONE[tone].ink }]} /> : null}
      {glyph === undefined ? null : <ShellGlyph name={glyph} size="sm" />}
      {leading}
      <Text
        variant={density === 'functional' ? 'caption' : 'body-sm'}
        color={count === 0 && !active ? 'secondary' : 'primary'}
        style={active ? [medium, inForce] : medium}
      >
        {children}
      </Text>
      {count === undefined ? null : (
        <Text
          variant="caption"
          color="secondary"
          style={active ? [styles.countWords, inForce] : styles.countWords}
        >
          {String(count)}
        </Text>
      )}
    </View>
  );

  if (onClick === undefined) return pill;

  /* Pressable owns the 44px floor; the negative margin gives the extra height back to the row. */
  return (
    <Pressable
      onPress={onClick}
      accessibilityHint={groupName}
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
  glyph,
  style,
}: NativeBadgeProps) {
  const pair = badgePair(tone);
  const { controlFill } = useGround();
  return (
    <View
      style={[
        pillStyle(density, { backgroundColor: pair.background ?? controlFill }),
        styles.badge,
        pair.background === undefined ? styles.badgeOutline : undefined,
        style,
      ]}
    >
      {glyph === undefined ? null : (
        <GlyphInkContext.Provider value={pair.color}>
          <ShellGlyph name={glyph} size="sm" />
        </GlyphInkContext.Provider>
      )}
      <Text
        variant="caption"
        style={[isCategoryHue(tone) ? hueWeight : medium, { color: pair.color }]}
      >
        {children}
      </Text>
    </View>
  );
}
