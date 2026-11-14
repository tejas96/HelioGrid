import { describe, expect, it } from 'vitest';
import { putInForceWords } from '../src/copy/proposal-after-in-force';
import { createTranslator } from '../src/runtime';

const formats = {
  money: String,
  due: (stage: string) =>
    ({ dispatched: 'Before dispatch', commissioned: 'On commissioning' })[stage] ?? stage,
  day: () => '14 Nov 2026',
};

type Part = Parameters<ReturnType<typeof putInForceWords>['part']>[0];
const part = (facts: Partial<Part>): Part =>
  ({
    label: 'Material',
    amount: '171565.00',
    state: 'new',
    dueOnStage: 'dispatched',
    shareOfRest: null,
    paidOn: null,
    ...facts,
  }) as Part;

describe('Put in force names when each part of the new plan falls (M08-50, M11-14)', () => {
  it.each<[string, Partial<Part>, string | null]>([
    [
      'a kept part says the day it was paid',
      { state: 'paid', paidOn: '2026-11-14', dueOnStage: 'won' },
      'Paid 14 Nov 2026 · receipt kept',
    ],
    [
      'a part paid in part says it too',
      { state: 'part_paid', paidOn: '2026-11-14' },
      'Paid 14 Nov 2026 · receipt kept',
    ],
    ['a kept part with no payment (waived) says nothing', { state: 'paid', paidOn: null }, null],
    [
      'a new part says its stage and share of what is left',
      { shareOfRest: '60.00' },
      'Before dispatch · 60% of what is left',
    ],
    [
      'a share keeps its fraction',
      { shareOfRest: '33.33' },
      'Before dispatch · 33.33% of what is left',
    ],
    [
      'the last new part takes the rest',
      { dueOnStage: 'commissioned' },
      'On commissioning · the rest',
    ],
    [
      'a new part with no stage says its share alone',
      { dueOnStage: null, shareOfRest: '60.00' },
      '60% of what is left',
    ],
  ])('%s', async (_, facts, line) => {
    const { t } = await createTranslator('en');
    const words = putInForceWords(t, formats, { version: 2, customerName: null, segment: null });
    const one = part(facts);
    expect(words.part(one, [one]).line).toBe(line);
  });
});
