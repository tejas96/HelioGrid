import { describe, expect, it } from 'vitest';
import {
  bookEntitlements,
  creditRefusal,
  ENTITLEMENT_KEYS,
  type Entitlement,
  extendedTrialEndsAt,
  limitOf,
  storedLimit,
  withCredits,
} from '../../src/commerce/entitlements';
import { METERS, STANDING_METER } from '../../src/commerce/meters';
import { TIERS, type TierLimit } from '../../src/commerce/tiers';
import { isSellable, tierRow, trialCapacity } from '../../src/pricing/book';
import { IN_PRICE_BOOK } from '../../src/pricing/india';

function limitIn(entitlements: readonly Entitlement[], key: Entitlement['key']): TierLimit {
  const found = entitlements.find((entitlement) => entitlement.key === key);
  if (found === undefined) throw new Error(`no ${key}`);
  return found.limit;
}

describe('the entitlement keys (M12-17, M12-20, M12-16)', () => {
  it('the key set is the tier capacity and nothing else', () => {
    const perCycleMeters = METERS.filter((meter) => meter !== STANDING_METER);
    expect([...ENTITLEMENT_KEYS].sort()).toEqual(
      [
        'design_ceiling_kw',
        'proposals_per_cycle',
        'active_projects',
        'storage_gb',
        ...perCycleMeters,
      ].sort(),
    );
    // No studio key beyond the design ceiling, no proposal type, no seat count, no read or export.
    for (const key of ENTITLEMENT_KEYS) {
      expect(key).not.toMatch(/seat_count|^seats$|proposal_type|opex|ppa|studio|read|export/);
    }
    expect(
      bookEntitlements(IN_PRICE_BOOK, null)
        .map((entitlement) => entitlement.key)
        .sort(),
    ).toEqual([...ENTITLEMENT_KEYS].sort());
  });
});

describe('bookEntitlements — the limits the book gives (M12-16, M12-17, BM-28)', () => {
  it("a trial and each tier read the book's capacity", () => {
    const trial = bookEntitlements(IN_PRICE_BOOK, null);
    const caps = trialCapacity(IN_PRICE_BOOK);
    expect(trial.every((entitlement) => entitlement.source === 'trial')).toBe(true);
    expect(limitIn(trial, 'design_ceiling_kw')).toBe('unlimited');
    expect(limitIn(trial, 'storage_gb')).toBe(caps.storageGb);
    expect(limitIn(trial, 'voice_minutes')).toBe(caps.meterBundles.voice_minutes);
    for (const tier of TIERS) {
      const row = tierRow(IN_PRICE_BOOK, tier);
      if (row === null) {
        expect(() => bookEntitlements(IN_PRICE_BOOK, tier)).toThrow(tier);
        continue;
      }
      const paid = bookEntitlements(IN_PRICE_BOOK, tier);
      expect(paid.every((entitlement) => entitlement.source === 'plan')).toBe(true);
      expect(limitIn(paid, 'design_ceiling_kw')).toBe(row.capacity.designCeilingKw);
      expect(limitIn(paid, 'proposals_per_cycle')).toBe(row.capacity.creationsPerCycle.proposals);
      expect(limitIn(paid, 'active_projects')).toBe(row.capacity.creationsPerCycle.active_projects);
      expect(limitIn(paid, 'ai_roof_detections')).toBe(
        row.capacity.meterBundles.ai_roof_detections,
      );
      expect(limitIn(paid, 'storage_gb')).toBe(row.capacity.storageGb);
    }
  });

  it('a meter the book does not sell gets a bundle of zero', () => {
    const unsold = (['marketing_sends', 'tracked_field_seats'] as const).filter(
      (meter) => !isSellable(IN_PRICE_BOOK, meter),
    );
    expect(unsold.length).toBeGreaterThan(0);
    for (const tier of [null, 'growth'] as const) {
      const limits = bookEntitlements(IN_PRICE_BOOK, tier);
      for (const meter of unsold) expect(limitIn(limits, meter)).toBe(0);
    }
  });
});

describe("withCredits — support's goodwill on top of the book (M12-19)", () => {
  it('a credit raises a count and refuses a ceiling it cannot raise', () => {
    const base: Entitlement[] = [
      { key: 'voice_minutes', limit: 100, source: 'plan' },
      { key: 'design_ceiling_kw', limit: 'unlimited', source: 'plan' },
      { key: 'storage_gb', limit: 5, source: 'plan' },
    ];
    const credited = withCredits(base, [
      { key: 'voice_minutes', amount: 30 },
      { key: 'voice_minutes', amount: 20 },
    ]);
    expect(credited).toEqual([
      { key: 'voice_minutes', limit: 150, source: 'grant' },
      { key: 'design_ceiling_kw', limit: 'unlimited', source: 'plan' },
      { key: 'storage_gb', limit: 5, source: 'plan' },
    ]);
    expect(creditRefusal(100, 30)).toBeNull();
    expect(creditRefusal('unlimited', 30)).toMatch('no ceiling');
    expect(creditRefusal('custom', 30)).toMatch('negotiated');
    expect(creditRefusal(100, 0)).toMatch('above zero');
    expect(creditRefusal(100, 1.5)).toMatch('whole');
  });

  it('a stored limit reads back as the limit it was', () => {
    for (const limit of [0, 42, 'unlimited', 'custom'] as const) {
      const stored = storedLimit(limit);
      expect(limitOf(stored.kind, stored.value)).toBe(limit);
    }
    expect(() => limitOf('count', null)).toThrow('without its number');
  });
});

describe("extendedTrialEndsAt — the trial's one extension (M12-52)", () => {
  it("moves the trial's own end by seven days", () => {
    const endsAt = Date.parse('2026-11-14T00:00:00Z');
    expect(extendedTrialEndsAt(endsAt)).toBe(Date.parse('2026-11-21T00:00:00Z'));
  });
});
