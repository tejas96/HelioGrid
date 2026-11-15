import { describe, expect, it } from 'vitest';
import { proposalVersionsWords } from '../src/copy/proposal-after-versions';
import { createTranslator } from '../src/runtime';

const formats = { money: String, number: String, when: () => 'Today' };

type Change = Parameters<ReturnType<typeof proposalVersionsWords>['change']>[0];

describe('a version change prints a coded value in its vocabulary words, never its code', () => {
  it.each([
    [
      'system_type',
      { kind: 'word', word: 'on_grid' },
      { kind: 'word', word: 'hybrid' },
      'On-grid',
      'Hybrid',
    ],
    [
      'maintenance',
      { kind: 'word', word: 'none' },
      { kind: 'word', word: 'free' },
      'Not included',
      'Free maintenance included',
    ],
    [
      'maintenance',
      { kind: 'word', word: 'free' },
      { kind: 'text', text: '3' },
      'Free maintenance included',
      '3-year plan included',
    ],
    // A type a newer server learned prints as sent rather than nothing.
    [
      'system_type',
      { kind: 'word', word: 'on_grid' },
      { kind: 'word', word: 'floating' },
      'On-grid',
      'floating',
    ],
  ])('%s: %o → %o', async (fact, from, to, saidFrom, saidTo) => {
    const { t } = await createTranslator('en');
    const words = proposalVersionsWords(t, formats);
    const said = words.change({ fact, from, to } as unknown as Change);
    expect([said.from, said.to]).toEqual([saidFrom, saidTo]);
  });
});
