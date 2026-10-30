import { describe, expect, it } from 'vitest';
import { capStepOf, capWarningReached } from '../../src/commerce/caps';

describe('capWarningReached — the first notice is never the block (BM-27, BM-34)', () => {
  it.each([
    { used: 79, limit: 100, warned: false, why: 'one below the threshold is still quiet' },
    { used: 80, limit: 100, warned: true, why: 'the threshold itself warns — 80%, not past it' },
    { used: 100, limit: 100, warned: true, why: 'a full bundle has long since been disclosed' },
    { used: 140, limit: 100, warned: true, why: 'overage is past the warning, not instead of it' },
    { used: 0, limit: 100, warned: false, why: 'an untouched bundle says nothing' },
  ])('$why', ({ used, limit, warned }) => {
    expect(capWarningReached(used, limit)).toBe(warned);
  });

  it.each([
    { used: 2, limit: 3, warned: false, why: 'two of three is 66% — under' },
    { used: 4, limit: 5, warned: true, why: 'four of five is exactly 80% — the boundary lands' },
    { used: 12, limit: 15, warned: true, why: 'the trial’s voice bundle at exactly 80%' },
    { used: 11, limit: 15, warned: false, why: 'one minute earlier, still quiet' },
  ])('$why', ({ used, limit, warned }) => {
    expect(capWarningReached(used, limit)).toBe(warned);
  });

  it.each([
    { limit: 'unlimited', why: 'there is no ceiling to approach' },
    { limit: 'custom', why: 'the number is negotiated and this package does not hold it' },
  ] as const)('never warns against a $limit limit — $why', ({ limit }) => {
    expect(capWarningReached(0, limit)).toBe(false);
    expect(capWarningReached(1_000_000, limit)).toBe(false);
  });

  it.each([
    { used: 0, warned: false, why: 'nothing used yet, so there is nothing to disclose' },
    { used: 1, warned: true, why: 'no headroom to spend — the first unit is already overage' },
  ])('a pay-as-you-go bundle of zero at $used used — $why (BM-41)', ({ used, warned }) => {
    expect(capWarningReached(used, 0)).toBe(warned);
  });
});

describe('capStepOf — the ladder from warning to grace to pause (M12-30, BM-34)', () => {
  const DAY = 86_400_000;
  const fullSince = 1_000 * DAY;
  const cycleEndsAt = fullSince + 20 * DAY;

  it.each([1, 2, 3, 5, 10, 15, 50, 100, 1_000])(
    'the 80% warning comes before the grace and the pause, for every limit — %i',
    (limit) => {
      const steps = Array.from(
        { length: limit + 1 },
        (_, used) => capStepOf({ used, limit, fullSince, cycleEndsAt, now: fullSince }).step,
      );
      const firstWarning = steps.indexOf('warning');
      expect(steps.indexOf('grace')).toBe(limit);
      /* Below 5 no whole count sits between 80% and full, so the grace banner is the first notice. */
      if (limit >= 5) expect(firstWarning).toBeGreaterThan(-1);
      if (firstWarning !== -1) expect(firstWarning).toBeLessThan(limit);
      expect(steps).not.toContain('paused');
    },
  );

  it.each([
    { now: fullSince, step: 'grace', why: 'the moment it fills, the grace begins' },
    { now: fullSince + 7 * DAY - 1, step: 'grace', why: 'an instant before 7 days, still grace' },
    { now: fullSince + 7 * DAY, step: 'paused', why: 'at 7 days, new creations pause' },
    { now: fullSince + 19 * DAY, step: 'paused', why: 'and stay paused until the cycle resets' },
  ])(
    'a full cap pauses new creations only after 7 days of grace, until the cycle resets — $why',
    ({ now, step }) => {
      const reading = capStepOf({ used: 10, limit: 10, fullSince, cycleEndsAt, now });
      expect(reading.step).toBe(step);
      if (reading.step === 'grace') expect(reading.pausesAt).toBe(fullSince + 7 * DAY);
      if (reading.step === 'paused') expect(reading.resetsAt).toBe(cycleEndsAt);
    },
  );

  it('a count seen reaching its limit just now starts its grace now', () => {
    expect(
      capStepOf({ used: 10, limit: 10, fullSince: null, cycleEndsAt, now: fullSince }),
    ).toEqual({ step: 'grace', pausesAt: fullSince + 7 * DAY });
  });

  it.each(['unlimited', 'custom'] as const)('a %s limit is never on the ladder', (limit) => {
    const reading = capStepOf({ used: 1_000_000, limit, fullSince, cycleEndsAt, now: cycleEndsAt });
    expect(reading.step).toBe('clear');
  });

  it.each([
    { used: 0, step: 'clear' },
    { used: 1, step: 'grace' },
  ])('a bundle of zero with $used used is $step (BM-41)', ({ used, step }) => {
    expect(capStepOf({ used, limit: 0, fullSince, cycleEndsAt, now: fullSince }).step).toBe(step);
  });
});
