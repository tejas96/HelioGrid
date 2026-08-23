import type {
  CancelEffect,
  OperationCount,
  OperationProgressProps,
} from './OperationProgress.types';

export interface CancelCopy {
  label: string;
  note: string;
}

/**
 * THE CANCEL HAS TO BE HONEST ABOUT WHAT IT STOPS. Two different acts wear the same button, so the
 * sentence beside it is not optional chrome — it is the difference between a cancel and a lie.
 */
export const CANCEL_COPY: Record<CancelEffect, CancelCopy> = {
  'stops-the-work': { label: 'Cancel', note: 'Stops the work — nothing further is computed.' },
  'stops-watching': { label: 'Stop watching', note: 'The work keeps running on the server.' },
};

let warned = false;

/**
 * An `onCancel` with no `cancelEffect` renders NO cancel and warns once — the same shape as
 * UsageMeter's "no denominator without a rate". A control that cannot say what it does is worse
 * than an absent one.
 */
export function resolveCancel(
  onCancel: (() => void) | undefined,
  cancelEffect: CancelEffect | undefined,
): CancelCopy | null {
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
  return CANCEL_COPY[cancelEffect];
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

/** "142 of 400 rows". Nothing without a finite total. */
export function countWords(
  count: OperationCount | null | undefined,
  unit: string | undefined,
): string | null {
  if (count === null || count === undefined || !Number.isFinite(count.total)) {
    return null;
  }
  const format = new Intl.NumberFormat();
  const suffix = unit === undefined ? '' : ` ${unit}`;
  const done = Number.isFinite(count.done) ? count.done : 0;
  return `${format.format(done)} of ${format.format(count.total)}${suffix}`;
}

/** "Step 2 of 3", when the caller has both halves. */
export function stepWords(
  stageIndex: number | undefined,
  stageTotal: number | undefined,
): string | null {
  if (stageIndex === undefined || stageTotal === undefined) {
    return null;
  }
  return `Step ${stageIndex} of ${stageTotal}`;
}
