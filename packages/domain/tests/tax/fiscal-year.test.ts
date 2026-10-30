import { describe, expect, it } from 'vitest';
import { fiscalYearOf, invoiceNumber } from '../../src/tax/fiscal-year';

const KOLKATA = 'Asia/Kolkata';

describe('fiscalYearOf and invoiceNumber — a platform invoice’s number (M12-44, F1-30)', () => {
  it.each([
    { name: 'the last moment of March in India', at: '2027-03-31T18:29:59.999Z', year: '2026-27' },
    { name: 'the first moment of April in India', at: '2027-03-31T18:30:00.000Z', year: '2027-28' },
    { name: 'a day in October', at: '2026-10-30T06:00:00.000Z', year: '2026-27' },
    { name: 'a year that turns at the century', at: '2099-06-01T00:00:00.000Z', year: '2099-00' },
  ])('a number names the fiscal year its issue moment falls in: $name', ({ at, year }) => {
    expect(fiscalYearOf(Date.parse(at), KOLKATA, 4)).toBe(year);
  });

  it.each([
    { name: 'the last moment of a year', at: '2026-12-31T18:29:59.999Z', year: '2026' },
    { name: 'the first moment of the next', at: '2026-12-31T18:30:00.000Z', year: '2027' },
  ])('a year that opens in January is its calendar year: $name', ({ at, year }) => {
    expect(fiscalYearOf(Date.parse(at), KOLKATA, 1)).toBe(year);
  });

  it.each([
    { sequence: 1, number: '2026-27/000001' },
    { sequence: 999_999, number: '2026-27/999999' },
    { sequence: 1_000_000, number: '2026-27/1000000' },
  ])('number $sequence of the year reads $number', ({ sequence, number }) => {
    expect(invoiceNumber('2026-27', sequence)).toBe(number);
  });
});
