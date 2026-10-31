import { describe, expect, it } from 'vitest';
import { appliesImmediately } from '../../src/commerce/repricing';
import type { TierCapacity, TierLimit } from '../../src/commerce/tiers';

/** A company's current rung. Every field is varied one at a time against this. */
const CURRENT: TierCapacity = {
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

const withStorage = (storageGb: TierLimit): TierCapacity => ({ ...CURRENT, storageGb });

const withDetections = (ai_roof_detections: TierLimit): TierCapacity => ({
  ...CURRENT,
  meterBundles: { ...CURRENT.meterBundles, ai_roof_detections },
});

const withProposals = (proposals: TierLimit): TierCapacity => ({
  ...CURRENT,
  creationsPerCycle: { ...CURRENT.creationsPerCycle, proposals },
});

describe('appliesImmediately — growth reaches a company at once (BM-42)', () => {
  it('lets an unchanged book through — nothing was taken away', () => {
    expect(appliesImmediately(CURRENT, CURRENT)).toBe(true);
  });

  it.each([
    { label: 'more storage', after: withStorage(100) },
    { label: 'more detections', after: withDetections(200) },
    { label: 'more proposals', after: withProposals(400) },
    { label: 'a storage ceiling removed', after: withStorage('unlimited') },
    { label: 'a proposal count removed', after: withProposals('unlimited') },
  ])('applies at once on $label', ({ after }) => {
    expect(appliesImmediately(CURRENT, after)).toBe(true);
  });

  it.each([
    { label: 'one GB less storage', after: withStorage(49) },
    { label: 'one detection less', after: withDetections(99) },
    { label: 'one proposal less', after: withProposals(299) },
    { label: 'a design ceiling lowered', after: { ...CURRENT, designCeilingKw: 499 } },
  ])('waits for the horizon on $label — a tenant does not lose a field quietly', ({ after }) => {
    expect(appliesImmediately(CURRENT, after)).toBe(false);
  });

  it('waits when an unlimited rung is given a ceiling — that is a taking away', () => {
    const capped = withProposals(1);
    expect(appliesImmediately(withProposals('unlimited'), capped)).toBe(false);
  });

  it('waits when ONE field shrank among several that grew — the change is not split up', () => {
    const mixed: TierCapacity = {
      ...CURRENT,
      storageGb: 5_000,
      meterBundles: { ...CURRENT.meterBundles, ai_roof_detections: 99 },
    };
    expect(appliesImmediately(CURRENT, mixed)).toBe(false);
  });

  it.each([
    { label: 'into', before: CURRENT, after: withStorage('custom') },
    { label: 'out of', before: withStorage('custom'), after: CURRENT },
    { label: 'across an identical', before: withStorage('custom'), after: withStorage('custom') },
  ])(
    'waits on a change $label a custom rung — it cannot be proven generous',
    ({ before, after }) => {
      expect(appliesImmediately(before, after)).toBe(false);
    },
  );
});
