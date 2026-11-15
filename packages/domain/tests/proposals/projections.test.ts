import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { proposalEmi, proposalSavings, type SavingsInput } from '../../src/proposals/projections';

const FLAT_300 = Array.from({ length: 12 }, () => 300);

function input(over: Partial<SavingsInput> = {}): SavingsInput {
  return {
    formats: IN_FORMATS,
    monthlyKwh: FLAT_300,
    source: { kind: 'record', databases: ['ERA5'] },
    financials: { tariffPerKwh: minorUnits(1000), tariffRise: basisPoints(0), horizonYears: 25 },
    monthlyBill: null,
    exportRatePerKwh: minorUnits(0),
    netCost: minorUnits(9_000_000),
    incentive: null,
    freshness: null,
    ...over,
  };
}

describe('proposalSavings — units used on site at the tariff, never more than the bill (T-M06-033)', () => {
  it.each([
    ['no bill known: every unit is saved at the tariff', null, 0, 3_600_000, 300_000],
    ['a bill above what the system makes: all of it saved', 400_000, 0, 3_600_000, 300_000],
    ['a bill of ₹3,000 exactly', 300_000, 0, 3_600_000, 300_000],
    /* ₹35,999.88 a year is an estimate: it is stated as ₹36,000, its month as ₹3,000. */
    ['a bill of ₹2,999.99: a paisa under caps it', 299_999, 0, 3_600_000, 300_000],
    ['a bill of ₹2,000 caps the saving at the bill', 200_000, 0, 2_400_000, 200_000],
    [
      'exported units earn the export rate, still never past the bill',
      200_000,
      500,
      2_400_000,
      200_000,
    ],
    ['a zero bill saves nothing', 0, 0, 0, 0],
  ])('%s', (_, bill, exportRate, yearly, monthly) => {
    const savings = proposalSavings(
      input({
        monthlyBill: bill === null ? null : minorUnits(bill),
        exportRatePerKwh: minorUnits(exportRate),
      }),
    );
    expect(savings.yearly).toBe(yearly);
    expect(savings.monthly).toBe(monthly);
  });

  it('exported units below the bill are valued at the export rate', () => {
    /* ₹1,000 of bill is 100 units used at ₹10; the other 200 earn ₹2 each: ₹1,400, capped at ₹1,000. */
    const capped = proposalSavings(
      input({ monthlyBill: minorUnits(100_000), exportRatePerKwh: minorUnits(200) }),
    );
    expect(capped.yearly).toBe(1_200_000);
  });

  it('with a tariff of nothing, the bill cannot be read as units, so nothing is capped', () => {
    const savings = proposalSavings(
      input({
        financials: { tariffPerKwh: minorUnits(0), tariffRise: basisPoints(0), horizonYears: 25 },
        monthlyBill: minorUnits(100_000),
      }),
    );
    expect(savings.yearly).toBe(0);
  });

  it('the bill with solar is what an average month leaves, never below nothing', () => {
    expect(proposalSavings(input({ monthlyBill: minorUnits(420_000) })).billWithSolar).toBe(
      120_000,
    );
    expect(proposalSavings(input({ monthlyBill: minorUnits(200_000) })).billWithSolar).toBe(0);
    expect(proposalSavings(input()).billWithSolar).toBeNull();
  });
});

describe('proposalSavings — an estimate is stated to the whole major unit of the currency', () => {
  /* One month makes ₹12,345.50 at ₹0.10 a unit; the other eleven make nothing. */
  const ONE_MONTH = [123_455, ...Array.from({ length: 11 }, () => 0)];

  it.each([
    ['the currency of the pack: 2 digits, a rupee is 100 paise', 2, 100],
    ['a currency with 3 digits', 3, 1000],
    ['a currency with no minor unit', 0, 1],
  ])('%s — every saving figure is whole', (_, digits, whole) => {
    const savings = proposalSavings(
      input({
        formats: { ...IN_FORMATS, minorUnitDigits: digits },
        monthlyKwh: Array.from({ length: 12 }, () => 301.37),
        monthlyBill: minorUnits(299_999),
        financials: {
          tariffPerKwh: minorUnits(1037),
          tariffRise: basisPoints(300),
          horizonYears: 7,
        },
      }),
    );
    const figures = [savings.yearly, savings.monthly, savings.lifetime, ...savings.cumulative];
    for (const amount of [...figures, savings.billWithSolar ?? 0]) expect(amount % whole).toBe(0);
  });

  it.each([
    ['half a rupee rounds up', 123_455, 1_234_600],
    ['a paisa under half rounds down', 123_454.9, 1_234_500],
    ['a whole figure stays as it is', 123_400, 1_234_000],
  ])('%s', (_, kwh, yearly) => {
    const savings = proposalSavings(
      input({
        monthlyKwh: [kwh, ...ONE_MONTH.slice(1)],
        financials: { tariffPerKwh: minorUnits(10), tariffRise: basisPoints(0), horizonYears: 1 },
      }),
    );
    expect(savings.yearly).toBe(yearly);
    expect(savings.lifetime).toBe(yearly);
  });

  it('the bill left after solar is whole too, and never below nothing', () => {
    const left = proposalSavings(input({ monthlyBill: minorUnits(420_049) }));
    expect(left.billWithSolar).toBe(120_000);
  });
});

