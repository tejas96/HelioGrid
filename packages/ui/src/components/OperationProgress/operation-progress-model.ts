import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type {
  CancelEffect,
  CancelWords,
  OperationCount,
  OperationProgressProps,
  OperationProgressWords,
  OperationStage,
  OperationStageState,
  OperationState,
} from './OperationProgress.types';

let warned = false;

/**
 * THE CANCEL HAS TO BE HONEST ABOUT WHAT IT STOPS. Two different acts wear the same button, so the
 * sentence beside it (`words.cancel`) is not optional chrome — it is the difference between a
 * cancel and a lie.
 *
 * An `onCancel` with no `cancelEffect` renders NO cancel and warns once — the same shape as
 * UsageMeter's "no denominator without a rate". A control that cannot say what it does is worse
 * than an absent one.
 */
export function resolveCancel(
  onCancel: (() => void) | undefined,
  cancelEffect: CancelEffect | undefined,
  words: OperationProgressWords,
): CancelWords | null {
  if (onCancel === undefined) {
    return null;
  }
  if (cancelEffect === undefined) {
    if (!warned) {
      warned = true;
      console.warn(
        'OperationProgress: onCancel needs cancelEffect ("stops-the-work" or "stops-watching"). A cancel that cannot say what it stops is not rendered.',
      );
    }
    return null;
  }
  return words.cancel[cancelEffect];
}

/**
 * NO FIGURE WITHOUT A RESOLVED VALUE — the same rule UsageMeter runs before any billing logic. An
 * indeterminate operation prints no percentage rather than a confident 0%.
 */
export function resolvePercent(
  state: OperationProgressProps['state'],
  value: number | null | undefined,
): number | null {
  if (state !== 'running') {
    return null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, value));
}

/**
 * "142 of 400 rows". Nothing without a finite total.
 *
 * The number renderer is passed IN — `useFormat().number`, the market's. It used to construct
 * a bare `new Intl.NumberFormat()`, which groups by the DEVICE's locale: an Indian tenant on a
 * US phone read `452,471` where every other figure on the screen read `4,52,471`. `F3-19` allows
 * exactly one number implementation and it is `@heliogrid/domain`'s.
 */
export function countWords(
  count: OperationCount | null | undefined,
  unit: string | undefined,
  formatCount: (value: number) => string,
  words: OperationProgressWords,
): TranslatedText | null {
  if (count === null || count === undefined || !Number.isFinite(count.total)) {
    return null;
  }
  const done = Number.isFinite(count.done) ? count.done : 0;
  return words.count(formatCount(done), formatCount(count.total), unit);
}

/** "Step 2 of 3", when the caller has both halves. */
export function stepWords(
  stageIndex: number | undefined,
  stageTotal: number | undefined,
  words: OperationProgressWords,
): TranslatedText | null {
  if (stageIndex === undefined || stageTotal === undefined) {
    return null;
  }
  return words.step(stageIndex, stageTotal);
}

/** The action row shows when there is a cancel, a destination, or a retry a failure earned. */
export function offersOperationActs({
  cancel,
  destination,
  state,
  onRetry,
  retryLabel,
}: Pick<OperationProgressProps, 'destination' | 'onRetry' | 'retryLabel'> & {
  cancel: CancelWords | null;
  state: OperationState;
}): boolean {
  return (
    cancel !== null ||
    destination !== undefined ||
    (state === 'failed' && onRetry !== undefined && retryLabel !== undefined)
  );
}

/** The cancel on offer while the work runs — the caller's own words before the effect's. */
export function offeredCancel(
  running: boolean,
  cancel: CancelWords | null,
  label: TranslatedText | undefined,
  note: ReactNode,
): { label: TranslatedText; note: ReactNode } | null {
  if (!running || cancel === null) {
    return null;
  }
  return { label: label ?? cancel.label, note: note ?? cancel.note };
}

/** The finishing sentence's mark: a fault, a stop, or a tick for work that finished. */
export function messageGlyph(state: OperationState): ShellGlyphName {
  return state === 'failed' ? 'alert-circle' : state === 'cancelled' ? 'minus-circle' : 'tick';
}

/**
 * What the narration line holds: whether there are words (the step, the stage, or both joined by a
 * middle dot) and whether the count follows. `null` when there is nothing to narrate.
 */
export function narrationShape(
  step: string | null,
  stage: ReactNode,
  counted: string | null,
): { narrates: boolean; joins: boolean } | null {
  const narrates = step !== null || stage !== undefined;
  if (!narrates && counted === null) {
    return null;
  }
  return { narrates, joins: step !== null && stage !== undefined };
}

/** A stage with no state of its own is the active one when first, and waiting after. */
export function stageStateAt(stage: OperationStage, index: number): OperationStageState {
  return stage.state ?? (index === 0 ? 'active' : 'waiting');
}

/** A label is the ring's own spoken name only when it is words; anything else is named by its id. */
export function ringSpokenName(label: ReactNode): string | undefined {
  return typeof label === 'string' ? label : undefined;
}
