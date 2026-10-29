import type { TranslatedText } from '@heliogrid/contracts';
import type { ResolvedStep } from './resolve-steps';
import { stepLabel } from './resolve-steps';
import type { StepperDensity, StepperStep, StepperWords } from './Stepper.types';

/** Where the flow stands. */
export interface StepperPosition {
  total: number;
  /** `current`, held inside the steps. */
  index: number;
  /** How far along the progress track is filled. */
  percent: number;
  /** The current step's name, or `''` when there are no steps. */
  stepName: TranslatedText | '';
}

export function stepperPosition(
  steps: readonly (StepperStep | TranslatedText)[],
  current: number,
): StepperPosition {
  const total = steps.length;
  const index = Math.max(0, Math.min(total - 1, current));
  const at = steps[index];
  return {
    total,
    index,
    percent: total > 1 ? ((index + 1) / total) * 100 : 100,
    stepName: at === undefined ? '' : stepLabel(at),
  };
}

/** The counter over the progress track: the step reached, of how many, and the flow's name. */
export function progressCounter(
  words: StepperWords,
  index: number,
  total: number,
  flow: TranslatedText | undefined,
): TranslatedText {
  return words.counter({ current: index + 1, total, ...(flow === undefined ? {} : { flow }) });
}

/** A step takes a press only when the flow can be stepped and the step is reachable. */
export function isStepClickable(step: ResolvedStep, steppable: boolean): boolean {
  return steppable && step.reachable;
}

/** The last step draws no connector to a next one. */
export function isLastStep(position: number, total: number): boolean {
  return position === total - 1;
}

/** The numbered strip's marker: 24 in the dense set, 28 otherwise. */
export function markerSizeFor(density: StepperDensity): number {
  return density === 'functional' ? 24 : 28;
}

/** The word beside a numbered step's name: its errors, else "optional", else none. */
export function numberedNote(step: ResolvedStep): 'errors' | 'optional' | null {
  if (step.state === 'errors') {
    return 'errors';
  }
  return step.optional === true ? 'optional' : null;
}

/** What the compact indicator bar shows and which of its arrows are off. */
export interface IndicatorFacts {
  total: number;
  /** The current step's name, or `''` past the end. */
  name: TranslatedText | '';
  /** How many steps are in `errors`. */
  errors: number;
  /** Back is always available, except on the first step or with nowhere to send it. */
  backOff: boolean;
  /** Next only enters a reachable step. */
  nextOff: boolean;
}

export function indicatorFacts(
  resolved: readonly ResolvedStep[],
  index: number,
  steppable: boolean,
): IndicatorFacts {
  const step = resolved[index];
  return {
    total: resolved.length,
    name: step === undefined ? '' : step.label,
    errors: resolved.filter((entry) => entry.state === 'errors').length,
    backOff: index === 0 || !steppable,
    nextOff: resolved[index + 1]?.reachable !== true || !steppable,
  };
}
