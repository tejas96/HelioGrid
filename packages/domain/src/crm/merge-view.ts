import type { MergeSide } from './merge-plan';
import { MERGE_FIELDS, type MergeField } from './vocabulary';

/*
 * Customer Merge (`SCR-M02-06`, `M02-59`…`M02-63`), decided once for both screens: which record
 * stays, one explicit pick for every field the two disagree on — never guessed — what moves, and
 * why a pair cannot merge. The shapes are named here because `packages/contracts` derives from this
 * package; the wire's `MergePreview` satisfies `MergePreviewRead`.
 */

/** One customer as the merge names it. `name` and `city` are named gaps while `null`. */
export interface MergeRecord {
  readonly customerId: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly city: string | null;
}

/** What re-points from the loser to the survivor, counted (`M02-63`: the confirm says what moves). */
export interface MergeMoves {
  readonly contacts: number;
  readonly leads: number;
  readonly activities: number;
  readonly referrals: number;
  readonly visits: number;
  readonly tasks: number;
  readonly files: number;
}

/** The order the confirm lists what moves in — the record's own people first, money never. */
export const MERGE_MOVES = [
  'contacts',
  'leads',
  'activities',
  'referrals',
  'visits',
  'tasks',
  'files',
] as const satisfies readonly (keyof MergeMoves)[];
export type MergeMove = (typeof MERGE_MOVES)[number];

/**
 * The merge preview as the screen reads it. Blocked, it carries nothing of either record — only
 * why, and out of scope who holds the record the reader cannot see. A differing field a newer
 * server learned arrives as text this build has no words or pick for.
 */
export interface MergePreviewRead {
  readonly blocked: 'out_of_scope' | 'already_merged' | null;
  readonly heldBy: string | null;
  readonly survivor: MergeRecord | null;
  readonly loser: MergeRecord | null;
  readonly differences: readonly {
    readonly field: string;
    readonly survivor: string | null;
    readonly loser: string | null;
  }[];
  readonly moves: MergeMoves | null;
}

/**
 * Why the two cannot merge here, with no merge act anywhere on the screen (`M02-63`): one record is
 * outside the person's list — said with who holds it, never its name — one was already merged, or
 * one does not exist in the company.
 */
export type MergeUnavailable =
  | { readonly kind: 'out_of_scope'; readonly heldBy: string | null }
  | { readonly kind: 'already_merged' }
  | { readonly kind: 'not_found' };

export function mergeUnavailableOf(preview: MergePreviewRead): MergeUnavailable | null {
  if (preview.blocked === 'out_of_scope') return { kind: 'out_of_scope', heldBy: preview.heldBy };
  if (preview.blocked === 'already_merged') return { kind: 'already_merged' };
  return null;
}

/**
 * Why a confirmed merge did not run, nothing having changed: a record left the person's list or
 * was merged a moment ago, the records changed since the picks were made, or one is gone.
 */
export type MergeRefusal = 'out_of_scope' | 'already_merged' | 'choices_missing' | 'not_found';

/** The record whose value each differing field keeps, by customer id: a pick survives a swap. */
export type MergeChoices = Readonly<Partial<Record<MergeField, string>>>;

/** One side of a differing field: the value as that record holds it, and whose record it is. */
export interface MergeOption {
  readonly customerId: string;
  /**
   * The value; `null` is its named gap — no name, no city, or, for the primary contact, the
   * customer themself, whose own number `phoneE164` is.
   */
  readonly value: string | null;
  readonly phoneE164: string;
  /** Whose record the value is from; `null` draws that record's named gap. */
  readonly fromName: string | null;
}

/** A field the two disagree on: both values in the records' order, and the one picked. */
export interface MergeFieldPick {
  readonly field: MergeField;
  readonly options: readonly [MergeOption, MergeOption];
  /** The record whose value is kept; `null` until the person picks — never guessed (`M02-60`). */
  readonly pickedId: string | null;
}

export interface MergeRecordView extends MergeRecord {
  /** The record that stays; the other merges into it. */
  readonly stays: boolean;
}

