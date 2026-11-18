import { describe, expect, it } from 'vitest';
import { proposalListWords } from '../src/copy/proposal-after-list';
import { createTranslator } from '../src/runtime';

/**
 * How a Proposals page row names its customer (`SCR-M06-19`, `T-M05-001b`): the name; else the
 * lead's number in the company's grouping, so two rows with no name still read apart; else that
 * the lead holds neither yet.
 */
const formats = {
  money: String,
  number: String,
  when: String,
  ago: String,
  phone: (e164: string) => `phone(${e164})`,
};

describe('a row names its customer by name, else by number', () => {
  it.each([
    ['a name', 'Kavita More', '+919188877123', 'Kavita More'],
    ['no name: the number, grouped', null, '+919188877123', 'phone(+919188877123)'],
    ['neither', null, null, 'No name yet'],
  ] as const)('%s', async (_, customerName, customerPhone, said) => {
    const { t } = await createTranslator('en');
    const words = proposalListWords(t, formats, null);
    expect(words.customer({ customerName, customerPhone })).toBe(said);
  });

  it('a design with no name is opened by its number', async () => {
    const { t } = await createTranslator('en');
    const words = proposalListWords(t, formats, null);
    const row = { customerName: null, customerPhone: '+919188877123' } as Parameters<
      typeof words.design.open
    >[0];
    expect(words.design.open(row)).toBe('Open the design for phone(+919188877123)');
  });
});
