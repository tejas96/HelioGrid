import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import type { UsageFill, UsageScale } from './usage-meter-model';

const FILL: Record<UsageFill, string> = {
  accent: theme.colors.accent,
  info: theme.colors.info,
  /* --warning-text, not --warning: the plain token measures 2.17:1 as a mark, under the 3:1 floor. */
  warning: theme.colors['warning-text'],
  neutral: theme.colors.neutral,
};

interface NativeUsageMeterTrackProps {
  scale: UsageScale;
  height: number;
  accessibilityLabel: string;
  valueText: string;
  value: number;
  limit: number;
}

/**
 * The track. M12-35 — overage accrues VISIBLY, so 100% is not the end of the scale: the track
 * re-scales, the beyond-bundle portion is its own lighter segment, and the bundle line is marked.
 * The 80% warning is a TICK, not a colour change alone (BM-34).
 */
export function UsageMeterTrack({
  scale,
  height,
  accessibilityLabel,
  valueText,
  value,
  limit,
}: NativeUsageMeterTrackProps) {
  /* The tick and the overage edge are cut-outs: the ground showing through the track. */
  const { ground } = useGround();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: value, min: 0, max: Math.max(limit, value), text: valueText }}
      style={[styles.track, { height }]}
    >
      <View style={{ width: `${scale.usedPct}%`, backgroundColor: FILL[scale.fill] }} />
      {scale.overPct > 0 ? (
        <View style={[styles.over, { width: `${scale.overPct}%`, borderLeftColor: ground }]} />
      ) : null}
      {scale.threshold > 0 && scale.threshold < 100 ? (
        <View style={[styles.tick, { left: `${scale.threshold}%`, backgroundColor: ground }]} />
      ) : null}
      {scale.overPct > 0 && scale.limitMark < 100 ? (
        <View style={[styles.bundleMark, { left: `${scale.limitMark}%` }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'relative',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  /* The overage segment is a separate, lighter-weight fill: visible, not shouted. */
  over: {
    backgroundColor: theme.colors.info,
    opacity: 0.55,
    borderLeftWidth: 2,
  },
  tick: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    width: 2,
    opacity: 0.9,
  },
  bundleMark: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    width: 2,
    backgroundColor: theme.colors['text-primary'],
    opacity: 0.35,
  },
});
