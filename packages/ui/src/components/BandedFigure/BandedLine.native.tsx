import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { BandChip } from './BandChip.native';
import type { BandSpec } from './BandedFigure.types';

export interface BandedLineProps {
  label: string;
  shown: string;
  unit?: string;
  band: BandSpec | null;
  /** The band's remedy, or the host's override of it. */
  move?: ReactNode;
  /** The whole read-out — label, figure, band word and remedy as ONE announcement. Spelled the
   *  package's cross-platform way (`Pressable.types.ts`), so the web half's `aria-label` and the
   *  native half's `accessibilityLabel` are visibly the same declaration and not two dialects. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 6 },
  label: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles['body-sm'].fontSize,
    color: theme.colors['text-secondary'],
  },
  value: {
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.body.fontSize,
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
  remedy: {
    width: '100%',
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.caption.fontSize,
    lineHeight: 17.4,
    color: theme.colors['text-secondary'],
  },
});

/**
 * The `line` variant — a figure and its band in a row, inside a panel. The whole row is one
 * accessible node so the label, the figure, the band's word and the remedy are announced together.
 */
export function BandedLine({
  label,
  shown,
  unit,
  band,
  move,
  accessibilityLabel,
  style,
}: BandedLineProps) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={[styles.line, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {shown}
        {unit !== undefined ? ` ${unit}` : ''}
      </Text>
      {band !== null ? <BandChip band={band} size={12} /> : null}
      {move !== undefined && move !== null ? <Text style={styles.remedy}>{move}</Text> : null}
    </View>
  );
}
