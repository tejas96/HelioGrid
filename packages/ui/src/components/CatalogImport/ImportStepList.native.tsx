import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { StepList } from '../Stepper/StepList.native';
import type { CatalogImportWords } from './CatalogImport.types';

/** The steps *Back* reaches from: Columns and Preview, one step at a time. */
const BACK_FROM_STEPS: readonly number[] = [1, 2];

interface ImportStepListProps {
  open: boolean;
  words: CatalogImportWords;
  step: number;
  onClose: () => void;
  /** The step before the current one, opened from the list: the head's *Back*. */
  onBack: () => void;
}

/**
 * *Where you are* (m17-e): the location line's sheet over the wizard — every step with its state
 * in a word, only the steps already entered reachable, and the line saying the report opens after
 * the run.
 */
export function ImportStepList({ open, words, step, onClose, onBack }: ImportStepListProps) {
  const choose = (index: number) => {
    if (index === step - 1 && BACK_FROM_STEPS.includes(step)) onBack();
    else onClose();
  };
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      inset
      panelAbove={720}
      size="auto"
      density="functional"
      title={words.whereYouAre}
      showClose
      zIndex={50}
    >
      <View style={styles.steps}>
        <StepList
          steps={stepsReachable(words, step)}
          current={step}
          reachability="entered"
          label={words.stepsLabel}
          onStepClick={choose}
        />
        <Text variant="caption" color="secondary" align="center">
          {words.reportAfterRun}
        </Text>
      </View>
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  steps: { gap: theme.spacing['sp-3'] },
});

/**
 * The list offers what *Back* does — the one step before Columns or Preview — and no other: a step
 * further back is entered, but the wizard returns one step at a time.
 */
function stepsReachable(words: CatalogImportWords, step: number) {
  return words.steps.map((label, index) => ({
    label,
    reachable: index === step - 1 && BACK_FROM_STEPS.includes(step),
  }));
}
