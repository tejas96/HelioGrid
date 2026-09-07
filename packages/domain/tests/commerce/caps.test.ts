import { describe, expect, it } from 'vitest';
import { capWarningReached } from '../../src/commerce/caps';

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
