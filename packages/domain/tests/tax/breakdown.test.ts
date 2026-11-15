import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import {
  inclusiveTaxBreakdown,
  type TaxableLine,
  type TaxComponentAmount,
  taxBreakdown,
} from '../../src/tax/breakdown';

/** Under GST a place of supply is the two-digit state code. */
const MAHARASHTRA = '27';
const KARNATAKA = '29';
const INTRA_STATE = { supplier: MAHARASHTRA, recipient: MAHARASHTRA };
const INTER_STATE = { supplier: MAHARASHTRA, recipient: KARNATAKA };

function line(taxableAmount: number, rateBasisPoints: number): TaxableLine {
  return {
    taxableAmount: minorUnits(taxableAmount),
    rateBasisPoints: basisPoints(rateBasisPoints),
  };
}

function byCode(components: readonly TaxComponentAmount[]): Record<string, number> {
  return Object.fromEntries(components.map((component) => [component.code, component.amount]));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe('taxBreakdown — the one tax computation (F1-31, M11-08)', () => {
  it('stamps the document currency once, from the pack (F1-07)', () => {
    expect(taxBreakdown(IN_PACK, [], INTRA_STATE).currency).toBe('INR');
  });

  it.each([
    ['the same state', INTRA_STATE, { CGST: 9_000, SGST: 9_000 }],
    ['different states', INTER_STATE, { IGST: 18_000 }],
  ])(
    '₹1,000.00 at 18% between %s splits per the place-of-supply rule (F1-29)',
    (_, place, expected) => {
      const document = taxBreakdown(IN_PACK, [line(100_000, 1800)], place);
      expect(byCode(document.components)).toEqual(expected);
      expect(document.lines.map((taxed) => byCode(taxed.components))).toEqual([expected]);
      expect(document.taxAmount).toBe(18_000);
      expect(document.totalAmount).toBe(118_000);
    },
  );

  it.each([
    ['the same state', INTRA_STATE, { CGST: 1, SGST: 1 }, 2],
    ['different states', INTER_STATE, { IGST: 1 }, 1],
  ])(
    'one paisa at 100% between %s: each component rounds on its own, the line is their sum',
    (_, place, expected, taxAmount) => {
      const document = taxBreakdown(IN_PACK, [line(1, 10_000)], place);
      expect(byCode(document.components)).toEqual(expected);
      expect(document.taxAmount).toBe(taxAmount);
    },
  );

  it('sums lines at mixed rates to the paisa', () => {
    const lines = [line(100_000, 1800), line(50_000, 1200), line(1, 500)];
    const document = taxBreakdown(IN_PACK, lines, INTER_STATE);
    expect(document.lines.map((taxed) => taxed.taxAmount)).toEqual([18_000, 6_000, 0]);
    expect(document.taxableAmount).toBe(150_001);
    expect(document.taxAmount).toBe(24_000);
    expect(document.totalAmount).toBe(174_001);
  });

  it('a zero-rate line and an empty document still carry the component rows, at zero', () => {
    const zeroRate = taxBreakdown(IN_PACK, [line(100_000, 0)], INTRA_STATE);
    expect(byCode(zeroRate.components)).toEqual({ CGST: 0, SGST: 0 });
    const empty = taxBreakdown(IN_PACK, [], INTRA_STATE);
    expect(byCode(empty.components)).toEqual({ CGST: 0, SGST: 0 });
    expect([empty.taxableAmount, empty.taxAmount, empty.totalAmount]).toEqual([0, 0, 0]);
  });

  it('a credit line carries the negative of the charge, paisa for paisa', () => {
    const charge = taxBreakdown(IN_PACK, [line(100_003, 1800)], INTER_STATE);
    const credit = taxBreakdown(IN_PACK, [line(-100_003, 1800)], INTER_STATE);
    expect(charge.taxAmount).toBe(18_001);
    expect(credit.taxAmount).toBe(-charge.taxAmount);
    expect(credit.totalAmount).toBe(-charge.totalAmount);
  });

  const MIXED = [line(100_003, 1800), line(77_777, 1200), line(1, 500), line(-5, 2800)];

  it.each([
    ['the same state', INTRA_STATE],
    ['different states', INTER_STATE],
  ])(
    'every total is the sum of the parts beneath it, never a second computation (%s)',
    (_, place) => {
      const document = taxBreakdown(IN_PACK, MIXED, place);
      for (const taxed of document.lines) {
        expect(taxed.taxAmount).toBe(sum(taxed.components.map((component) => component.amount)));
      }
      expect(document.taxAmount).toBe(sum(document.lines.map((taxed) => taxed.taxAmount)));
      expect(document.taxAmount).toBe(
        sum(document.components.map((component) => component.amount)),
      );
      expect(document.totalAmount).toBe(document.taxableAmount + document.taxAmount);
    },
  );

  it('refuses a document_level scheme until a pack declares one', () => {
    const scheme = { ...IN_PACK, tax: { ...IN_PACK.tax, strategy: 'document_level' as const } };
    expect(() => taxBreakdown(scheme, [], INTRA_STATE)).toThrow(/document_level/);
  });
});

describe('inclusiveTaxBreakdown — a typed price is the authority (T-M06-024)', () => {
  const typed = (inclusiveAmount: number, rateBasisPoints: number) => ({
    inclusiveAmount: minorUnits(inclusiveAmount),
    rateBasisPoints: basisPoints(rateBasisPoints),
  });

  it('₹1,90,575 at 8.9% is ₹1,75,000 and ₹15,575, split in halves', () => {
    const breakdown = inclusiveTaxBreakdown(IN_PACK, [typed(19_057_500, 890)], INTRA_STATE);
    expect(breakdown.taxableAmount).toBe(17_500_000);
    expect(breakdown.taxAmount).toBe(1_557_500);
    expect(breakdown.totalAmount).toBe(19_057_500);
    expect(byCode(breakdown.components)).toEqual({ CGST: 778_750, SGST: 778_750 });
    expect(breakdown.currency).toBe('INR');
  });

  it('an inter-state supply carries the one component', () => {
    const breakdown = inclusiveTaxBreakdown(IN_PACK, [typed(19_057_500, 890)], INTER_STATE);
    expect(byCode(breakdown.components)).toEqual({ IGST: 1_557_500 });
  });

  it.each([1, 99, 100, 101, 10_890, 12_345_67, 99_999_99, 33_333_33])(
    'a price of %i paise adds up to exactly what was typed, line and document',
    (inclusive) => {
      const breakdown = inclusiveTaxBreakdown(IN_PACK, [typed(inclusive, 890)], INTRA_STATE);
      const [only] = breakdown.lines;
      expect(breakdown.totalAmount).toBe(inclusive);
      expect((only?.taxableAmount ?? 0) + (only?.taxAmount ?? 0)).toBe(inclusive);
      expect(sum(breakdown.components.map((component) => component.amount))).toBe(
        breakdown.taxAmount,
      );
    },
  );

  it('an odd paisa of tax goes to the last component, never lost', () => {
    /* ₹1.09 at 8.9%: ₹1.00 and 9 paise of tax — 5 and 4 would be 4.5 each rounded up twice. */
    const breakdown = inclusiveTaxBreakdown(IN_PACK, [typed(109, 890)], INTRA_STATE);
    expect(breakdown.taxAmount).toBe(9);
    expect(byCode(breakdown.components)).toEqual({ CGST: 5, SGST: 4 });
  });

  it('two lines keep their own rates, and the document is their sum', () => {
    const breakdown = inclusiveTaxBreakdown(
      IN_PACK,
      [typed(10_890_000, 890), typed(5_900_000, 1800)],
      INTRA_STATE,
    );
    expect(breakdown.lines.map((line) => [line.taxableAmount, line.taxAmount])).toEqual([
      [10_000_000, 890_000],
      [5_000_000, 900_000],
    ]);
    expect(breakdown.taxableAmount).toBe(15_000_000);
    expect(byCode(breakdown.components)).toEqual({ CGST: 895_000, SGST: 895_000 });
  });

  it('a line at no rate carries no tax', () => {
    const breakdown = inclusiveTaxBreakdown(IN_PACK, [typed(12_345, 0)], INTRA_STATE);
    expect(breakdown.taxableAmount).toBe(12_345);
    expect(breakdown.taxAmount).toBe(0);
  });

  it('no lines is a document of nothing', () => {
    const breakdown = inclusiveTaxBreakdown(IN_PACK, [], INTRA_STATE);
    expect(breakdown.totalAmount).toBe(0);
    expect(byCode(breakdown.components)).toEqual({ CGST: 0, SGST: 0 });
  });
});
