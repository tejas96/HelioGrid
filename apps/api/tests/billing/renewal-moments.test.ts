import { ENTITLEMENT_BUFFER_DAYS, MS_PER_DAY, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import {
  monthlyWindowsOf,
  renewalDueAt,
  renewalLinkExpiresAt,
} from '../../src/modules/billing/internal/renewal-moments';

const at = (iso: string) => new Date(Date.parse(iso));
const MONTHS_PER_YEAR = 12;
/** A short last stretch past one whole month. */
const DAYS_PAST_A_MONTH = 10;

describe('renewal moments (M12-05, M12-06, M12-11)', () => {
  it('a year is cut into twelve monthly windows on its anchor', () => {
    const from = at('2026-03-12T06:30:00Z');
    const to = new Date(cycleEnd(from.getTime(), 'yearly'));
    const windows = monthlyWindowsOf({ from, to });
    expect(windows).toHaveLength(MONTHS_PER_YEAR);
    expect(windows[0]).toEqual({ from, to: at('2026-04-12T06:30:00Z') });
    expect(windows.at(-1)).toEqual({ from: at('2027-02-12T06:30:00Z'), to });
    for (const [index, window] of windows.slice(1).entries()) {
      expect(window.from).toEqual(windows[index]?.to);
    }
  });

  it.each([
    [
      'a 31st anchor keeps the 31st where the month has one',
      '2027-01-31T00:00:00Z',
      ['2027-02-28T00:00:00Z', '2027-03-31T00:00:00Z'],
    ],
    [
      'a 29 February anchor lands on the 29th again',
      '2028-02-29T00:00:00Z',
      ['2028-03-29T00:00:00Z', '2028-04-29T00:00:00Z'],
    ],
  ])('a month end anchor never drifts: %s', (_, anchor, ends) => {
    const from = at(anchor);
    const windows = monthlyWindowsOf({ from, to: new Date(cycleEnd(from.getTime(), 'yearly')) });
    expect(windows.slice(0, ends.length).map((window) => window.to)).toEqual(ends.map(at));
  });

  it.each([
    ['a monthly period is one window', 'monthly', 1],
    ['an empty period has none', 'empty', 0],
    ['a short last stretch is its own window', 'a month and a bit', 2],
  ] as const)('%s', (_, length, windows) => {
    const from = at('2026-05-01T00:00:00Z');
    const aMonth = cycleEnd(from.getTime(), 'monthly');
    const to = new Date(
      length === 'monthly'
        ? aMonth
        : length === 'empty'
          ? from.getTime()
          : aMonth + DAYS_PAST_A_MONTH * MS_PER_DAY,
    );
    const cut = monthlyWindowsOf({ from, to });
    expect(cut).toHaveLength(windows);
    if (windows > 0) expect(cut.at(-1)?.to).toEqual(to);
  });

  it('a renewal link is due when entitlement ends and closes when the row halts', () => {
    const end = Date.parse('2027-03-12T06:30:00Z');
    const due = end + ENTITLEMENT_BUFFER_DAYS * MS_PER_DAY;
    expect(renewalDueAt(end)).toBe(due);
    expect(renewalLinkExpiresAt(end)).toBe(due + PAST_DUE_GRACE_DAYS * MS_PER_DAY);
  });
});
