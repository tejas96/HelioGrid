import type { TranslatedText } from '@heliogrid/contracts';
import type { MergeField, MergeMove } from '@heliogrid/domain';

/** One of the two customers, as the compare draws it: facts the caller formatted. */
export interface MergeCompareRecord {
  readonly customerId: string;
  /** The customer's name as typed; `null` draws `noName`. */
  readonly name: string | null;
  /** The number as the market groups it. */
  readonly phone: string;
  readonly city: string | null;
  /** The record that stays; the other merges into it. */
  readonly stays: boolean;
}

/** A value one record holds for a field: the fact as typed, or the named gap where it holds none. */
export type MergeCompareValue =
  | { readonly kind: 'fact'; readonly text: string; readonly mono: boolean }
  | { readonly kind: 'gap'; readonly words: TranslatedText };

/** One side of a differing field — "Satara · From Sunita". */
export interface MergeCompareOption {
  readonly customerId: string;
  readonly value: MergeCompareValue;
  readonly from: TranslatedText;
}

/** A field the two records disagree on: the person picks one value, never guessed (`M02-60`). */
export interface MergeCompareField {
  readonly key: MergeField;
  readonly label: TranslatedText;
  /** The two values, in the records' order. */
  readonly options: readonly [MergeCompareOption, MergeCompareOption];
  /** The record whose value is kept; `null` until picked. */
  readonly pickedId: string | null;
  /** One line under the field — the primary contact's "the other number stays as a contact". */
  readonly note: TranslatedText | null;
}

/** Every word the compare says, built in `@heliogrid/i18n` (`customerMergeWords`). */
export interface MergeCompareWords {
  /** "Which record stays?" */
  whichStays: TranslatedText;
  stays: TranslatedText;
  mergesIn: TranslatedText;
  /** "Pick one of each". */
  pickEach: TranslatedText;
  /** "1 of 3 picked". */
  pickedCount: TranslatedText;
  /** A field still waiting for its pick — the named gap "Pick one". */
  pickOne: TranslatedText;
  picked: TranslatedText;
  noName: TranslatedText;
  noCity: TranslatedText;
}

/**
 * Customer Merge's compare (`SCR-M02-06`, `M02-60`): the two records — the one that stays marked,
 * the other merging in — then every field the two disagree on with both values, one picked, and a
 * line naming the fields that agree. The records keep their order whichever stays. It stacks; on
 * the web, given the room of two records side by side, each record's values stand in its column.
 * While a merge is out every choice is inert.
 */
export interface MergeCompareProps {
  records: readonly [MergeCompareRecord, MergeCompareRecord];
  fields: readonly MergeCompareField[];
  /** "Same on both, nothing to pick: City" — `null` when every field differs. */
  same: TranslatedText | null;
  onStay: (customerId: string) => void;
  onPick: (field: MergeField, customerId: string) => void;
  disabled: boolean;
  words: MergeCompareWords;
}

/** One kind of record that moves: its count, and an optional line saying what happens to it. */
export interface MergeMoveRow {
  readonly key: MergeMove;
  readonly label: TranslatedText;
  readonly count: number;
  readonly note: TranslatedText | null;
}

/**
 * What a merge moves and what it leaves (`M02-63`), read before it runs: each kind of record that
 * moves with its count — "None" for nothing — what the other record becomes, that no money
 * changes, and, where the act sits beside it, that it cannot be undone.
 */
export interface MergeMovesProps {
  /** "What moves over", or "Into Sunita Kulkarni". */
  heading: TranslatedText;
  rows: readonly MergeMoveRow[];
  /** "Vinayak becomes a merged record that points to Sunita. It is never deleted; …". */
  tombstone: TranslatedText | null;
  /** "No money changes." and its line, beside the ₹ mark. */
  noMoney: { readonly title: TranslatedText; readonly line: TranslatedText };
  /** "This cannot be undone." — `null` where the screen says it beside the act instead. */
  cannotUndo: TranslatedText | null;
  /** The word for a count of nothing — "None". */
  none: TranslatedText;
}

/** Every word the done says, built in `@heliogrid/i18n` (`customerMergeDoneWords`). */
export interface MergeDoneWords {
  /** "Merged." */
  title: TranslatedText;
  /** "Vinayak Kulkarni now points to Sunita Kulkarni." */
  line: TranslatedText;
  /** "By you at 11:47 · on the timeline and in the audit log". */
  by: TranslatedText;
  openCustomer: TranslatedText;
  backToLeads: TranslatedText;
  /** What moved, counted — the moves' words with no tombstone and no warning left to say. */
  moved: Pick<MergeMovesProps, 'heading' | 'rows' | 'noMoney' | 'none'>;
}

/**
 * The calm end of a merge (`SCR-M02-06`): the one hero — a tick, "Merged.", what now points where
 * and who did it when, *Open customer*, where focus lands as it appears, and the way back — then
 * what moved, counted, on its card. No confetti. The two are siblings, so the page lays them out:
 * one column on the phone, side by side where the web has the room.
 */
export interface MergeDoneProps {
  words: MergeDoneWords;
  onOpenCustomer: () => void;
  onBackToLeads: () => void;
}

/**
 * The merge's act (`M02-63`): it runs only on this explicit press, sleeps until every differing
 * field is picked, waits inert while the merge is out, and says under itself why the last press did
 * not merge — or, at rest, what is still to pick.
 */
export interface MergeActProps {
  /** "Merge the two customers". */
  label: TranslatedText;
  onMerge: () => void;
  /** Every differing field is picked and nothing refused it for good. */
  awake: boolean;
  merging: boolean;
  /** "Merging…" while the merge is out. */
  waiting: TranslatedText;
  /** "Not merged. …" — why the last press did not merge; `null` while none failed. */
  failure: TranslatedText | null;
  /** At rest: "2 left to pick: City and Primary contact"; `null` for none. */
  line: TranslatedText | null;
  /** Above the act — "This cannot be undone." — where no summary beside it says so; else `null`. */
  warning: TranslatedText | null;
}
