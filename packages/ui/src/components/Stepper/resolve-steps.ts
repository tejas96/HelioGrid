import type { TranslatedText } from '@heliogrid/contracts';
import type { StepperStep, StepperWords, StepReachability, StepState } from './Stepper.types';

export interface ResolvedStep extends StepperStep {
  state: StepState;
  reachable: boolean;
}

/** `entered` — the OPT-IN gate: done, in-progress and errors reachable, not-started not. */
const ENTERED: Record<StepState, boolean> = {
  done: true,
  'in-progress': true,
  errors: true,
  'not-started': false,
};

/** A bare string step is its own label. */
export function stepLabel(step: StepperStep | TranslatedText): TranslatedText {
  return typeof step === 'string' ? step : step.label;
}

/** Before = done, at = in-progress, after = not-started. `errors` no index can imply. */
function deriveState(declared: StepState | undefined, index: number, current: number): StepState {
  if (declared !== undefined) {
    return declared;
  }
  if (index < current) {
    return 'done';
  }
  return index === current ? 'in-progress' : 'not-started';
}

/**
 * An explicit per-step flag wins; then the mode; and an errored step is reachable in every mode —
 * surfacing a problem and blocking the route to it is the worst of both.
 */
function deriveReachable(
  declared: boolean | undefined,
  state: StepState,
  reachability: StepReachability,
): boolean {
  if (typeof declared === 'boolean') {
    return declared;
  }
  return reachability === 'entered' ? ENTERED[state] : true;
}

/** Fills in each step's state from `current`, and marks which are reachable under `reachability`. */
export function resolveSteps(
  steps: readonly (StepperStep | TranslatedText)[] = [],
  current = 0,
  reachability: StepReachability = 'free',
): ResolvedStep[] {
  return steps.map((step, index) => {
    const base: StepperStep = typeof step === 'string' ? { label: step } : { ...step };
    const state = deriveState(base.state, index, current);
    return { ...base, state, reachable: deriveReachable(base.reachable, state, reachability) };
  });
}

/**
 * State is never carried by colour alone (F7-12) — each state has a glyph AND a word: "3 to fix" on
 * an errored step that counts them, otherwise the state's own word.
 */
export function stateWord(step: ResolvedStep, words: StepperWords): TranslatedText {
  return words.state(stateFactsOf(step));
}

/** The state an optional step reads — "Done · optional". */
export function rowStateWord(step: ResolvedStep, words: StepperWords): TranslatedText {
  return step.optional === true ? words.stateOptional(stateFactsOf(step)) : stateWord(step, words);
}

/** A step's whole accessible name — "Step 2 of 5, Roof, in progress". */
export function spokenStep(
  step: ResolvedStep,
  position: number,
  total: number,
  words: StepperWords,
): TranslatedText {
  return words.spokenStep({
    ...stateFactsOf(step),
    current: position + 1,
    total,
    name: step.label,
  });
}

function stateFactsOf(step: ResolvedStep) {
  return step.errorCount === undefined
    ? { state: step.state }
    : { state: step.state, errorCount: step.errorCount };
}
