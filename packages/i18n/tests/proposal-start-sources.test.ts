import { describe, expect, it } from 'vitest';
import { proposalStartSources } from '../src/copy/proposal-builder-flow';
import { createTranslator } from '../src/runtime';

const formats = {
  money: (amount: string) => `₹${amount}`,
  number: (value: number) => String(value),
  ago: () => '4 days ago',
};

function row(standing: string) {
  return {
    id: 'p1',
    customerName: 'Meena Deshpande',
    capacityKw: 5,
    payable: '310000',
    standing,
    latest: { at: '2026-11-10T10:00:00.000Z' },
  };
}

/* The start sheet's *or start from* row says where the source stands, as the design draws it. */
describe('a recent proposal row carries its size, price and where it stands', () => {
  it.each<[string, string]>([
    ['draft', '5 kW · ₹310000 · saved 4 days ago'],
    ['ready', '5 kW · ₹310000 · made 4 days ago'],
    ['shared', '5 kW · ₹310000 · sent 4 days ago'],
    ['negotiating', '5 kW · ₹310000 · sent 4 days ago'],
    ['accepted', '5 kW · ₹310000 · accepted'],
    ['won', '5 kW · ₹310000 · won'],
    ['a standing a newer server learned', '5 kW · ₹310000 · sent 4 days ago'],
  ])('%s', async (standing, line) => {
    const { t } = await createTranslator('en');
    const sources = proposalStartSources(t, formats, { kind: 'ready', value: [row(standing)] });
    expect(sources?.[0]?.line).toBe(line);
  });
});
