import { describe, expect, it } from 'vitest';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { invoiceTotals } from '../../src/tax/invoice-totals';

const RATE = basisPoints(1800);

describe('invoiceTotals — what an issued invoice prints under its lines', () => {
  it('sums each tax code once, in the order the lines carry it, and the total to the paisa', () => {
    const totals = invoiceTotals([
      {
        taxableAmount: minorUnits(299_900),
        rateBasisPoints: RATE,
        components: [
          { code: 'CGST', amount: minorUnits(26_991) },
          { code: 'SGST', amount: minorUnits(26_991) },
        ],
      },
      {
        taxableAmount: minorUnits(1_001),
        rateBasisPoints: RATE,
        components: [
          { code: 'CGST', amount: minorUnits(90) },
          { code: 'SGST', amount: minorUnits(90) },
        ],
      },
    ]);
    expect(totals).toEqual({
      subtotal: minorUnits(300_901),
      taxByCode: [
        { code: 'CGST', amount: minorUnits(27_081) },
        { code: 'SGST', amount: minorUnits(27_081) },
      ],
      total: minorUnits(355_063),
    });
  });

  it('a plain invoice has no tax rows and totals its lines', () => {
    const totals = invoiceTotals([
      { taxableAmount: minorUnits(299_900), rateBasisPoints: null, components: [] },
    ]);
    expect(totals).toEqual({
      subtotal: minorUnits(299_900),
      taxByCode: [],
      total: minorUnits(299_900),
    });
  });
});
