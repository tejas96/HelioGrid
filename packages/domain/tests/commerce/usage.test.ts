import { describe, expect, it } from 'vitest';
import { ABSORBED_COSTS, PROXIED_UPSTREAMS } from '../../src/commerce/costs';
import { METERS } from '../../src/commerce/meters';
import {
  BILLED_LEDGER_METERS,
  COST_LINES,
  isBilledMeter,
  LEDGER_METERS,
  METER_UNITS,
  storageRefuses,
  usagePeriodKey,
} from '../../src/commerce/usage';

describe('the usage ledger vocabulary (M12-32, M12-33, M12-37)', () => {
  it('each meter keeps its rule, and a cost line is ledgered but never billed', () => {
    // Storage is a nightly gauge, never a ledger row (M12-33).
    expect(BILLED_LEDGER_METERS).not.toContain('storage');
    expect([...BILLED_LEDGER_METERS, 'storage'].sort()).toEqual([...METERS].sort());
    // OTP and every proxied service are on the ledger as cost lines (BM-24, M12-37) …
    expect(COST_LINES).toEqual([...ABSORBED_COSTS, ...PROXIED_UPSTREAMS]);
    for (const line of COST_LINES) {
      expect(LEDGER_METERS).toContain(line);
      // … and none of them can ever bill.
      expect(isBilledMeter(line)).toBe(false);
    }
    for (const meter of BILLED_LEDGER_METERS) expect(isBilledMeter(meter)).toBe(true);
    // Every ledger meter counts a whole unit; voice in seconds, so no rounding sits in a row.
    expect(Object.keys(METER_UNITS).sort()).toEqual([...LEDGER_METERS].sort());
    expect(METER_UNITS.voice_minutes).toBe('second');
  });

  it.each([
    { at: '2026-10-31T23:59:59.999Z', key: '2026-10' },
    { at: '2026-11-01T00:00:00.000Z', key: '2026-11' },
    { at: '2027-01-15T08:00:00Z', key: '2027-01' },
  ])('a row at $at dedupes within $key', ({ at, key }) => {
    expect(usagePeriodKey(at)).toBe(key);
  });

  it('refuses an instant that is not UTC, so a retry cannot land on another month', () => {
    expect(() => usagePeriodKey('2026-10-31T23:30:00+05:30')).toThrow(RangeError);
  });
});

describe('storageRefuses — the ceiling plus a tenth (M12-23, BM-20)', () => {
  const GB = 1_000_000_000;
  it.each([
    { gauge: 11 * GB, limit: 10, refused: false, why: 'exactly a tenth over still uploads' },
    { gauge: 11 * GB + 1, limit: 10, refused: true, why: 'one byte past the headroom stops' },
    { gauge: 10.9 * GB, limit: 10, refused: false, why: 'inside the headroom' },
    { gauge: 0, limit: 0, refused: false, why: 'an empty store is never over' },
    { gauge: 1, limit: 0, refused: true, why: 'a zero ceiling stops the first stored byte' },
  ])('$why', ({ gauge, limit, refused }) => {
    expect(storageRefuses(gauge, limit)).toBe(refused);
  });

  it.each(['unlimited', 'custom'] as const)('a %s limit refuses nothing', (limit) => {
    expect(storageRefuses(10_000 * GB, limit)).toBe(false);
  });
});
