import { describe, expect, it } from 'vitest';
import { markWonBasisWords } from '../src/copy/proposal-after-won';
import { createTranslator } from '../src/runtime';

const formats = {
  money: (amount: string) => amount,
  when: (at: string) => at,
  due: (s: string) => s,
};

describe('Mark won prints each part of the accepted plan as a share a person reads (M07-62)', () => {
  it.each<[string, string]>([
    ['10.00', '10%'],
    ['12.50', '12.5%'],
    ['0.25', '0.25%'],
  ])('%s reads %s', async (percent, share) => {
    const { t } = await createTranslator('en');
    const basis = {
      basis: 'accepted_version',
      acceptance: null,
      finalValue: '190575.00',
      plan: [{ label: 'Advance', percent, dueOnStage: 'won', amount: '19057.50' }],
      siblingProposal: null,
    } as unknown as Parameters<typeof markWonBasisWords>[2];
    const words = markWonBasisWords(t, formats, basis, {
      customerName: null,
      segment: null,
      phone: null,
    });
    expect(words.plan[0]?.share).toBe(share);
  });
});
