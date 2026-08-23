import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BandChip } from './BandChip.native';
import type { BandSpec, BandToneStyle } from './BandedFigure.types';

const type = theme.type.roles;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    overflow: 'hidden',
    position: 'relative',
  },
  cardPad: { padding: 22, gap: 9, ...theme.elevation.e2 },
  boxPad: { padding: 26, gap: theme.spacing['sp-3'], ...theme.elevation.e3 },
  /* The inspector's box reads as one instrument: a tint band down its leading edge is the only
     non-word channel it adds, and the word still carries the verdict. */
  edge: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 5 },
  overline: {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    letterSpacing: type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.colors['text-tertiary'],
  },
  figureRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  value: {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    letterSpacing: -1.2,
    color: theme.colors['text-primary'],
  },
  unit: { fontFamily: theme.type.families.sans, color: theme.colors['text-secondary'] },
  bound: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    lineHeight: 17.4,
    color: theme.colors['text-tertiary'],
  },
  remedyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  remedy: { fontFamily: theme.type.families.sans, fontWeight: '500', flexShrink: 1 },
  note: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    lineHeight: 18,
    color: theme.colors['text-tertiary'],
  },
});

function RemedyGlyph({ color }: { color: string }) {
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginTop: 2 }}
    >
      <Path d="M5 12h13M13 6l6 6-6 6" stroke={color} />
    </Svg>
  );
}

export interface BandedCardProps {
  label: string;
  shown: string;
  unit?: string;
  band: BandSpec | null;
  tone: BandToneStyle;
  move?: ReactNode;
  bound?: ReactNode;
  note?: ReactNode;
  provenance: ReactNode;
  /** The whole read-out — label, figure, band word and remedy as ONE announcement. Spelled the
   *  package's cross-platform way (`Pressable.types.ts`), so the web half's `aria-label` and the
   *  native half's `accessibilityLabel` are visibly the same declaration and not two dialects. */
  accessibilityLabel: string;
  /** `box` is `M05-64`'s compliance box — the figure an electrical inspector checks. */
  big: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** One size table per variant, so the render reads as one branch rather than seven. */
const SIZES = {
  card: { pad: styles.cardPad, overline: 11, unit: 15, chip: 13, remedy: 13, remedyLine: 19.5 },
  box: { pad: styles.boxPad, overline: 12, unit: 18, chip: 14, remedy: 14, remedyLine: 21 },
};

const VALUE_TYPE: Record<'card' | 'box', TextStyle> = {
  card: { fontSize: 32, lineHeight: 34 },
  box: { fontFamily: theme.type.families.mono, fontSize: 44, lineHeight: 46 },
};

/** The `card` and `box` variants — the standalone block, and the inspector's instrument. */
export function BandedCard({
  label,
  shown,
  unit,
  band,
  tone,
  move,
  bound,
  note,
  provenance,
  accessibilityLabel,
  big,
  children,
  style,
}: BandedCardProps) {
  const size = big ? SIZES.box : SIZES.card;
  const remedyType: TextStyle = {
    fontSize: size.remedy,
    lineHeight: size.remedyLine,
    color: tone.fg,
  };
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={[styles.card, size.pad, style]}>
      {big ? <View style={[styles.edge, { backgroundColor: tone.mark }]} /> : null}
      <Text style={[styles.overline, { fontSize: size.overline }]}>{label}</Text>
      <View style={styles.figureRow}>
        <View style={styles.figure}>
          <Text style={[styles.value, VALUE_TYPE[big ? 'box' : 'card']]}>{shown}</Text>
          {unit !== undefined ? (
            <Text style={[styles.unit, { fontSize: size.unit }]}>{unit}</Text>
          ) : null}
        </View>
        {band !== null ? <BandChip band={band} size={size.chip} /> : null}
      </View>
      {bound !== undefined ? <Text style={styles.bound}>{bound}</Text> : null}
      {/* The remedy: a sentence, in the fault's own block, never a tint on its own. */}
      {move !== undefined && move !== null ? (
        <View style={styles.remedyRow}>
          <RemedyGlyph color={tone.fg} />
          <Text style={[styles.remedy, remedyType]}>{move}</Text>
        </View>
      ) : null}
      {provenance}
      {note !== undefined ? <Text style={styles.note}>{note}</Text> : null}
      {children}
    </View>
  );
}
