/**
 * Customer Merge's words for a pair being compared and confirmed (`SCR-M02-06`, `M02-60`,
 * `M02-63`): the compare's counter, the fields the two agree on, the picks still waiting, what moves
 * and what the other record becomes, and why a confirmed merge did not run.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type {
  MergeField,
  MergeMove,
  MergeMoves,
  MergeRecord,
  MergeRefusal,
  MergeView,
} from '@heliogrid/domain';
import { MERGE_MOVES } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { type AttemptFailureLike, attemptFailureMessageId, INTERNAL_ERROR } from './api-error';
import {
  CUSTOMER_MERGE,
  customerMergeWords,
  MERGE_FIELD_WORD,
  MERGE_MOVE_WORD,
} from './customer-merge';
import { joinAnd } from './list-join';

type T = Translator['t'];

/** Why the confirmed merge did not run: refused with a reason, or no readable answer came. */
export type CustomerMergeFailure =
  | { readonly kind: 'refused'; readonly refusal: MergeRefusal }
  | { readonly kind: 'failed'; readonly attempt: AttemptFailureLike };

/** The facts the words are chosen by. A record is named by its name, else its number as shown. */
export interface CustomerMergeFacts {
  readonly survivor: string;
  readonly loser: string;
  /** How many fields the two disagree on, and which still wait for a pick. */
  readonly fieldCount: number;
  readonly unpicked: readonly MergeField[];
  /** The fields the two agree on. */
  readonly same: readonly MergeField[];
  /** The loser's own number as shown, where it stays on as a contact; else `null`. */
  readonly keptNumber: string | null;
  readonly moves: MergeMoves;
  readonly failure: CustomerMergeFailure | null;
}

/** A record as the words name it: its name, else its number as the screen shows a phone. */
export function mergeRecordName(record: MergeRecord, phone: (phoneE164: string) => string): string {
  return record.name ?? phone(record.phoneE164);
}

/** The facts of a pair being compared, from domain's view of it. */
export function customerMergeFactsOf(
  view: MergeView,
  failure: CustomerMergeFailure | null,
  phone: (phoneE164: string) => string,
): CustomerMergeFacts {
  return {
    survivor: mergeRecordName(view.survivor, phone),
    loser: mergeRecordName(view.loser, phone),
    fieldCount: view.fields.length,
    unpicked: view.unpicked,
    same: view.same,
    keptNumber: view.keptNumber === null ? null : phone(view.keptNumber),
    moves: view.moves,
    failure,
  };
}

/** A finished merge: both records, what moved, and when it ran (an ISO instant). */
export interface CustomerMergeDoneFacts {
  readonly survivor: MergeRecord;
  readonly loser: MergeRecord;
  readonly moves: MergeMoves;
  readonly at: string;
}

/** The facts of a finished merge: who now points where, and what moved. */
function customerMergeDoneFacts(
  done: Omit<CustomerMergeDoneFacts, 'at'>,
  phone: (phoneE164: string) => string,
): CustomerMergeFacts {
  return {
    survivor: mergeRecordName(done.survivor, phone),
    loser: mergeRecordName(done.loser, phone),
    fieldCount: 0,
    unpicked: [],
    same: [],
    keptNumber:
      done.loser.phoneE164 === done.survivor.phoneE164 ? null : phone(done.loser.phoneE164),
    moves: done.moves,
    failure: null,
  };
}

const REFUSAL: Record<MergeRefusal, { id: string }> = {
  out_of_scope: CUSTOMER_MERGE.refusedOutOfScope,
  already_merged: CUSTOMER_MERGE.refusedMerged,
  choices_missing: CUSTOMER_MERGE.refusedChoices,
  not_found: CUSTOMER_MERGE.refusedGone,
};

function fieldNames(t: T, fields: readonly MergeField[]): TranslatedText {
  return joinAnd(
    t,
    fields.map((field) => t(MERGE_FIELD_WORD[field])),
  );
}

/** The words of a pair being compared and confirmed, for its facts now. */
export function customerMergePairWords(t: T, facts: CustomerMergeFacts) {
  const w = CUSTOMER_MERGE;
  const left = facts.unpicked.length;
  return {
    compare: {
      whichStays: t(w.whichStays),
      stays: t(w.stays),
      mergesIn: t(w.mergesIn),
      pickEach: t(w.pickEach),
      pickedCount: t(w.pickedCount, { picked: facts.fieldCount - left, total: facts.fieldCount }),
      pickOne: t(w.pickOne),
      picked: t(w.picked),
      noName: t(w.noName),
      noCity: t(w.noCity),
    },
    same: facts.same.length === 0 ? null : t(w.same, { fields: fieldNames(t, facts.same) }),
    /** The phone's act while picks wait — "Pick 2 more to merge" — else `null`. */
    pickMore: left === 0 ? null : t(w.pickMore, { count: left }),
    /** The web's line under its act. */
    leftLine:
      left === 0
        ? t(w.allPicked)
        : t(w.leftToPick, { count: left, fields: fieldNames(t, facts.unpicked) }),
    moves: {
      heading: t(w.movesHeading),
      into: t(w.movesInto, { name: facts.survivor }),
      moved: t(w.movedHeading),
      rows: MERGE_MOVES.map((key) => ({
        key,
        label: t(MERGE_MOVE_WORD[key]),
        count: facts.moves[key],
        note: moveNote(t, key, facts.keptNumber),
      })),
      tombstone: t(w.tombstone, { loser: facts.loser, survivor: facts.survivor }),
      noMoney: { title: t(w.noMoney), line: t(w.noMoneyLine) },
      cannotUndo: t(w.cannotUndo),
      none: t(w.none),
    },
    failure: facts.failure === null ? null : failureLine(t, facts.failure),
  };
}

function moveNote(t: T, key: MergeMove, keptNumber: string | null): TranslatedText | null {
  if (key === 'contacts') {
    return keptNumber === null ? null : t(CUSTOMER_MERGE.contactKept, { phone: keptNumber });
  }
  if (key === 'leads') return t(CUSTOMER_MERGE.leadsKept);
  if (key === 'activities') return t(CUSTOMER_MERGE.oneHistory);
  return null;
}

function failureLine(t: T, failure: CustomerMergeFailure): TranslatedText {
  const reason =
    failure.kind === 'refused'
      ? t(REFUSAL[failure.refusal])
      : t(attemptFailureMessageId(failure.attempt) ?? INTERNAL_ERROR);
  return t(CUSTOMER_MERGE.notMerged, { reason });
}

/**
 * The calm done's words (`SCR-M02-06`): "Merged.", who now points where, by whom and when, its two
 * acts, and what moved — counted, with nothing left to warn of.
 */
export function customerMergeDoneWords(
  t: T,
  done: CustomerMergeDoneFacts,
  format: {
    readonly phone: (phoneE164: string) => string;
    readonly clockAt: (at: string) => string;
  },
) {
  const facts = customerMergeDoneFacts(done, format.phone);
  const words = customerMergeWords(t).done;
  const { moved, rows, noMoney, none } = customerMergePairWords(t, facts).moves;
  return {
    title: words.title,
    line: words.line(facts.loser, facts.survivor),
    by: words.by(format.clockAt(done.at)),
    openCustomer: words.openCustomer,
    backToLeads: words.backToLeads,
    moved: { heading: moved, rows, noMoney, none },
  };
}
