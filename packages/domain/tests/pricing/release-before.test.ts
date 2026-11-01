import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { IN_PACK } from '../../src/market/pack';
import { payloadOf } from '../../src/market/payload';
import { IN_PRICE_BOOK } from '../../src/pricing/india';
import {
  isReleaseBeforeEntry,
  withReleaseBeforeDetections,
} from '../../src/pricing/release-before';

/*
 * The book schema of the release before, frozen: the reader this release must not break. Only the
 * keys that release requires and this one dropped are spelled out; the rest is read as it is.
 */
const limit = z.union([z.number(), z.literal('unlimited'), z.literal('custom')]);
const detectionBundle = z.object({ ai_roof_detections: limit }).passthrough();
const releaseBeforeBook = z
  .object({
    tiers: z.record(
      z
        .object({ capacity: z.object({ meterBundles: detectionBundle }).passthrough() })
        .passthrough()
        .nullable(),
    ),
    overage: z
      .object({
        ai_roof_detections: z.object({
          kind: z.literal('per_unit'),
          rate: z.number().nonnegative(),
          worstCaseCogs: z.object({ amount: z.number().nonnegative(), source: z.string() }),
          draft: z.boolean(),
        }),
      })
      .passthrough(),
    trialCaps: z.object({ meterBundles: detectionBundle }).passthrough(),
  })
  .passthrough();

describe('the published book, read by the api of the release before (D398)', () => {
  it('the api of the release before parses the published India book', () => {
    const read = releaseBeforeBook.parse(payloadOf(IN_PACK).priceBook);
    // It issues no allowance for a draft meter and bills none (`isSellable` of that release).
    expect(read.overage.ai_roof_detections.draft).toBe(true);
    expect(read.trialCaps.meterBundles.ai_roof_detections).toBe(0);
    for (const row of Object.values(read.tiers)) {
      if (row !== null) expect(row.capacity.meterBundles.ai_roof_detections).toBe(0);
    }
  });

  it.each([
    { path: ['priceBook', 'overage', 'ai_roof_detections'], silent: true },
    {
      path: ['priceBook', 'tiers', 'pro', 'capacity', 'meterBundles', 'ai_roof_detections'],
      silent: true,
    },
    { path: ['priceBook', 'overage', 'voice_minutes'], silent: false },
    { path: ['tax', 'ai_roof_detections'], silent: false },
  ])('drops $path in silence: $silent', ({ path, silent }) => {
    expect(isReleaseBeforeEntry(path)).toBe(silent);
  });

  it('leaves a rung the market does not sell unsold', () => {
    const book = { ...IN_PRICE_BOOK, tiers: { ...IN_PRICE_BOOK.tiers, enterprise: null } };
    expect(releaseBeforeBook.parse(withReleaseBeforeDetections(book)).tiers.enterprise).toBeNull();
  });
});
