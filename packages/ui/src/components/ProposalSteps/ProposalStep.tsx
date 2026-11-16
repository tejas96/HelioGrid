import { FailedRead } from '../EmptyState/FailedRead';
import { HeroPanel } from '../HeroPanel/HeroPanel';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import {
  ProposalGenerationBlock,
  ProposalPriceBlock,
  ProposalSavingsBlock,
  ProposalSplitBlock,
} from '../ProposalBlocks/ProposalBlocks';
import { BankStep } from './BankStep';
import { ClientStep } from './ClientStep';
import { CompanyStep } from './CompanyStep';
import { ComponentsStep } from './ComponentsStep';
import { PerformanceStep } from './PerformanceStep';
import {
  type StepBodies,
  type StepHeroBlocks,
  stepBodyOf,
  stepControlsOf,
  stepHeroOf,
} from './ProposalSteps.logic';
import type { FieldMarks } from './ProposalSteps.shared.types';
import type { ProposalStepProps } from './ProposalSteps.types';
import { StepControls } from './StepControls';
import { StepNote } from './StepParts';
import { markedControls, markNotes } from './step-marks';
import { TermsStep } from './TermsStep';
import { TrackRecordStep } from './TrackRecordStep';
import './ProposalSteps.css';
import './StepKinds.css';
import './StepRows.css';

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
 * never waits on either (`M06-22`). The phone opens steps 3, 4, 5 and 7 with the block the customer
 * will read, as the screen's one solar-glass hero; the desktop shows the document page beside the
 * step instead, so it draws none.
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
  if (read.kind === 'loading' || read.kind === 'empty') {
    return (
      <div className="hg-pst-step">
        <LoadingBars label={words.loading} bars={['panel', 'row', 'row', 'row']} />
      </div>
    );
  }
  if (read.kind === 'failed') {
    return (
      <div className="hg-pst-step">
        <FailedRead
          title={words.failedTitle}
          message={words.failedMessage}
          retryLabel={words.retry}
          onRetry={read.retry}
          focusAfter={focusAfter}
        />
      </div>
    );
  }
  const view = read.value;
  const hero = wide ? null : stepHeroOf(HERO_BLOCKS, view);
  const listed = stepControlsOf(view, words);
  const controls = listed === null ? null : markedControls(listed, marks);
  const notes = listed === null ? markNotes(marks) : [];
  return (
    <div className="hg-pst-step" key={view.step}>
      {moved === undefined ? null : <StepNote notice={moved} tone="warning" glyph="user" />}
      {hero === null ? null : (
        <div className="hg-pst-hero" data-updating={updating === undefined ? undefined : 'true'}>
          <HeroPanel>{hero}</HeroPanel>
          {updating === undefined ? null : (
            <span className="hg-pst-updating" role="status">
              {updating}
            </span>
          )}
        </div>
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
    </div>
  );
}