describe('proposalSavings — the lifetime and the payback (M06-11)', () => {
  it('with no rise, the lifetime is the year times the horizon and the payback a plain division', () => {
    const savings = proposalSavings(input());
    expect(savings.lifetime).toBe(3_600_000 * 25);
    expect(savings.cumulative).toHaveLength(25);
    expect(savings.cumulative[0]).toBe(3_600_000);
    expect(savings.paybackYears).toBe(2.5);
  });

  it('a rising tariff grows each year’s saving, so the payback comes sooner', () => {
    const rising = proposalSavings(
      input({
        financials: {
          tariffPerKwh: minorUnits(1000),
          tariffRise: basisPoints(1000),
          horizonYears: 3,
        },
      }),
    );
    /* 36,000 + 39,600 + 43,560. */
    expect(rising.cumulative).toEqual([3_600_000, 7_560_000, 11_916_000]);
    expect(rising.lifetime).toBe(11_916_000);
    /* 90,000 − 75,600 = 14,400 left of the third year's 43,560. */
    expect(rising.paybackYears).toBeCloseTo(2 + 14_400 / 43_560, 10);
  });

  it.each([
    ['nothing saved: no payback', { monthlyKwh: Array.from({ length: 12 }, () => 0) }, null],
    ['a net cost of nothing is paid back at once', { netCost: minorUnits(0) }, 0],
    [
      'the horizon ends first: no payback is claimed',
      {
        netCost: minorUnits(900_000_000),
        financials: {
          tariffPerKwh: minorUnits(1000),
          tariffRise: basisPoints(0),
          horizonYears: 25,
        },
      },
      null,
    ],
  ])('%s', (_, over, years) => {
    expect(proposalSavings(input(over)).paybackYears).toBe(years);
  });

  it('a horizon of no years has no lifetime to state', () => {
    const none = proposalSavings(
      input({
        financials: { tariffPerKwh: minorUnits(1000), tariffRise: basisPoints(0), horizonYears: 0 },
      }),
    );
    expect(none.lifetime).toBe(0);
    expect(none.cumulative).toEqual([]);
  });
});

describe('proposalSavings — every figure is a labelled projection (F8-23, M06-11)', () => {
  it('reads estimated, carries its source and states its assumptions', () => {
    const savings = proposalSavings(input({ incentive: minorUnits(7_800_000) }));
    expect(savings.assumptions).toEqual({
      horizonYears: 25,
      escalationRate: 0,
      incentive: 7_800_000,
    });
    expect(savings.figures.yearly).toMatchObject({
      tier: 'estimated',
      text: '₹36,000.00',
      energySource: { kind: 'record', databases: ['ERA5'] },
      projection: savings.assumptions,
    });
    expect(savings.figures.monthly.text).toBe('₹3,000.00');
    expect(savings.figures.lifetime.projection).toBe(savings.assumptions);
  });

  it('with no incentive, none is stated', () => {
    expect(proposalSavings(input()).assumptions).toEqual({ horizonYears: 25, escalationRate: 0 });
  });

  it('a saving computed from the built-in estimate never reads final (F8-10)', () => {
    const savings = proposalSavings(input({ source: { kind: 'estimate' } }));
    expect(savings.figures.yearly.standing).toBe('provisional');
  });
});

describe('proposalEmi — the example, never a loan offer (M06-40)', () => {
  it('₹1,90,575 at 9.5% a year over 60 months', () => {
    const emi = proposalEmi(
      IN_FORMATS,
      minorUnits(19_057_500),
      { rate: basisPoints(950), tenureYears: 5 },
      null,
    );
    expect(emi?.months).toBe(60);
    expect(emi?.monthly).toBe(400_243);
    expect(emi?.assumptions).toEqual({ horizonYears: 5, interestRate: 950 });
    expect(emi?.figure).toMatchObject({ tier: 'assumed', projection: emi?.assumptions });
  });

  it.each([
    ['no interest: the payable in equal parts', 1_200_000, 0, 1, 100_000],
    ['an 18-month tenure', 1_800_000, 0, 1.5, 100_000],
  ])('%s', (_, payable, rate, years, monthly) => {
    const emi = proposalEmi(
      IN_FORMATS,
      minorUnits(payable),
      { rate: basisPoints(rate), tenureYears: years },
      null,
    );
    expect(emi?.monthly).toBe(monthly);
  });

  it.each([
    ['nothing to repay', 0, 5],
    ['a negative payable', -100, 5],
    ['no months to repay in', 1_000_000, 0],
  ])('%s: no example', (_, payable, years) => {
    expect(
      proposalEmi(
        IN_FORMATS,
        minorUnits(payable),
        { rate: basisPoints(950), tenureYears: years },
        null,
      ),
    ).toBeNull();
  });
});
