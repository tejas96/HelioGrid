import type { TenantSegment } from '@heliogrid/domain';
import type { ExplainerProps } from '../Explainer/Explainer.types';

/** One kind of business as its card says it. */
export interface SetupWhatYouSellOption {
  value: TenantSegment;
  title: string;
  description: string;
}

/** Every word the screen draws; `@heliogrid/i18n`'s `setupWhatYouSellWords` writes them. */
export interface SetupWhatYouSellWords {
  /** The question; after a failed save, what went wrong. */
  title: string;
  /** Why the step asks; after a failed save, what was kept — behind the ask. */
  explainer: ExplainerProps;
  /** What fixes a failed save — with the title and the ask, one block in the title's place. */
  failure: string | null;
  /** The option group's visible name. */
  group: string;
  options: readonly SetupWhatYouSellOption[];
  groupError: string | null;
  /** What to type, read before the field. */
  sizeHelper: string;
  sizeLabel: string;
  unit: string;
  /** Where the size comes from — beside its tier. */
  sizeSource: string;
  sizeError: string | null;
  primary: string;
  /** Why the primary cannot be pressed yet. */
  waiting: string | null;
  /** The way on that leaves the step for later; drawn only after a failed save. */
  secondary: string | null;
  /** The one line at the act. */
  actLine: string | null;
}

/**
 * The second setup step (`SCR-M01-04`, `M01-23`): who the company sells to, and its typical system
 * size, both on one screen with one way on. Nothing is saved before the primary; an undeclared size
 * is an empty field under its tier line, which belongs to the field and not to the figure.
 */
export interface SetupWhatYouSellProps {
  words: SetupWhatYouSellWords;
  /** The kind chosen, or none yet. */
  segment: TenantSegment | null;
  onChooseSegment: (segment: TenantSegment) => void;
  /** The size declared, in kWp, or none yet. */
  typicalSystemKwp: number | null;
  onDeclareSize: (kwp: number) => void;
  /** The answers are being saved. */
  saving: boolean;
  /**
   * How many times the primary was refused. Each new refusal is answered once at the first question
   * `words` marks: the web moves focus there, the phone says its error. The count and the words
   * that mark the question arrive in the same render — a count that rises first is answered by
   * nothing, and is not answered again.
   */
  refusals: number;
  /** Saves both answers: the primary, whichever word it carries. */
  onContinue: () => void;
  /** Leaves the step for later. */
  onFinishLater: () => void;
}
