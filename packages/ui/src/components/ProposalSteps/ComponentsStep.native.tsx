import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ProgressRing } from '../ProgressRing/ProgressRing.native';
import { ProposalPartsBlock } from '../ProposalBlocks/ProposalBlocks.native';
import type { ComponentsStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine } from './StepParts.native';

/** The fraction printed inside the ring: a mark between two counts, not a word. */
const OF = '/';

/**
 * Step 8 (`M06-27`, `T-M06-010`): the ring that counts the kinds picked, then one tile per kind —
 * the proposal's own parts block, in which an empty kind says so in words and opens its picker.
 */
export function ComponentsStep({
  view,
  shared,
}: {
  view: ComponentsStepView;
  shared: ProposalStepWords;
}) {
  const { words, picked, required } = view;
  return (
    <>
      <View style={styles.ring}>
        <ProgressRing
          size="sm"
          share={required === 0 ? 0 : picked / required}
          value={`${picked}${OF}${required}`}
          caption={words.ring}
          spokenName={words.ring}
        />
        <View style={styles.words}>
          <Text variant="body" bold>
            {words.title}
          </Text>
          <Text variant="body-sm" color="secondary">
            {words.line}
          </Text>
        </View>
      </View>
      <FieldSaveLine save={view.saves?.components} words={shared} />
      <ProposalPartsBlock mode="app" {...view.parts} />
    </>
  );
}

const styles = StyleSheet.create({
  ring: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-4'] },
  words: { flex: 1, minWidth: 0 },
});
