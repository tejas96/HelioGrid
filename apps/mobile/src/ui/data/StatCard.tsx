import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * KPI card: overline label → 32dp/700 tabular value → delta pill. RN adaptations: the
 * ref's inline-SVG trend arrow becomes a border-drawn triangle (no react-native-svg
 * dependency yet); the meaning-bearing overline uses text-secondary per CLAUDE.md §Design
 * (text-tertiary is decorative-only); the ref's off-scale 10px gaps snap to the 4dp scale.
 */

const DELTA_H = 24;
const ARROW_HALF_W = 4;
const ARROW_H = 6;

export interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  deltaDir?: 'up' | 'down';
  children?: ReactNode;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaDir = 'up',
  children,
  style,
}: StatCardProps) {
  const good = deltaDir === 'up';
  const fg = good ? theme.colors.success : theme.colors.danger;
  return (
    <View style={[styles.card, style]}>
      {/* biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA */}
      <AppText
        role="overline"
        weight="700"
        color={theme.colors['text-secondary']}
        style={styles.overline}
      >
        {label}
      </AppText>
      <View style={styles.valueRow}>
        {/* biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA */}
        <AppText role="h1" weight="700" style={styles.value}>
          {value}
        </AppText>
        {unit != null && (
          // biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role, not ARIA
          <AppText role="body" color={theme.colors['text-secondary']}>
            {unit}
          </AppText>
        )}
      </View>
      {delta != null && (
        <View
          style={[
            styles.delta,
            { backgroundColor: good ? theme.colors['success-bg'] : theme.colors['danger-bg'] },
          ]}
        >
          <View
            style={[
              styles.arrow,
              good
                ? { borderBottomWidth: ARROW_H, borderBottomColor: fg }
                : { borderTopWidth: ARROW_H, borderTopColor: fg },
            ]}
          />
          <AppText role="caption" weight="500" color={fg}>
            {delta}
          </AppText>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    padding: theme.spacing['sp-6'],
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  overline: {
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing['sp-1'],
    marginTop: theme.spacing['sp-2'],
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  delta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    marginTop: theme.spacing['sp-3'],
    height: DELTA_H,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_HALF_W,
    borderRightWidth: ARROW_HALF_W,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
