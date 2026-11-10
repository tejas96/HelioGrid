import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { stageStepsOf } from './StageTrack.logic';
import type { StageStepStanding, StageTrackProps, StageTrackSize } from './StageTrack.types';

interface NativeStageTrackProps extends StageTrackProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * The eight-step funnel as segments (`M02-41`). One image to a screen reader, named by its step —
 * the segments inside are hidden, so eight bare views are never read one by one.
 */
export function StageTrack({ stage, size = 'sm', words, style }: NativeStageTrackProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={words.stepOf(stage)}
      style={[styles.track, TRACK[size], style]}
    >
      {stageStepsOf(stage).map((step) => (
        <View
          key={step.stage}
          importantForAccessibility="no"
          style={[styles.step, STEP[size], STANDING[step.standing]]}
        />
      ))}
    </View>
  );
}

/* The `md` bar is 6dp — its own height, which the 4dp scale has no step for. */
const styles = StyleSheet.create({
  track: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  step: { borderRadius: theme.radius['r-pill'] },
  sm: { gap: theme.spacing['sp-0-5'] },
  md: { gap: theme.spacing['sp-1'], alignSelf: 'stretch' },
  smStep: { width: theme.spacing['sp-2'], height: theme.spacing['sp-1'] },
  mdStep: { flex: 1, height: 6 },
  done: { backgroundColor: colors.ink },
  now: { backgroundColor: colors.accent },
  ahead: { backgroundColor: colors['canvas-sunken'] },
});

const TRACK: Record<StageTrackSize, ViewStyle> = { sm: styles.sm, md: styles.md };
const STEP: Record<StageTrackSize, ViewStyle> = { sm: styles.smStep, md: styles.mdStep };
const STANDING: Record<StageStepStanding, ViewStyle> = {
  done: styles.done,
  now: styles.now,
  ahead: styles.ahead,
};
