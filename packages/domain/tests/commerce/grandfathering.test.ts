import { describe, expect, it } from 'vitest';
import { appliesImmediately, forfeitsPriceProtection } from '../../src/commerce/grandfathering';
import { BILLING_STATES } from '../../src/commerce/states';
import type { TierCapacity, TierLimit } from '../../src/commerce/tiers';

/** A protected tenant's current rung. Every field is varied one at a time against this. */
const PROTECTED: TierCapacity = {
  designCeilingKw: 500,
  creationsPerCycle: { proposals: 300, active_projects: 'unlimited' },
  meterBundles: {
    voice_minutes: 0,
    ai_roof_detections: 100,
    marketing_sends: 2_000,
    tracked_field_seats: 3,
  },
  storageGb: 50,
};

const withStorage = (storageGb: TierLimit): TierCapacity => ({ ...PROTECTED, storageGb });

const withDetections = (ai_roof_detections: TierLimit): TierCapacity => ({
  ...PROTECTED,
  meterBundles: { ...PROTECTED.meterBundles, ai_roof_detections },
});

const withProposals = (proposals: TierLimit): TierCapacity => ({
  ...PROTECTED,
  creationsPerCycle: { ...PROTECTED.creationsPerCycle, proposals },
});

describe('forfeitsPriceProtection — a lapse ends the guarantee (BM-42)', () => {
  it.each([
    { state: 'halted', forfeits: true, why: 'the grace ran out — this is the lapse' },
    { state: 'cancelled', forfeits: true, why: 'the tenant left; reactivation is a new price' },
    { state: 'expired', forfeits: true, why: 'a trial never converted, so nothing was protected' },
    { state: 'past_due', forfeits: false, why: 'grace that costs you your pricing is a surprise' },
    { state: 'active', forfeits: false, why: 'paying, protected, nothing has lapsed' },
    { state: 'trialing', forfeits: false, why: 'no lapse has happened' },
  ] as const)('$state — $why', ({ state, forfeits }) => {
    expect(forfeitsPriceProtection(state)).toBe(forfeits);
  });

  it('forfeits in exactly the three ended states and nowhere else', () => {
    expect(BILLING_STATES.filter(forfeitsPriceProtection)).toEqual([
      'halted',
      'expired',
      'cancelled',
    ]);
  });
});

describe('appliesImmediately — growth reaches a protected tenant at once (BM-42)', () => {
  it('lets an unchanged book through — nothing was taken away', () => {
    expect(appliesImmediately(PROTECTED, PROTECTED)).toBe(true);
  });

  it.each([
    { label: 'more storage', after: withStorage(100) },
    { label: 'more detections', after: withDetections(200) },
    { label: 'more proposals', after: withProposals(400) },
    { label: 'a storage ceiling removed', after: withStorage('unlimited') },
    { label: 'a proposal count removed', after: withProposals('unlimited') },
  ])('applies at once on $label', ({ after }) => {
    expect(appliesImmediately(PROTECTED, after)).toBe(true);
  });

  it.each([
    { label: 'one GB less storage', after: withStorage(49) },
    { label: 'one detection less', after: withDetections(99) },
    { label: 'one proposal less', after: withProposals(299) },
    { label: 'a design ceiling lowered', after: { ...PROTECTED, designCeilingKw: 499 } },
  ])('waits for the horizon on $label — a tenant does not lose a field quietly', ({ after }) => {
    expect(appliesImmediately(PROTECTED, after)).toBe(false);
  });

  it('waits when an unlimited rung is given a ceiling — that is a taking away', () => {
    const capped = withProposals(1);
    expect(appliesImmediately(withProposals('unlimited'), capped)).toBe(false);
  });

  it('waits when ONE field shrank among several that grew — the change is not split up', () => {
    const mixed: TierCapacity = {
      ...PROTECTED,
      storageGb: 5_000,
      meterBundles: { ...PROTECTED.meterBundles, ai_roof_detections: 99 },
    };
    expect(appliesImmediately(PROTECTED, mixed)).toBe(false);
  });

  it.each([
    { label: 'into', before: PROTECTED, after: withStorage('custom') },
    { label: 'out of', before: withStorage('custom'), after: PROTECTED },
    { label: 'across an identical', before: withStorage('custom'), after: withStorage('custom') },
  ])(
    'waits on a change $label a custom rung — it cannot be proven generous',
    ({ before, after }) => {
      expect(appliesImmediately(before, after)).toBe(false);
    },
  );
});
