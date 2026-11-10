/**
 * Customer Merge's words (`SCR-M02-06`, `M02-59`…`M02-63`): every message the screen says, the
 * words its states share — finding the other record, the waits, the calm done — and why a pair
 * cannot merge. A pair's words, chosen by its facts, are `customer-merge-pair.ts`.
 */
import type { MergeField, MergeMove, MergeUnavailable } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { SHELL } from './shell';

type T = Translator['t'];

export const CUSTOMER_MERGE = {
  title: /*i18n*/ { id: 'Merge customers' },
  chooseSummary: /*i18n*/ { id: 'Step 1 of 2 · nothing changes yet' },
  confirmTitle: /*i18n*/ { id: 'Confirm merge' },
  confirmSummary: /*i18n*/ { id: 'Step 2 of 2 · read it once, then merge' },
  pageSummary: /*i18n*/ { id: 'One family, two records. Nothing changes until you merge.' },
  cancel: /*i18n*/ { id: 'Cancel' },
  cancelSpoken: /*i18n*/ { id: 'Cancel. Nothing changes' },
  backToChoices: /*i18n*/ { id: 'Back to the choices' },
  findTitle: /*i18n*/ { id: 'Find the other record' },
  findLine: /*i18n*/ { id: 'Search by name, phone or city. Only customers in your list show.' },
  searchPlaceholder: /*i18n*/ { id: 'Name, phone or city' },
  clearSearch: /*i18n*/ { id: 'Clear search' },
  searching: /*i18n*/ { id: 'Searching…' },
  noMatch: /*i18n*/ { id: 'No other customer matches “{query}”.' },
  searchFailed: /*i18n*/ { id: 'Couldn’t search' },
  otherRecord: /*i18n*/ { id: 'Pick a different record' },
  loading: /*i18n*/ { id: 'Reading both records…' },
  readFailed: /*i18n*/ { id: 'Couldn’t read the two records' },
  whichStays: /*i18n*/ { id: 'Which record stays?' },
  stays: /*i18n*/ { id: 'Stays' },
  mergesIn: /*i18n*/ { id: 'Merges in' },
  pickEach: /*i18n*/ { id: 'Pick one of each' },
  pickedCount: /*i18n*/ { id: '{picked} of {total} picked' },
  pickOne: /*i18n*/ { id: 'Pick one' },
  picked: /*i18n*/ { id: 'Picked' },
  noName: /*i18n*/ { id: 'No name yet' },
  noCity: /*i18n*/ { id: 'No city yet' },
  from: /*i18n*/ { id: 'From {name}' },
  numberKept: /*i18n*/ { id: 'The other number is not lost: it stays as a contact.' },
  same: /*i18n*/ { id: 'Same on both, nothing to pick: {fields}' },
  needsUpdate: /*i18n*/ {
    id: 'These two differ on a detail this version cannot show. Update the app to merge them.',
  },
  pickMore: /*i18n*/ {
    id: '{count, plural, one {Pick # more to merge} other {Pick # more to merge}}',
  },
  leftToPick: /*i18n*/ {
    id: '{count, plural, one {# left to pick: {fields}} other {# left to pick: {fields}}}',
  },
  allPicked: /*i18n*/ { id: 'All picked. Read it once, then merge.' },
  review: /*i18n*/ { id: 'Review the merge' },
  movesHeading: /*i18n*/ { id: 'What moves over' },
  movesInto: /*i18n*/ { id: 'Into {name}' },
  movedHeading: /*i18n*/ { id: 'What moved over' },
  contactKept: /*i18n*/ { id: '{phone} stays as a contact' },
  leadsKept: /*i18n*/ { id: 'Each lead keeps its stage and owner.' },
  oneHistory: /*i18n*/ { id: 'One history, in time order' },
  none: /*i18n*/ { id: 'None' },
  tombstone: /*i18n*/ {
    id: '{loser} becomes a merged record that points to {survivor}. It is never deleted; old links still open the right customer.',
  },
  noMoney: /*i18n*/ { id: 'No money changes.' },
  noMoneyLine: /*i18n*/ { id: 'Proposals, payments and totals stay exactly as they are.' },
  cannotUndo: /*i18n*/ { id: 'This cannot be undone.' },
  yourChoices: /*i18n*/ { id: 'Your choices' },
  merge: /*i18n*/ { id: 'Merge the two customers' },
  merging: /*i18n*/ { id: 'Merging…' },
  notMerged: /*i18n*/ { id: 'Not merged. {reason}' },
  refusedOutOfScope: /*i18n*/ {
    id: 'One of these records is no longer in your list. Nothing changed.',
  },
  refusedMerged: /*i18n*/ { id: 'One of these records was merged a moment ago. Nothing changed.' },
  refusedChoices: /*i18n*/ {
    id: 'These records changed since you looked. Check the picks again.',
  },
  refusedGone: /*i18n*/ { id: 'One of these records is gone. Nothing changed.' },
  merged: /*i18n*/ { id: 'Merged.' },
  mergedLine: /*i18n*/ { id: '{loser} now points to {survivor}.' },
  mergedBy: /*i18n*/ { id: 'By you at {time} · on the timeline and in the audit log' },
  openCustomer: /*i18n*/ { id: 'Open customer' },
  backToLeads: /*i18n*/ { id: 'Back to leads' },
  goBack: /*i18n*/ { id: 'Go back' },
  unavailable: /*i18n*/ { id: 'Merge not available' },
  outsideTitle: /*i18n*/ { id: 'You can merge only records you can see.' },
  outsideHeld: /*i18n*/ {
    id: 'The other record is with {holder}. Someone who can see both, like the owner, can merge them.',
  },
  outsideUnheld: /*i18n*/ {
    id: 'The other record waits unassigned, outside your list. Someone who can see both, like the owner, can merge them.',
  },
  outsideRecord: /*i18n*/ { id: 'A lead outside your list' },
  outsideWith: /*i18n*/ { id: 'With {holder}' },
  outsideNoOwner: /*i18n*/ { id: 'No owner yet' },
  mergedTitle: /*i18n*/ { id: 'One of these records was already merged.' },
  mergedAlreadyLine: /*i18n*/ {
    id: 'It now points to another customer, so there is nothing left to merge here.',
  },
  goneTitle: /*i18n*/ { id: 'One of these customers is not here.' },
  goneLine: /*i18n*/ { id: 'It may have been removed, or the link is out of date.' },
} as const;

