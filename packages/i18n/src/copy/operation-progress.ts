/**
 * The `OperationProgress` words the component composes itself (`packages/ui`'s
 * `OperationProgressWords`): each cancel's button and the honest sentence beside it, the count, the
 * step, the phone's rail name and each stage's state. The work's own name is the caller's.
 */
import type { Translator } from '../runtime';

const OPERATION_PROGRESS = {
  cancel: /*i18n*/ { id: 'Cancel' },
  stopsTheWork: /*i18n*/ { id: 'Stops the work — nothing further is computed.' },
  stopWatching: /*i18n*/ { id: 'Stop watching' },
  keepsRunning: /*i18n*/ { id: 'The work keeps running on the server.' },
  count: /*i18n*/ { id: '{done} of {total}' },
  countOf: /*i18n*/ { id: '{done} of {total} {unit}' },
  step: /*i18n*/ { id: 'Step {step} of {total}' },
  inProgress: /*i18n*/ { id: '{label}, in progress' },
  done: /*i18n*/ { id: 'done' },
  running: /*i18n*/ { id: 'running' },
  notStarted: /*i18n*/ { id: 'not started' },
  stageSpoken: /*i18n*/ { id: '{label}, {state}' },
} as const;

/** Every word `OperationProgress` composes, in the reader's language. */
export function operationProgressWords(t: Translator['t']) {
  return {
    cancel: {
      'stops-the-work': {
        label: t(OPERATION_PROGRESS.cancel),
        note: t(OPERATION_PROGRESS.stopsTheWork),
      },
      'stops-watching': {
        label: t(OPERATION_PROGRESS.stopWatching),
        note: t(OPERATION_PROGRESS.keepsRunning),
      },
    },
    count: (done: string, total: string, unit?: string) =>
      unit === undefined
        ? t(OPERATION_PROGRESS.count, { done, total })
        : t(OPERATION_PROGRESS.countOf, { done, total, unit }),
    step: (step: number, total: number) => t(OPERATION_PROGRESS.step, { step, total }),
    inProgress: (label: string) => t(OPERATION_PROGRESS.inProgress, { label }),
    stageState: {
      done: t(OPERATION_PROGRESS.done),
      active: t(OPERATION_PROGRESS.running),
      waiting: t(OPERATION_PROGRESS.notStarted),
    },
    stageSpoken: (label: string, state: string) =>
      t(OPERATION_PROGRESS.stageSpoken, { label, state }),
  };
}
