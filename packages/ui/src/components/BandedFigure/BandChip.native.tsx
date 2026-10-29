import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { bandChipBox, bandChipFace, bandChipFor } from './BandedFigure.logic';
import type { BandSpec, BandTone, BandToneStyle } from './BandedFigure.types';

/**
 * The mark is measured on the tint it sits on, against WCAG's 3:1 non-text floor — not against a
 * guess. success 3.28 · danger 3.43 · info 3.26 · neutral 3.93 all pass; `warning` measures 1.99
 * on `warning-bg`, so the warning mark takes `warning-text` (6.53 on tint).
 */
export const BAND_TONES: Record<BandTone, BandToneStyle> = {
  success: {
    fg: theme.colors['success-text'],
    bg: theme.colors['success-bg'],
    mark: theme.colors.success,
  },
  warning: {
    fg: theme.colors['warning-text'],
    bg: theme.colors['warning-bg'],
    mark: theme.colors['warning-text'],
  },
  danger: {
    fg: theme.colors['danger-text'],
    bg: theme.colors['danger-bg'],
    mark: theme.colors.danger,
  },
  info: { fg: theme.colors['info-text'], bg: theme.colors['info-bg'], mark: theme.colors.info },
  neutral: {
    fg: theme.colors['neutral-text'],
    bg: theme.colors['neutral-bg'],
    mark: theme.colors.neutral,
  },
};

interface NativeBandChipProps {
  band?: BandSpec | TranslatedText;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

interface ChipFaceProps {
  words: ReactNode;
  tone: BandTone;
  size: number;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: theme.radius['r-pill'],
    alignSelf: 'flex-start',
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    letterSpacing: -0.065,
  },
});

/** The verdict pill: word, mark, tint — in that order of importance. Shared with `StatCard.band`. */
export function BandChip({ band, size = 13, style }: NativeBandChipProps) {
  const face = bandChipFace(band);
  if (face === null) return null;
  return <ChipFace words={face.words} tone={face.tone} size={size} style={style} />;
}

/** The pill itself, around words already in the reader's language — a band's, or a host's. */
function ChipFace({ words, tone: name, size, style }: ChipFaceProps) {
  const tone = BAND_TONES[name];
  const box = bandChipBox(size);
  const shape: ViewStyle = {
    minHeight: box.height,
    paddingHorizontal: box.paddingX,
    backgroundColor: tone.bg,
  };
  const type: TextStyle = { fontSize: size, color: tone.fg };
  return (
    <View style={[styles.chip, shape, style]}>
      <View style={[styles.dot, { backgroundColor: tone.mark }]} />
      <Text style={[styles.label, type]}>{words}</Text>
    </View>
  );
}

/**
 * What a host's `band` prop runs through: a spec, a bare word, or a ready node. A bare word is the
 * host's words, typed by the host's own contract, drawn in the neutral pill.
 */
export function renderBand(
  spec?: BandSpec | TranslatedText | ReactNode,
  extra?: { size?: number },
): ReactNode {
  return bandChipFor(spec, (face) => (
    <ChipFace words={face.words} tone={face.tone} size={extra?.size ?? 13} />
  ));
}
