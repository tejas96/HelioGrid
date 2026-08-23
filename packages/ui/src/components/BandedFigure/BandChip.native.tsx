import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
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
  band?: BandSpec | string;
  size?: number;
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
  const spec = typeof band === 'string' ? { label: band, tone: 'neutral' as const } : band;
  if (spec === undefined || spec.label === '') return null;
  const tone = BAND_TONES[spec.tone ?? 'neutral'];
  const shape: ViewStyle = {
    minHeight: size + 13,
    paddingHorizontal: Math.round(size * 0.8),
    backgroundColor: tone.bg,
  };
  const type: TextStyle = { fontSize: size, color: tone.fg };
  return (
    <View style={[styles.chip, shape, style]}>
      <View style={[styles.dot, { backgroundColor: tone.mark }]} />
      <Text style={[styles.label, type]}>{spec.label}</Text>
    </View>
  );
}

/** What a host's `band` prop runs through: a spec, a bare word, or a ready node. */
export function renderBand(
  spec?: BandSpec | string | ReactNode,
  extra?: { size?: number },
): ReactNode {
  if (spec === undefined || spec === null || spec === false) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return <BandChip band={{ label: spec }} {...extra} />;
  if (typeof spec === 'object' && 'label' in spec) {
    return <BandChip band={spec as BandSpec} {...extra} />;
  }
  return null;
}
