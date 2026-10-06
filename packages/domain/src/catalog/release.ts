import { z } from 'zod';
import type { Certification } from '../certification/pack';
import { isCalendarDate } from '../format/holidays';
import { canonicalJson } from '../market/payload';
import { minorUnits } from '../money/minor-units';
import type { CatalogRate } from './resolve';
import { type CatalogSpec, catalogSpecSchema } from './specs';

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

const storedRateSchema = z
  .object({
    amount: z.number(),
    currency: z.string(),
    effectiveOn: z.string().refine(isCalendarDate),
  })
  .nullable();

/**
 * A stored side as one schema: a key a later release adds is dropped and the spec is read through
 * its kind's envelope, so a line written by a newer machine compares equal on an older one — or
 * every item would read as `changed` on the first publish after a field is added.
 */
const storedSnapshotSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('own_item'),
    brand: z.string(),
    model: z.string(),
    spec: catalogSpecSchema,
    certifications: z
      .array(z.object({ scheme: z.string(), reference: z.string().nullable() }))
      .readonly(),
    preferred: z.boolean(),
    archived: z.boolean(),
    rate: storedRateSchema,
  }),
  z.object({
    kind: z.literal('override'),
    taxPct: z.string().nullable(),
    hidden: z.boolean(),
    preferred: z.boolean(),
    rate: storedRateSchema,
  }),
]);

/** A snapshot as a line's jsonb holds it: the rate's amount a plain number of minor units. */
export type CatalogReleaseSnapshotEnvelope = z.input<typeof storedSnapshotSchema>;

/**
 * A stored line read whole: unknown keys dropped, the amount re-minted through its one door
 * (`F1-07`).
 */
export function readReleaseSnapshot(stored: unknown): CatalogReleaseSnapshot {
  const snapshot = storedSnapshotSchema.parse(stored);
  const rate =
    snapshot.rate === null ? null : { ...snapshot.rate, amount: minorUnits(snapshot.rate.amount) };
  return { ...snapshot, rate };
}

/**
 * An item no release has named yet that a design could not pick with anything to say: an override
 * with every field unset and no rate, or an own SKU archived before its first line.
 */
function saysNothingYet(after: CatalogReleaseSnapshot): boolean {
  if (after.kind === 'own_item') return after.archived;
  return after.taxPct === null && !after.hidden && !after.preferred && after.rate === null;
}

/**
 * What a line says, or `null` for no line: an item with no earlier line is `added`, unless it says
 * nothing yet; an own SKU archived since its last line is `archived`, whatever else moved;
 * anything else that differs is `changed`; two equal sides say nothing — a change made and
 * reverted between releases is not a change. Equal as canonical JSON, so the order keys arrive
 * in never reads as a change.
 */
export function changeKindOf(
  before: CatalogReleaseSnapshot | null,
  after: CatalogReleaseSnapshot,
): ReleaseChangeKind | null {
  if (before === null) return saysNothingYet(after) ? null : 'added';
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
