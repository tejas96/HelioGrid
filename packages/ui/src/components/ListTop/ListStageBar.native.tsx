import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { stageBarOpacityOf, stageBarPartsOf } from './ListTop.logic';
import type { ListSummaryProps } from './ListTop.types';

type Stages = NonNullable<ListSummaryProps['stages']>;

/** The stages as one thin bar under the summary on the phone: each stage with a lead, its share. */
export function ListStageBar({ stages }: { stages: Stages }) {
  return (
    <View
      style={styles.bar}
      accessible
      accessibilityRole="image"
      accessibilityLabel={stages.words.heading}
    >
      {stageBarPartsOf(stages.stages).map((part, index) => (
        <View
          key={part.stage}
          style={[styles.part, { flexGrow: part.count, opacity: stageBarOpacityOf(index) }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: theme.spacing['sp-1'] },
  part: {
    flexBasis: 0,
    height: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.accent,
  },
});
