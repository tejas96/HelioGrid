import type { Certification } from '../certification/pack';
import { canonicalJson } from '../market/payload';
import { minorUnits } from '../money/minor-units';
import type { CatalogRate } from './resolve';
import type { CatalogSpec } from './specs';

/**
 * A catalog release's lines (M01-43): what one publish says about one item, as a before and an
 * after rather than a list of names (`SCR-M01-15` decision 4). The snapshot is the item's stored
 * facts — the rate in force as `CatalogRate` (its amount in minor units, converted from the
 * ledger's decimal column at the write), the override's percent as the two-decimal text it is
 * kept as — never a resolved view, so a line written by one release reads unchanged on every
 * later machine. A line's jsonb is the ENVELOPE below, a plain number at rest; the brand is
 * re-minted on read, as the pack's is.
 */

/** The three things a release line can say. Its only readers are the release lines. */
export const RELEASE_CHANGE_KINDS = ['added', 'changed', 'archived'] as const;
export type ReleaseChangeKind = (typeof RELEASE_CHANGE_KINDS)[number];

export interface OwnItemSnapshot {
  readonly kind: 'own_item';
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
  readonly certifications: readonly Certification[];
  readonly preferred: boolean;
  readonly archived: boolean;
  readonly rate: CatalogRate | null;
}

export interface OverrideSnapshot {
  readonly kind: 'override';
  /** The wire's two-decimal percent, `"18.00"`; `"0.00"` is a rate and `null` is unset. */
  readonly taxPct: string | null;
  readonly hidden: boolean;
  readonly preferred: boolean;
  readonly rate: CatalogRate | null;
}

export type CatalogReleaseSnapshot = OwnItemSnapshot | OverrideSnapshot;

/** A snapshot as a line's jsonb holds it: the rate's amount a plain number of minor units. */
type Stored<Snapshot extends { readonly rate: CatalogRate | null }> = Omit<Snapshot, 'rate'> & {
  readonly rate: (Omit<CatalogRate, 'amount'> & { readonly amount: number }) | null;
};
export type CatalogReleaseSnapshotEnvelope = Stored<OwnItemSnapshot> | Stored<OverrideSnapshot>;

/** A stored line read whole: the amount re-minted through the brand's one door (`F1-07`). */
export function readReleaseSnapshot(
  stored: CatalogReleaseSnapshotEnvelope,
): CatalogReleaseSnapshot {
  const rate =
    stored.rate === null ? null : { ...stored.rate, amount: minorUnits(stored.rate.amount) };
  return { ...stored, rate };
}

/**
 * What a line says, or `null` for no line: an item with no earlier line is `added`; an own SKU
 * archived since its last line is `archived`, whatever else moved; anything else that differs is
 * `changed`; two equal sides say nothing — a change made and reverted between releases is not a
 * change. Equal as canonical JSON, so the order keys arrive in never reads as a change.
 */
export function changeKindOf(
  before: CatalogReleaseSnapshot | null,
  after: CatalogReleaseSnapshot,
): ReleaseChangeKind | null {
  if (before === null) return 'added';
  if (
    after.kind === 'own_item' &&
    before.kind === 'own_item' &&
    after.archived &&
    !before.archived
  ) {
    return 'archived';
  }
  return canonicalJson(before) === canonicalJson(after) ? null : 'changed';
}
