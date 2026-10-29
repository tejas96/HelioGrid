/**
 * A run of coach marks (`CoachMarkSequence`, `packages/ui`'s `CoachMarkSequenceWords`): the counter
 * over each mark, the forward act, the last mark's close and the dismiss — the first-run run's own
 * words (`SHELL`), so a sequence and a first-run mark say the same thing.
 */
import type { Translator } from '../runtime';
import { SHELL } from './shell';

const COACH_MARK = {
  dismiss: /*i18n*/ { id: 'Dismiss' },
} as const;

/** Every word a run of marks draws or speaks, in the reader's language. */
export function coachMarkSequenceWords(t: Translator['t']) {
  return {
    counter: (step: number, total: number) => t(SHELL.markCount, { step, total }),
    next: t(SHELL.next),
    done: t(SHELL.gotIt),
    dismiss: t(COACH_MARK.dismiss),
  };
}
