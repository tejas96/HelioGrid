import { describe, expect, it } from 'vitest';
import {
  type QualifyAnswers,
  type QualifyQuestion,
  qualifyCardOf,
  qualifyEditOf,
} from '../../src/crm/lead-qualify';

const ANSWERED: QualifyAnswers = {
  monthlyBill: '4200.00',
  roofOwnership: 'own',
  roofType: 'rcc_flat',
  shading: null,
  timeline: null,
  decisionMaker: null,
};

function questionOf(card: ReturnType<typeof qualifyCardOf>, question: QualifyQuestion) {
  const found = card.questions.find((each) => each.question === question);
  if (found === undefined) throw new Error(`no ${question} on the card`);
  return found;
}

describe('qualify inline on the lead (M02-39)', () => {
  it.each<[QualifyQuestion, string | null, object | null]>([
    ['monthlyBill', '5100', { monthlyBill: '5100' }],
    ['monthlyBill', null, { monthlyBill: null }],
    ['roofOwnership', 'rent', { roofOwnership: 'rent' }],
    ['roofType', 'tile', { roofType: 'tile' }],
    ['shading', 'heavy', { shading: 'heavy' }],
    ['timeline', 'later', { timeline: 'later' }],
    ['decisionMaker', 'someone_else', { decisionMaker: 'someone_else' }],
    ['shading', null, { shading: null }],
    ['roofType', 'thatch', null],
    ['decisionMaker', 'own', null],
  ])('answering %s with %s sends %j', (question, value, edit) => {
    expect(qualifyEditOf(question, value)).toEqual(edit);
  });

  it('an answer that fails keeps the others saved, and says so at its own question', () => {
    const card = qualifyCardOf(
      ANSWERED,
      { shading: { value: 'partial', status: 'failed' } },
      'roofType',
    );
    const shading = questionOf(card, 'shading');
    expect(shading.save).toEqual({ value: 'partial', status: 'failed' });
    expect(shading.shown).toBeNull();
    expect(card.answered).toBe(3);
    const others = card.questions.filter((each) => each.question !== 'shading');
    expect(others.every((each) => each.save === null)).toBe(true);
    expect(questionOf(card, 'roofType').shown).toBe('rcc_flat');
  });

  it.each<[string, 'saving' | 'failed' | null, string | null, boolean]>([
    ['the answer on its way shows as chosen while it saves', 'saving', 'partial', false],
    ['an answer back unsaved shows the record again', 'failed', null, false],
    ['the answer that landed last carries the Saved mark', null, null, true],
  ])('%s', (_, status, shown, savedMark) => {
    const saves = status === null ? {} : { shading: { value: 'partial', status } };
    const card = qualifyCardOf(ANSWERED, saves, 'shading');
    expect(questionOf(card, 'shading').shown).toBe(shown);
    expect(questionOf(card, 'shading').savedMark).toBe(savedMark);
  });

  it('the bill is typed and every other question offers its own answers in order', () => {
    const card = qualifyCardOf(ANSWERED, {}, null);
    expect(card.questions.map((each) => [each.question, each.choices.length])).toEqual([
      ['monthlyBill', 0],
      ['roofOwnership', 2],
      ['roofType', 4],
      ['shading', 3],
      ['timeline', 4],
      ['decisionMaker', 2],
    ]);
  });
});
