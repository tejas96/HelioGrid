import { describe, expect, it } from 'vitest';
import { BYTES_PER_GB, storagePausesAboveGb, storageRefuses } from '../../src/commerce/usage';
import {
  bundleUsageStep,
  cappedUsageStep,
  overageBillsOn,
  storageUsageStep,
} from '../../src/commerce/usage-steps';
import { MS_PER_DAY } from '../../src/format/zone';

const NOW = Date.UTC(2026, 8, 15);
const CYCLE_ENDS = Date.UTC(2026, 9, 1);

describe('cappedUsageStep — a capped count on the cap ladder (M12-30)', () => {
  it.each([
    {
      used: 11,
      fullSince: null,
      step: 'clear',
      why: 'under 80% of a 15-minute trial cap is quiet',
    },
    { used: 12, fullSince: null, step: 'warning', why: 'exactly 80% warns, before any gate' },
    { used: 15, fullSince: NOW - MS_PER_DAY, step: 'grace', why: 'full a day ago: the grace runs' },
    { used: 15, fullSince: NOW - 7 * MS_PER_DAY, step: 'paused', why: 'full seven days: paused' },
  ] as const)('$why', ({ used, fullSince, step }) => {
    const reading = cappedUsageStep({
      used,
      limit: 15,
      fullSince,
      cycleEndsAt: CYCLE_ENDS,
      now: NOW,
    });
    expect(reading.step).toBe(step);
  });

  it('a grace names when creations pause, and a pause when the cycle resets', () => {
    const grace = cappedUsageStep({
      used: 15,
      limit: 15,
      fullSince: NOW - MS_PER_DAY,
      cycleEndsAt: CYCLE_ENDS,
      now: NOW,
    });
    expect(grace).toEqual({ step: 'grace', pausesAt: NOW + 6 * MS_PER_DAY, resetsAt: null });
    const paused = cappedUsageStep({
      used: 15,
      limit: 15,
      fullSince: NOW - 8 * MS_PER_DAY,
      cycleEndsAt: CYCLE_ENDS,
      now: NOW,
    });
    expect(paused).toEqual({ step: 'paused', pausesAt: null, resetsAt: CYCLE_ENDS });
  });
});

describe('bundleUsageStep — a bundle charges past itself, it never pauses (M12-35)', () => {
  it.each([
    { used: 319, bundle: 400, step: 'clear', why: 'one minute under 80% of Pro’s 400' },
    { used: 320, bundle: 400, step: 'warning', why: 'exactly 80% warns' },
    { used: 400, bundle: 400, step: 'warning', why: 'the whole bundle used is not yet overage' },
    { used: 401, bundle: 400, step: 'overage', why: 'one minute past the bundle charges' },
    { used: 0, bundle: 0, step: 'clear', why: 'pay as you go with nothing used says nothing' },
    { used: 1, bundle: 0, step: 'overage', why: 'pay as you go charges from the first minute' },
    { used: 9_000, bundle: 'custom', step: 'clear', why: 'a negotiated bundle has no number here' },
  ] as const)('$why', ({ used, bundle, step }) => {
    expect(bundleUsageStep(used, bundle).step).toBe(step);
  });
});

describe('storageUsageStep — the gauge against its ceiling, paused where the gate refuses (BM-20)', () => {
  const gb = (n: number) => Math.round(n * BYTES_PER_GB);
  it.each([
    { gauge: gb(39.9), step: 'clear', why: 'under 80% of 50 GB is quiet' },
    { gauge: gb(40), step: 'warning', why: 'exactly 80% warns' },
    { gauge: gb(50), step: 'at_cap', why: 'the ceiling itself is at the cap' },
    { gauge: gb(55), step: 'at_cap', why: 'the tenth above the ceiling still uploads' },
    { gauge: gb(55) + 1, step: 'paused', why: 'past the tenth the upload gate refuses' },
  ] as const)('$why', ({ gauge, step }) => {
    expect(storageUsageStep(gauge, 50).step).toBe(step);
  });

  it('a gauge has no cycle, so a paused upload names no reset', () => {
    expect(storageUsageStep(gb(60), 50)).toEqual({
      step: 'paused',
      pausesAt: null,
      resetsAt: null,
    });
  });

  it.each(['unlimited', 'custom'] as const)('a %s ceiling never warns', (limit) => {
    expect(storageUsageStep(gb(10_000), limit).step).toBe('clear');
  });
});

describe('overageBillsOn — extra charges bill on the payment that carries their month (M12-35)', () => {
  const periods = { paidPeriodEnd: CYCLE_ENDS, nextPeriodEnd: Date.UTC(2026, 10, 1) };
  it.each([
    {
      collection: 'mandate',
      billsOn: periods.nextPeriodEnd,
      why: 'a mandate: the debit after the period’s end',
    },
    {
      collection: 'invoice',
      billsOn: periods.paidPeriodEnd,
      why: 'a link: the renewal at the period’s end',
    },
  ] as const)('$why', ({ collection, billsOn }) => {
    expect(overageBillsOn(collection, periods)).toBe(billsOn);
  });
});

describe('storagePausesAboveGb — the size the storage gate refuses past, as the screen says it (BM-20)', () => {
  it.each([
    { limit: 5, above: 5.5, why: 'the trial’s 5 GB pauses past 5.5' },
    { limit: 50, above: 55, why: 'Growth’s 50 GB pauses past 55' },
    { limit: 250, above: 275, why: 'Pro’s 250 GB pauses past 275' },
    { limit: 0, above: 0, why: 'no ceiling leaves no room' },
  ])('$why', ({ limit, above }) => {
    expect(storagePausesAboveGb(limit)).toBe(above);
    expect(storageRefuses(Math.round(above * BYTES_PER_GB), limit)).toBe(false);
    expect(storageRefuses(Math.round(above * BYTES_PER_GB) + 1, limit)).toBe(true);
  });
});