/** Each field the compare asks a pick for, by name (`M02-60`). */
export const MERGE_FIELD_WORD = {
  name: /*i18n*/ { id: 'Name' },
  city: /*i18n*/ { id: 'City' },
  primary_contact: /*i18n*/ { id: 'Primary contact' },
} as const satisfies Record<MergeField, { id: string }>;

/** Each kind of record a merge moves (`M02-63`). */
export const MERGE_MOVE_WORD = {
  contacts: /*i18n*/ { id: 'Contacts' },
  leads: /*i18n*/ { id: 'Leads' },
  activities: /*i18n*/ { id: 'Timeline entries' },
  referrals: /*i18n*/ { id: 'Referral links' },
  visits: /*i18n*/ { id: 'Visit bookings' },
  tasks: /*i18n*/ { id: 'Tasks' },
  files: /*i18n*/ { id: 'Files' },
} as const satisfies Record<MergeMove, { id: string }>;

/** The words every state of the screen shares: titles, the find step, the waits, the ways out. */
export function customerMergeWords(t: T) {
  const w = CUSTOMER_MERGE;
  return {
    title: t(w.title),
    chooseSummary: t(w.chooseSummary),
    confirmTitle: t(w.confirmTitle),
    confirmSummary: t(w.confirmSummary),
    pageSummary: t(w.pageSummary),
    cancel: t(w.cancel),
    cancelSpoken: t(w.cancelSpoken),
    backToChoices: t(w.backToChoices),
    find: {
      title: t(w.findTitle),
      line: t(w.findLine),
      placeholder: t(w.searchPlaceholder),
      clear: t(w.clearSearch),
      searching: t(w.searching),
      noMatch: (query: string) => t(w.noMatch, { query }),
      failed: t(w.searchFailed),
      otherRecord: t(w.otherRecord),
    },
    loading: t(w.loading),
    readFailed: t(w.readFailed),
    tryAgain: t(SHELL.tryAgain),
    stays: t(w.stays),
    mergesIn: t(w.mergesIn),
    yourChoices: t(w.yourChoices),
    field: (field: MergeField) => t(MERGE_FIELD_WORD[field]),
    noName: t(w.noName),
    noCity: t(w.noCity),
    from: (name: string) => t(w.from, { name }),
    numberKept: t(w.numberKept),
    needsUpdate: t(w.needsUpdate),
    review: t(w.review),
    merge: t(w.merge),
    merging: t(w.merging),
    cannotUndo: t(w.cannotUndo),
    done: {
      title: t(w.merged),
      openCustomer: t(w.openCustomer),
      backToLeads: t(w.backToLeads),
      line: (loser: string, survivor: string) => t(w.mergedLine, { loser, survivor }),
      by: (time: string) => t(w.mergedBy, { time }),
    },
  };
}

/** Why the pair cannot merge here (`M02-63`), said with who holds a record — never its name. */
export function customerMergeUnavailableWords(t: T, unavailable: MergeUnavailable) {
  const w = CUSTOMER_MERGE;
  const badge = t(w.unavailable);
  const back = t(w.goBack);
  if (unavailable.kind === 'out_of_scope') {
    const { heldBy } = unavailable;
    return {
      badge,
      back,
      title: t(w.outsideTitle),
      line: heldBy === null ? t(w.outsideUnheld) : t(w.outsideHeld, { holder: heldBy }),
      locked: {
        title: t(w.outsideRecord),
        holder: heldBy === null ? t(w.outsideNoOwner) : t(w.outsideWith, { holder: heldBy }),
      },
    };
  }
  if (unavailable.kind === 'already_merged') {
    return { badge, back, title: t(w.mergedTitle), line: t(w.mergedAlreadyLine), locked: null };
  }
  return { badge, back, title: t(w.goneTitle), line: t(w.goneLine), locked: null };
}
