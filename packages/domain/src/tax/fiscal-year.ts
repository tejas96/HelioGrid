import type { TaxPack } from './pack';

const SEQUENCE_DIGITS = 6;

/**
 * The statutory financial year a moment falls in, on the market's own clock (`F1-30`): a year that
 * opens in January is its calendar year (`2026`); any other is named by the two years it spans
 * (`2026-27`, the Indian year that opens 1 April 2026).
 */
export function fiscalYearOf(
  at: number,
  timeZone: string,
  startMonth: TaxPack['fiscalYearStartMonth'],
): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(at);
  const read = (type: 'year' | 'month'): number =>
    Number(
      parts
        .filter((part) => part.type === type)
        .map((part) => part.value)
        .join(''),
    );
  const year = read('year');
  const month = read('month');
  if (startMonth === 1) return String(year);
  const opens = month >= startMonth ? year : year - 1;
  return `${opens}-${String((opens + 1) % 100).padStart(2, '0')}`;
}

/**
 * A platform invoice's number: its fiscal year and its place in that year's one series
 * (`2026-27/000001`). The tax scheme asks for one consecutive series per year, so the caller
 * hands the next number of the year's counter; the server assigns it, never a device.
 */
export function invoiceNumber(fiscalYear: string, sequence: number): string {
  return `${fiscalYear}/${String(sequence).padStart(SEQUENCE_DIGITS, '0')}`;
}
