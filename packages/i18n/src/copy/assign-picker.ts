/**
 * The assign picker's words (`packages/ui`'s `AssignPickerWords`, `M02-28`, `M02-29`): what is being
 * given, each person's load, and the people read's own states — and, on Lead Detail, the line an
 * assign draws while it is out and why one came back undone (`LeadAssignPickerWords`).
 */
import type { LeadActFailure } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { leadActFailureWords } from './lead-act-failure';
import { SHELL } from './shell';

const PICKER = {
  title: /*i18n*/ { id: 'Give to' },
  oneLead: /*i18n*/ { id: '{name} · one tap assigns' },
  unnamedLead: /*i18n*/ { id: 'This lead · one tap assigns' },
  manyLeads: /*i18n*/ {
    id: '{count, plural, one {# lead · one tap assigns} other {# leads · one tap assigns}}',
  },
  you: /*i18n*/ { id: '{name} (you)' },
  open: /*i18n*/ { id: '{count, plural, one {# open} other {# open}}' },
  overdue: /*i18n*/ { id: '{count, plural, one {# overdue} other {# overdue}}' },
  holds: /*i18n*/ { id: 'Has it now' },
  loading: /*i18n*/ { id: 'Loading the team' },
  failedTitle: /*i18n*/ { id: "Couldn't load the team" },
  emptyTitle: /*i18n*/ { id: 'No one can take a lead yet' },
  emptyMessage: /*i18n*/ {
    id: 'Give someone a role that works leads, in Team, and they show here.',
  },
  assigning: /*i18n*/ { id: 'Assigning to {name}…' },
  alreadyWith: /*i18n*/ { id: 'Not assigned — {owner} has it already.' },
  alreadyTaken: /*i18n*/ { id: 'Not assigned — someone took it a moment ago.' },
} as const;

/**
 * What is being given: one lead — by its name, `null` while it has none — or a selection of
 * `count` leads from the inbox (`M02-29`).
 */
export type AssignPickerSubject = { readonly name: string | null } | { readonly count: number };

/** Every word `AssignPicker` says, for this lead or selection. */
export function assignPickerWords(t: Translator['t'], subject: AssignPickerSubject) {
  const subtitle =
    'count' in subject
      ? t(PICKER.manyLeads, { count: subject.count })
      : subject.name === null
        ? t(PICKER.unnamedLead)
        : t(PICKER.oneLead, { name: subject.name });
  return {
    title: t(PICKER.title),
    subtitle,
    close: t(SHELL.close),
    you: (name: string) => t(PICKER.you, { name }),
    open: (count: number) => t(PICKER.open, { count }),
    overdue: (count: number) => t(PICKER.overdue, { count }),
    holds: t(PICKER.holds),
    loading: t(PICKER.loading),
    failedTitle: t(PICKER.failedTitle),
    failedMessage: t(SHELL.keepsFailing),
    retry: t(SHELL.tryAgain),
    emptyTitle: t(PICKER.emptyTitle),
    emptyMessage: t(PICKER.emptyMessage),
  };
}

/**
 * The line an assign draws while it is out, and the sentence it comes back with when someone
 * assigned the lead first (`M02-67`) — for the caller's `PendingAction` line, in the picker's row
 * or on the lead's card.
 */
export function assignPendingWords(t: Translator['t']) {
  return {
    assigning: (name: string) => t(PICKER.assigning, { name }),
    alreadyAssigned: (owner: string | null) =>
      owner === null ? t(PICKER.alreadyTaken) : t(PICKER.alreadyWith, { owner }),
  };
}

/** Every word the owner chip's picker says on Lead Detail, for the lead named `name`. */
export function leadAssignPickerWords(t: Translator['t'], name: string | null) {
  return {
    picker: assignPickerWords(t, { name }),
    ...assignPendingWords(t),
    failure: (failure: LeadActFailure) => leadActFailureWords(t, failure),
  };
}
