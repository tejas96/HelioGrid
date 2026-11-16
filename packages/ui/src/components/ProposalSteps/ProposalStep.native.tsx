import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import {
  ProposalGenerationBlock,
  ProposalPriceBlock,
  ProposalSavingsBlock,
  ProposalSplitBlock,
} from '../ProposalBlocks/ProposalBlocks.native';
import { BankStep } from './BankStep.native';
import { ClientStep } from './ClientStep.native';
import { CompanyStep } from './CompanyStep.native';
import { ComponentsStep } from './ComponentsStep.native';
import { PerformanceStep } from './PerformanceStep.native';
import {
  type StepBodies,
  type StepHeroBlocks,
  stepBodyOf,
  stepControlsOf,
  stepHeroOf,
} from './ProposalSteps.logic';
import type { FieldMarks } from './ProposalSteps.shared.types';
import type { ProposalStepProps } from './ProposalSteps.types';
import { StepControls } from './StepControls.native';
import { StepNote, stepLayout } from './StepParts.native';
import { markedControls, markNotes } from './step-marks';
import { TermsStep } from './TermsStep.native';
import { TrackRecordStep } from './TrackRecordStep.native';

/** No field marked: Generate was not asked for, or nothing on this step blocks it. */
const NO_MARKS: FieldMarks = {};

const BODIES: StepBodies = {
  company: CompanyStep,
  achievements: TrackRecordStep,
  performance: PerformanceStep,
  components: ComponentsStep,
  terms: TermsStep,
  client: ClientStep,
  bank: BankStep,
};

const HERO_BLOCKS: StepHeroBlocks = {
  price: ProposalPriceBlock,
  generation: ProposalGenerationBlock,
  savings: ProposalSavingsBlock,
  split: ProposalSplitBlock,
};

/**
 * One step of the builder, by its view (`T-M06-003`–`T-M06-013`). While its read is out it draws
 * the shipped loading bars, and a read that failed says so with its retry; the frame around it
 * never waits on either (`M06-22`). Steps 3, 4, 5 and 7 open with the block the customer will
 * read, as the screen's one solar-glass hero.
 */
export function ProposalStep({
  wide,
  words,
  read,
  moved,
  updating,
  focusAfter,
  marks = NO_MARKS,
}: ProposalStepProps) {
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={focusAfter}
      />
    );
  }
  if (read.kind !== 'ready') {
    return (
      <View style={stepLayout.column}>
        <LoadingBars label={words.loading} bars={['panel', 'row', 'row', 'row']} />
      </View>
    );
  }
  const view = read.value;
  const hero = wide ? null : stepHeroOf(HERO_BLOCKS, view);
  const listed = stepControlsOf(view, words);
  const controls = listed === null ? null : markedControls(listed, marks);
  const notes = listed === null ? markNotes(marks) : [];
  return (
    <View style={stepLayout.column} key={view.step}>
      {moved === undefined ? null : <StepNote notice={moved} tone="warning" glyph="user" />}
      {hero === null ? null : (
        <View style={stepLayout.hero}>
          <View style={updating === undefined ? undefined : stepLayout.stale}>
            <HeroPanel>{hero}</HeroPanel>
          </View>
          {updating === undefined ? null : (
            <Text variant="caption" color="secondary" live>
              {updating}
            </Text>
          )}
        </View>
      )}
      {controls === null ? (
        <>
          {notes.length === 0 ? null : (
            <StepControls column controls={notes} shared={words} focusAfter={focusAfter} />
          )}
          {stepBodyOf(BODIES, view, { wide, shared: words, focusAfter })}
        </>
      ) : (
        <StepControls column controls={controls} shared={words} focusAfter={focusAfter} />
      )}
    </View>
  );
}