/** What the survivor keeps of one differing field — the confirm's *Your choices*. */
export interface MergeKept {
  readonly field: MergeField;
  readonly value: string | null;
  readonly phoneE164: string;
}

export interface MergeView {
  /**
   * The two records in the order the person met them — the one they came from first — so neither
   * jumps when the other is made the one that stays.
   */
  readonly records: readonly [MergeRecordView, MergeRecordView];
  readonly survivor: MergeRecord;
  readonly loser: MergeRecord;
  /** The fields the two disagree on, each asking for a pick. */
  readonly fields: readonly MergeFieldPick[];
  /** The fields the two agree on: *Same on both*, nothing to pick. */
  readonly same: readonly MergeField[];
  readonly unpicked: readonly MergeField[];
  /** A field this build cannot show differs, so the merge waits for a newer app. */
  readonly needsUpdate: boolean;
  /** Every differing field is picked and every one is known: the merge may run. */
  readonly ready: boolean;
  readonly moves: MergeMoves;
  /** The loser's own number where it differs from the survivor's: it stays on as a contact. */
  readonly keptNumber: string | null;
  readonly kept: readonly MergeKept[];
}

function isMergeField(field: string): field is MergeField {
  return (MERGE_FIELDS as readonly string[]).includes(field);
}

/**
 * The compare and confirm as drawn, from a preview that is not blocked; `firstId` is the record the
 * person came from, drawn first. `null` for a blocked preview.
 */
export function mergeViewOf(
  preview: MergePreviewRead,
  firstId: string,
  choices: MergeChoices,
): MergeView | null {
  const { survivor, loser, moves } = preview;
  if (preview.blocked !== null || survivor === null || loser === null || moves === null) {
    return null;
  }
  const differing = preview.differences.filter((difference) => isMergeField(difference.field));
  const optionOf = (record: MergeRecord, value: string | null): MergeOption => ({
    customerId: record.customerId,
    value,
    phoneE164: record.phoneE164,
    fromName: record.name,
  });
  const fields = differing.map((difference): MergeFieldPick => {
    const field = difference.field as MergeField;
    const kept = optionOf(survivor, difference.survivor);
    const merged = optionOf(loser, difference.loser);
    const picked = choices[field];
    return {
      field,
      options: survivor.customerId === firstId ? [kept, merged] : [merged, kept],
      pickedId: picked === survivor.customerId || picked === loser.customerId ? picked : null,
    };
  });
  const unpicked = fields.filter((pick) => pick.pickedId === null).map((pick) => pick.field);
  const needsUpdate = differing.length < preview.differences.length;
  const stays = { ...survivor, stays: true };
  const goes = { ...loser, stays: false };
  return {
    records: survivor.customerId === firstId ? [stays, goes] : [goes, stays],
    survivor,
    loser,
    fields,
    same: MERGE_FIELDS.filter((field) => !fields.some((pick) => pick.field === field)),
    unpicked,
    needsUpdate,
    ready: unpicked.length === 0 && !needsUpdate,
    moves,
    keptNumber: loser.phoneE164 === survivor.phoneE164 ? null : loser.phoneE164,
    kept: fields.flatMap((pick) => {
      const option = pick.options.find((one) => one.customerId === pick.pickedId);
      return option === undefined
        ? []
        : [{ field: pick.field, value: option.value, phoneE164: option.phoneE164 }];
    }),
  };
}

/** The wire's picks: the side each differing field is taken from, once the view is ready. */
export function mergePicksOf(view: MergeView): Readonly<Partial<Record<MergeField, MergeSide>>> {
  return Object.fromEntries(
    view.fields.flatMap((pick) =>
      pick.pickedId === null
        ? []
        : [[pick.field, pick.pickedId === view.survivor.customerId ? 'survivor' : 'loser']],
    ),
  );
}

/** A customer the find step offers as the other record: never the one the merge keeps. */
export function mergeCandidatesOf<Candidate extends { readonly id: string }>(
  found: readonly Candidate[],
  survivorId: string,
): Candidate[] {
  return found.filter((candidate) => candidate.id !== survivorId);
}
