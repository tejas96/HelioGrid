/**
 * `Stepper`'s own words (`packages/ui`'s `StepperWords`): the counter, each step's state and its
 * spoken name, the fallback names of a list and a bar, and the compact bar's arrows and count —
 * authored once for both platforms. A step's place, name and state are one whole message, never a
 * sentence joined from parts.
 */
import type { MessageRef, Translator } from '../runtime';
import { FILTER_PANEL } from './filter-panel';

/** The four states a step can be in — `packages/ui`'s `StepState`. */
type StepState = 'not-started' | 'in-progress' | 'done' | 'errors';

const STEPPER = {
  steps: /*i18n*/ { id: 'Steps' },
  progress: /*i18n*/ { id: 'Progress' },
  counter: /*i18n*/ { id: 'Step {current} of {total}' },
  counterNamed: /*i18n*/ { id: '{flow} · Step {current} of {total}' },
  optional: /*i18n*/ { id: 'Optional' },
  stateOptional: /*i18n*/ { id: '{state} · optional' },
  toFix: /*i18n*/ { id: '{count} to fix' },
  spokenToFix: /*i18n*/ { id: 'Step {current} of {total}, {name}, {count} to fix' },
  previousStep: /*i18n*/ { id: 'Previous step' },
  nextStep: /*i18n*/ { id: 'Next step' },
  indicator: /*i18n*/ { id: '{current} of {total}, {name}' },
  indicatorToFix: /*i18n*/ { id: '{current} of {total}, {name}, {errors} to fix' },
} as const;

/** A step's state as drawn under its name. */
const STATE: Record<StepState, MessageRef> = {
  done: FILTER_PANEL.done,
  'in-progress': /*i18n*/ { id: 'In progress' },
  errors: /*i18n*/ { id: 'Needs fixing' },
  'not-started': /*i18n*/ { id: 'Not started' },
};

/** A step's whole accessible name, by its state. */
const SPOKEN: Record<StepState, MessageRef> = {
  done: /*i18n*/ { id: 'Step {current} of {total}, {name}, done' },
  'in-progress': /*i18n*/ { id: 'Step {current} of {total}, {name}, in progress' },
  errors: /*i18n*/ { id: 'Step {current} of {total}, {name}, needs fixing' },
  'not-started': /*i18n*/ { id: 'Step {current} of {total}, {name}, not started' },
};

interface StateFacts {
  readonly state: StepState;
  readonly errorCount?: number;
}

/** An errored step that counts what is wrong says how many, rather than its state's word. */
function toFixOf(facts: StateFacts): number | null {
  return facts.state === 'errors' && facts.errorCount !== undefined && facts.errorCount > 0
    ? facts.errorCount
    : null;
}

/** Every word `Stepper` and `StepList` draw or speak on their own — their `words` prop. */
export function stepperWords(t: Translator['t']) {
  const state = (facts: StateFacts) => {
    const count = toFixOf(facts);
    return count === null ? t(STATE[facts.state]) : t(STEPPER.toFix, { count });
  };
  return {
    steps: t(STEPPER.steps),
    progress: t(STEPPER.progress),
    counter: (facts: {
      readonly current: number;
      readonly total: number;
      readonly flow?: string;
    }) =>
      facts.flow === undefined
        ? t(STEPPER.counter, { ...facts })
        : t(STEPPER.counterNamed, { ...facts }),
    state,
    stateOptional: (facts: StateFacts) => t(STEPPER.stateOptional, { state: state(facts) }),
    optional: t(STEPPER.optional),
    spokenStep: (
      facts: StateFacts & {
        readonly current: number;
        readonly total: number;
        readonly name: string;
      },
    ) => {
      const count = toFixOf(facts);
      return count === null
        ? t(SPOKEN[facts.state], { ...facts })
        : t(STEPPER.spokenToFix, { ...facts, count });
    },
    previousStep: t(STEPPER.previousStep),
    nextStep: t(STEPPER.nextStep),
    toFix: (count: number) => t(STEPPER.toFix, { count }),
    spokenIndicator: (facts: {
      readonly current: number;
      readonly total: number;
      readonly name: string;
      readonly errors: number;
    }) =>
      facts.errors > 0
        ? t(STEPPER.indicatorToFix, { ...facts })
        : t(STEPPER.indicator, { ...facts }),
  };
}
