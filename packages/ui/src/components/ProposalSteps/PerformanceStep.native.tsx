import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { HueTile } from '../HueTile/HueTile.native';
import type { PerformanceStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { performanceControls } from './performance-controls';
import { StepControls } from './StepControls.native';
import { LinkAct, StepNote, stepLayout } from './StepParts.native';

function FilledCard({ view }: { view: PerformanceStepView }) {
  const { words, fill } = view;
  const fallback = fill !== 'source';
  return (
    <View
      style={[styles.auto, fallback ? styles.autoFallback : undefined]}
      accessibilityLiveRegion="polite"
    >
      <HueTile
        glyph={fill === 'built_in' ? 'cloud-off' : 'sun'}
        hue={fallback ? 'neutral' : 'teal'}
        size={36}
      />
      <View style={styles.words}>
        <Text variant="body" bold>
          {words.fillTitle}
        </Text>
        <Text variant="body-sm" color="secondary">
          {words.fillLine}
        </Text>
      </View>
      {fill === 'filling' ? null : (
        <LinkAct glyph="retry" label={words.refill} onPress={view.onRefill} />
      )}
    </View>
  );
}

/**
 * Step 4 (`M06-10`, `T-M06-006`): the figures fill themselves from the source of record, and the
 * card says where they came from and offers Reset. The person changes the efficiency, or a month
 * they know better — and a size changed since is said, never silently applied (`T-M06-033`).
 */
export function PerformanceStep({
  view,
  shared,
  focusAfter,
}: {
  view: PerformanceStepView;
  shared: ProposalStepWords;
  focusAfter: FocusAfter;
}) {
  return (
    <View style={stepLayout.column}>
      {view.capacityChanged === undefined ? null : (
        <StepNote notice={view.capacityChanged} tone="warning" glyph="alert-triangle" />
      )}
      <FilledCard view={view} />
      <StepControls
        controls={performanceControls(view, shared)}
        shared={shared}
        focusAfter={focusAfter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  auto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingLeft: theme.spacing['sp-4'],
    paddingRight: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-lg'],
    backgroundColor: colors['hue-teal-bg'],
  },
  autoFallback: { backgroundColor: TONE.neutral.tint },
  words: { flex: 1, minWidth: 0 },
});
