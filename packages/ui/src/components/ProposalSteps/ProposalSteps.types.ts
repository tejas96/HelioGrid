import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type {
  BankStepView,
  ClientStepView,
  CompanyStepView,
  ComponentsStepView,
  FinancialsStepView,
  PaymentStepView,
  PerformanceStepView,
  SystemStepView,
  TermsStepView,
  TimelineStepView,
  TrackRecordStepView,
} from './ProposalSteps.parts.types';
import type { FieldMarks, StepNotice } from './ProposalSteps.shared.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';

export type * from './ProposalSteps.parts.types';
export type * from './ProposalSteps.shared.types';

/**
 * The builder's eleven steps (`M06-07`–`M06-17`, `T-M06-003`–`T-M06-013`), drawn from one view per
 * step. A view is what the pair's `packages/data` hook assembles: the values the step shows, its
 * words, and one callback per commit. A field commits when it is left (`M06-25`) and says what its
 * commit came to; nothing here saves, computes a money figure or decides a rule.
 *
 * Money a person TYPES travels as the major-unit number in the field; every figure a person READS
 * is the server's own text, inside the proposal block the step shows (`F4-04`).
 */

export type ProposalStepView =
  | CompanyStepView
  | TrackRecordStepView
  | SystemStepView
  | PerformanceStepView
  | FinancialsStepView
  | TimelineStepView
  | PaymentStepView
  | ComponentsStepView
  | TermsStepView
  | ClientStepView
  | BankStepView;

export interface ProposalStepProps {
  /** The desktop form: the stage beside the step shows the page, so the step draws no hero. */
  readonly wide: boolean;
  readonly words: ProposalStepWords;
  /** The step's view as its read stands: loading draws the loading bars, failed its retry. */
  readonly read: Read<ProposalStepView>;
  /** The lead moved to another person while the draft was open (`T-M06-023`). */
  readonly moved?: StepNotice;
  /**
   * A save is out and the step's hero figures are about to move: the word that says so —
   * `Updating…`. The hero then reads as stale, never as current (`T-M06-005`, `F8-12`).
   */
  readonly updating?: TranslatedText;
  /** Where focus lands once *Try again* has gone: the step's title, which stays while it reloads. */
  readonly focusAfter: FocusAfter;
  /** The fields the checklist names on this step, once Generate was asked for (`T-M06-022`). */
  readonly marks?: FieldMarks;
}
