import { Text } from '../../primitives/Text/Text';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { StepList } from '../Stepper';
import type { CatalogImportWords } from './CatalogImport.types';
import './ImportFoot.css';

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
 * *Where you are* (m17-e): the 375 location line's sheet — every step with its state in a word,
 * only the steps already entered reachable, and the line saying the report opens after the run.
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
      panelAbove={720}
      size="auto"
      density="functional"
      title={words.whereYouAre}
      showClose
      zIndex={50}
    >
      <div className="hg-import-steps">
        <StepList
          steps={stepsReachable(words, step)}
          current={step}
          reachability="entered"
          label={words.stepsLabel}
          words={words.stepper}
          onStepClick={choose}
        />
        <Text variant="caption" color="secondary" align="center">
          {words.reportAfterRun}
        </Text>
      </div>
    </EditorSurface>
  );
}

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
