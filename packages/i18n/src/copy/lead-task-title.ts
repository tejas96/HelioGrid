import type { TranslatedText } from '@heliogrid/contracts';
import { TASK_KINDS, type TaskKind } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { TASK_KIND_WORD } from './crm-vocabulary';

type T = Translator['t'];

/** What a task's words are chosen from, as every task list reads it. */
export interface TaskTitleFacts {
  readonly kind: string;
  readonly title: string | null;
  /** What raised it; a customer's answer words its task, its title then the link's name. */
  readonly provenance?: string;
}

const ANSWER_TASK = {
  confirmWon: /*i18n*/ { id: 'Confirm won' },
  confirmWonNamed: /*i18n*/ { id: 'Confirm won · {who}' },
  declined: /*i18n*/ { id: 'Customer declined — call, then mark lost or share again' },
  declinedNamed: /*i18n*/ { id: '{who} declined — call, then mark lost or share again' },
} as const;

/**
 * A task's words: a customer's answer names the next act with the link's name, else its kind's, or
 * a custom task's own as typed; a kind a newer server learned as sent.
 */
export function leadTaskTitle(t: T, task: TaskTitleFacts): TranslatedText {
  const who = task.title;
  if (task.provenance === 'proposal_accepted') {
    return who === null ? t(ANSWER_TASK.confirmWon) : t(ANSWER_TASK.confirmWonNamed, { who });
  }
  if (task.provenance === 'proposal_declined') {
    return who === null ? t(ANSWER_TASK.declined) : t(ANSWER_TASK.declinedNamed, { who });
  }
  if (task.title !== null) return shownAsSent(task.title);
  const kind = TASK_KINDS.find((known): known is TaskKind => known === task.kind);
  return kind === undefined ? shownAsSent(task.kind.replace(/_/g, ' ')) : t(TASK_KIND_WORD[kind]);
}
