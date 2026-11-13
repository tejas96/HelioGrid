/**
 * How an act on a lead that came back undone says why (`F8-36`), wherever the person acted — a
 * sheet, the dock, the qualify card, a contact row, a task, the assign picker or a search result:
 * the lead's standing refused it, the number may not be called, or no answer came.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import { LEAD_ACT_REFUSALS, type LeadActFailure, type LeadActRefusal } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { attemptFailureMessageId } from './api-error';
import { shownAsSent } from './assembled';

/** Why the lead's standing refused an act — the sentence names the act's lead, never a code. */
const REFUSAL: Record<LeadActRefusal, MessageRef> = {
  already_owner: /*i18n*/ { id: 'Not changed. This person has the lead already.' },
  lead_closed: /*i18n*/ { id: 'Not done. The lead is closed. Reopen it first.' },
  stage_reached: /*i18n*/ { id: 'Not done. The lead is already at this stage or past it.' },
  wake_date_not_future: /*i18n*/ { id: 'Not snoozed. Pick a day after today.' },
  reason_not_listed: /*i18n*/ { id: 'Not done. Pick one of the reasons.' },
  resurface_date_not_future: /*i18n*/ { id: 'Not done. Pick a day after today.' },
  not_snoozed: /*i18n*/ { id: 'Not woken. The lead is not snoozed any more.' },
  not_due: /*i18n*/ { id: 'Not done. Its day has not come yet.' },
  not_reopenable: /*i18n*/ { id: 'Not reopened. The lead is open already.' },
  not_postponed: /*i18n*/ { id: 'Not done. The lead is not postponed.' },
  /* A person meets it only on a won lead (`lifecycle-close.ts`): the sweep's own refusal is never said. */
  not_open: /*i18n*/ { id: 'Not done. This lead is already won — it is a project now.' },
};

/** A refusal this release does not know yet — a newer server's — said without naming a cause. */
const NOT_DONE = /*i18n*/ { id: 'Not done. The lead is not open.' };

/** A call-back asked for a number marked wrong or do-not-call (`M02-44`). */
const NOT_DIALLABLE = /*i18n*/ {
  id: 'No call-back added. This number is marked wrong or do-not-call.',
};

/** Why an act came back undone, said where the person acted. */
export function leadActFailureWords(t: Translator['t'], failed: LeadActFailure): TranslatedText {
  if (failed.kind === 'not_diallable') return t(NOT_DIALLABLE);
  if (failed.kind === 'refused') {
    const known = LEAD_ACT_REFUSALS.find((refusal) => refusal === failed.refusal);
    return t(known === undefined ? NOT_DONE : REFUSAL[known]);
  }
  const id = attemptFailureMessageId({ failure: failed.failure, code: failed.code });
  return id === undefined ? shownAsSent(failed.message) : t({ id });
}
