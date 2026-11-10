/**
 * What an inbox act says while the server has it, and the sentence it comes back with when it is
 * undone (`M02-67`, `F8-36`): each names the act that did not happen and why — someone else has
 * the lead, it is no longer one to act on, the person can no longer hold a lead, no answer came
 * (unconfirmed, never "failed"), or the catalog's words for the server's refusal — never the
 * server's own English. A bulk assign reports in one line.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { InboxActReturn, InboxActState } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { apiErrorMessageId, INTERNAL_ERROR } from './api-error';
import { assignPendingWords } from './assign-picker';
import { SHELL } from './shell';

type T = Translator['t'];

const ACTS = {
  junking: /*i18n*/ { id: 'Binning as junk…' },
  dismiss: /*i18n*/ { id: 'Dismiss' },
  assignGone: /*i18n*/ { id: 'Not assigned — this lead was closed or is no longer yours to give.' },
  assigneeGone: /*i18n*/ { id: 'Not assigned — {name} can no longer take leads.' },
  assignUnconfirmed: /*i18n*/ {
    id: 'Giving it to {name} is not confirmed — no answer came. Try again.',
  },
  assignRefused: /*i18n*/ { id: 'Not assigned — {reason}' },
  junkGone: /*i18n*/ { id: 'Not binned — this lead was closed or is no longer yours to bin.' },
  junkUnconfirmed: /*i18n*/ { id: 'Binning it is not confirmed — no answer came. Try again.' },
  junkRefused: /*i18n*/ { id: 'Not binned — {reason}' },
  bulkGiven: /*i18n*/ {
    id: '{count, plural, one {# lead given to {name}} other {# leads given to {name}}}',
  },
  bulkRefused: /*i18n*/ {
    id: "{count, plural, one {# couldn't be given — it stays, with the reason} other {# couldn't be given — they stay, with the reason}}",
  },
} as const;

/** The catalog's words for a refusal's code; a code it has none for reads as our side's failure. */
function reasonOf(t: T, why: Extract<InboxActReturn, { kind: 'refused' }>): TranslatedText {
  const id = apiErrorMessageId(why.code);
  return id === undefined ? t(INTERNAL_ERROR) : t({ id });
}

/** Why an assign to `name` came back undone, as one sentence. */
function assignReturned(t: T, name: string, why: InboxActReturn): TranslatedText {
  switch (why.kind) {
    case 'taken':
      return assignPendingWords(t).alreadyAssigned(why.owner);
    case 'unavailable':
      return t(ACTS.assignGone);
    case 'assignee_unavailable':
      return t(ACTS.assigneeGone, { name });
    case 'unanswered':
      return t(ACTS.assignUnconfirmed, { name });
    case 'refused':
      return t(ACTS.assignRefused, { reason: reasonOf(t, why) });
  }
}

/** Why a junk came back undone, as one sentence. */
function junkReturned(t: T, why: InboxActReturn): TranslatedText {
  switch (why.kind) {
    case 'unanswered':
      return t(ACTS.junkUnconfirmed);
    case 'refused':
      return t(ACTS.junkRefused, { reason: reasonOf(t, why) });
    default:
      return t(ACTS.junkGone);
  }
}

/** The line an act draws in its lead's card or row: what is being done, or why it came back. */
export function inboxActWords(t: T) {
  return {
    /** "Assigning to Rajesh Jadhav…" or "Binning as junk…" while out. */
    out: (act: InboxActState): TranslatedText =>
      act.assignee === null ? t(ACTS.junking) : assignPendingWords(t).assigning(act.assignee.name),
    /** The whole sentence an undone act comes back with. */
    returned: (act: InboxActState, why: InboxActReturn): TranslatedText =>
      act.assignee === null ? junkReturned(t, why) : assignReturned(t, act.assignee.name, why),
    retry: t(SHELL.tryAgain),
    dismiss: t(ACTS.dismiss),
  };
}

/** A bulk assign's report: how many went to whom, and how many stayed, each naming its reason. */
export interface BulkAssignReportFacts {
  readonly given: number;
  readonly refused: number;
  readonly name: string;
}

/**
 * A bulk assign's one toast — how many went to `name`, a caution with how many stayed when any
 * did — or none while there is no report. A fresh list each call: the screen holds it by its
 * report, since a new toast each render would restart its clock.
 */
export function bulkAssignToasts(t: T, report: BulkAssignReportFacts | null) {
  if (report === null) return [];
  const title = t(ACTS.bulkGiven, { count: report.given, name: report.name });
  if (report.refused === 0) return [{ id: 'bulk', tone: 'success' as const, title }];
  const description = t(ACTS.bulkRefused, { count: report.refused });
  return [{ id: 'bulk', tone: 'warning' as const, title, description }];
}
