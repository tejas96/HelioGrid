import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { UsageBillingState } from './UsageMeter.types';
import { UsageMeterTrack } from './UsageMeterTrack.native';
import type { UsageLineTone } from './usage-meter-model';
import { usageScale, usageStatusLine } from './usage-meter-model';

const LINE_TONE: Record<UsageLineTone, string> = {
  danger: theme.colors['danger-text'],
  warning: theme.colors['warning-text'],
  info: theme.colors['info-text'],
};

export interface UsageMeterMeteredProps {
  label: string;
  value: number;
  limit: number;
  unit?: string;
  period?: string;
  bundleName?: string;
  billing: UsageBillingState;
  thresholdPercent: number;
  graceDaysLeft?: number;
  note?: string;
  trackHeight: number;
  format: (value: number) => string;
  provenance: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The reporting meter: figure over denominator, the re-scaling track, BM-27's persistent
 * provenance line, and one status sentence carrying the whole billing situation in words.
 */
export function UsageMeterMetered({
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
  const scale = usageScale(value, limit, thresholdPercent, billing);
  const line = usageStatusLine(billing, scale, format, unit, bundleName, graceDaysLeft);
  const unitSuffix = unit === undefined ? '' : ` ${unit}`;
  const beyond = scale.overage > 0 ? `, ${format(scale.overage)} beyond the bundle` : '';

  return (
    <View style={[styles.shell, style]}>
      <View style={styles.head}>
        <Text style={labelStyle}>{label}</Text>
        <Text variant="mono" style={figure}>
          {format(value)}
          <Text variant="mono" color="tertiary">{` of ${format(limit)}${unitSuffix}`}</Text>
        </Text>
      </View>

      <UsageMeterTrack
        scale={scale}
        height={trackHeight}
        accessibilityLabel={`${label}${period === undefined ? '' : `, ${period}`}`}
        valueText={`${format(value)} of ${format(limit)}${unitSuffix}${beyond}`}
        value={value}
        limit={limit}
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
