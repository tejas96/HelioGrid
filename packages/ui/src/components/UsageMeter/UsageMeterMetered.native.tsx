import { theme } from '@heliogrid/theme';
import type { ReactNode, RefObject } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { UsageMeterTrack } from './UsageMeterTrack.native';
import type { UsageLineTone } from './usage-meter-model';
import { meteredReading, type UsageMeterMeteredFacts } from './usage-meter-model';

const LINE_TONE: Record<UsageLineTone, string> = {
  danger: theme.colors['danger-text'],
  warning: theme.colors['warning-text'],
  info: theme.colors['info-text'],
};

export interface UsageMeterMeteredProps extends UsageMeterMeteredFacts {
  frame: RefObject<View | null>;
  trackHeight: number;
  provenance: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The reporting meter: figure over denominator, the re-scaling track, BM-27's persistent
 * provenance line, and one status sentence carrying the whole billing situation in words.
 */
export function UsageMeterMetered({
  frame,
  words,
  label,
  value,
  limit,
  unit,
  period,
  bundleName,
  billing,
  thresholdPercent,
  graceDaysLeft,
  note,
  trackHeight,
  format,
  provenance,
  style,
}: UsageMeterMeteredProps) {
  const { scale, line, trackName, valueText } = meteredReading({
    words,
    label,
    value,
    limit,
    unit,
    period,
    bundleName,
    billing,
    thresholdPercent,
    graceDaysLeft,
    format,
  });

  return (
    <View ref={frame} style={[styles.shell, style]}>
      <View style={styles.head}>
        <Text style={labelStyle}>{label}</Text>
        <Text variant="mono" style={figure}>
          {format(value)}
          <Text variant="mono" color="tertiary">
            {' '}
            {words.ofLimit(format(limit), unit)}
          </Text>
        </Text>
      </View>

      <UsageMeterTrack
        scale={scale}
        height={trackHeight}
        accessibilityLabel={trackName}
        valueText={valueText}
        value={value}
      />

      {/* Period, tier and bundle are the three things BM-27 requires beside the number. */}
      {provenance}

      {line !== null ? (
        <Text variant="caption" style={[statusLine, { color: LINE_TONE[line.tone] }]}>
          {line.words}
        </Text>
      ) : null}
      {note !== undefined ? (
        <Text variant="caption" color="tertiary">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const labelStyle: TextStyle = {
  fontSize: 14,
  fontWeight: '500',
  letterSpacing: -0.14,
  color: theme.colors['text-primary'],
};

const figure: TextStyle = { fontWeight: '700' };
const statusLine: TextStyle = { fontWeight: '500' };

const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
});
