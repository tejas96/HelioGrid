import { describe, expect, it } from 'vitest';
import { proposalDocumentSummary } from '../src/copy/proposal-document-head';
import { createTranslator } from '../src/runtime';

const format = { number: (value: number) => value.toLocaleString('en-IN') };

/* The document reader's one summary line: name · size · the year's energy, each only where held. */
describe('the document reader’s summary line', () => {
  it.each([
    [
      { customerName: 'Anil Sharma', capacityKw: 3, yearlyKwh: 4403.6 },
      'Anil Sharma · 3 kW · 4,404 kWh a year',
    ],
    [{ customerName: null, capacityKw: 3, yearlyKwh: null }, '3 kW'],
    [{ customerName: 'Anil Sharma', capacityKw: null, yearlyKwh: null }, 'Anil Sharma'],
    [{ customerName: null, capacityKw: null, yearlyKwh: null }, ''],
  ])('%o reads %s', async (facts, line) => {
    const { t } = await createTranslator('en');
    expect(proposalDocumentSummary(t, format, facts)).toBe(line);
  });

  it('kW and kWh stay untranslated in Hindi', async () => {
    const { t } = await createTranslator('hi');
    const line = proposalDocumentSummary(t, format, {
      customerName: null,
      capacityKw: 3,
      yearlyKwh: 4404,
    });
    expect(line).toMatch(/3 kW/);
    expect(line).toMatch(/4,404 kWh/);
  });
});
