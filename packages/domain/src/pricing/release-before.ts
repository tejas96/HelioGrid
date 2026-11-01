import { minorUnits } from '../money/minor-units';
import type { PriceBookPack } from './pack';

/**
 * The api of the release before requires an `ai_roof_detections` entry in each tier's bundles, in
 * `overage` and in `trialCaps`, and refuses a pack without them — and it reads the revision this
 * release publishes while the roll is under way. So the stored book carries the entries it needs:
 * a zero bundle and a zero, DRAFT rate, which that api neither issues an allowance for nor bills.
 * This release's parser drops them. Delete this file once this release is the one before (`D398`).
 */
export function withReleaseBeforeDetections(book: PriceBookPack): unknown {
  const tiers = Object.fromEntries(
    Object.entries(book.tiers).map(([tier, row]) => [
      tier,
      row === null
        ? null
        : {
            ...row,
            capacity: {
              ...row.capacity,
              meterBundles: { ...row.capacity.meterBundles, ai_roof_detections: 0 },
            },
          },
    ]),
  );
  return {
    ...book,
    tiers,
    overage: { ...book.overage, ai_roof_detections: RETIRED_DETECTION_RATE },
    trialCaps: {
      ...book.trialCaps,
      meterBundles: { ...book.trialCaps.meterBundles, ai_roof_detections: 0 },
    },
  };
}

/**
 * Whether a stored property is one `withReleaseBeforeDetections` wrote: a read drops it in silence,
 * because naming it on every read would bury a real stranger in the log.
 */
export function isReleaseBeforeEntry(path: readonly string[]): boolean {
  return path[0] === 'priceBook' && path[path.length - 1] === RETIRED_METER;
}

const RETIRED_METER = 'ai_roof_detections';

const RETIRED_DETECTION_RATE = {
  kind: 'per_unit',
  rate: minorUnits(0),
  worstCaseCogs: { amount: minorUnits(0), source: 'retired: the product has no roof detection' },
  draft: true,
} as const;
