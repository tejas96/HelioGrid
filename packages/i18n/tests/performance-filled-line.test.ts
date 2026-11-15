import { describe, expect, it } from 'vitest';
import { proposalBuilderStepSaid } from '../src/copy/proposal-builder-screen';
import { createTranslator } from '../src/runtime';

/**
 * Step 4's filled card names the place and size the fill was asked for — the draft's own facts,
 * never a preview that may not exist yet (`M06-10`) — and leaves out a part the draft does not hold
 * rather than print a blank or a zero.
 */
describe('step 4’s filled line', () => {
  const facts = {
    name: 'Anil',
    taxName: 'GST',
    routingLabel: 'IFSC',
    energySource: 'PVGIS',
    snapshot: null,
    monthNames: [],
    format: { amount: String, number: String, phone: String },
    due: () => '' as never,
  };
  it.each([
    [{ place: 'Pune', capacityKw: 3 }, 'From PVGIS for Pune, for 3 kW'],
    [{ place: null, capacityKw: 3 }, 'From PVGIS, for 3 kW'],
    [{ place: 'Pune', capacityKw: null }, 'From PVGIS for Pune'],
    [{ place: null, capacityKw: null }, 'From PVGIS'],
  ])('asked %o reads %s', async (asked, line) => {
    const { t } = await createTranslator('en');
    const said = proposalBuilderStepSaid(t, facts, {
      step: 'performance',
      fill: 'source',
      fillWants: { size: false, state: false, refused: false },
      asked,
      edited: false,
    });
    expect(said.step === 'performance' && said.words.fillLine).toBe(line);
  });
});
