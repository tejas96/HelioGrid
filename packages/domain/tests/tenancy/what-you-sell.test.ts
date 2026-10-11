import { describe, expect, it } from 'vitest';
import {
  isTypicalSystemSize,
  TYPICAL_SYSTEM_KWP,
  type WhatYouSellAnswers,
  whatYouSellAfterRead,
  whatYouSellUnanswered,
} from '../../src/tenancy/what-you-sell';

const nothing: WhatYouSellAnswers = { segment: null, typicalSystemKwp: null };

describe('isTypicalSystemSize — what counts as a declared size (M01-23)', () => {
  it.each([
    { kwp: 0.01, why: 'the smallest figure two decimals hold' },
    { kwp: 5, why: 'a home' },
    { kwp: TYPICAL_SYSTEM_KWP.ceiling, why: 'the largest figure the column holds' },
  ])('takes $kwp — $why', ({ kwp }) => {
    expect(isTypicalSystemSize(kwp)).toBe(true);
  });

  it.each([
    { kwp: null, why: 'nothing was declared' },
    { kwp: 0, why: 'a declared 0 is no declaration' },
    { kwp: -1, why: 'no system is smaller than nothing' },
    { kwp: TYPICAL_SYSTEM_KWP.ceiling + 0.01, why: 'the column cannot hold it' },
    { kwp: Number.NaN, why: 'it is not a figure' },
    { kwp: Number.POSITIVE_INFINITY, why: 'it is not a figure' },
  ])('refuses $kwp — $why', ({ kwp }) => {
    expect(isTypicalSystemSize(kwp)).toBe(false);
  });
});

describe('whatYouSellUnanswered — the questions Continue refuses at, in the screen’s order', () => {
  it.each([
    { answers: nothing, owed: ['segment', 'size'] },
    { answers: { segment: 'both', typicalSystemKwp: null }, owed: ['size'] },
    { answers: { segment: 'ci', typicalSystemKwp: 0 }, owed: ['size'] },
    { answers: { segment: null, typicalSystemKwp: 5 }, owed: ['segment'] },
    { answers: { segment: 'residential', typicalSystemKwp: 5 }, owed: [] },
  ] as const)('owes $owed for $answers', ({ answers, owed }) => {
    expect(whatYouSellUnanswered(answers)).toEqual(owed);
  });
});

describe('whatYouSellAfterRead — a stored declaration never changes an answer under a finger', () => {
  const stored: WhatYouSellAnswers = { segment: 'ci', typicalSystemKwp: 250 };

  it('fills both questions when neither was touched', () => {
    expect(whatYouSellAfterRead(nothing, [], stored)).toEqual(stored);
  });

  it.each([
    {
      touched: ['segment'],
      held: { segment: 'residential', typicalSystemKwp: null },
      after: { segment: 'residential', typicalSystemKwp: 250 },
    },
    {
      touched: ['size'],
      held: { segment: null, typicalSystemKwp: 5 },
      after: { segment: 'ci', typicalSystemKwp: 5 },
    },
    {
      touched: ['segment', 'size'],
      held: { segment: 'both', typicalSystemKwp: 8 },
      after: { segment: 'both', typicalSystemKwp: 8 },
    },
  ] as const)('keeps what was touched: $touched', ({ touched, held, after }) => {
    expect(whatYouSellAfterRead(held, touched, stored)).toEqual(after);
  });

  it.each([0, TYPICAL_SYSTEM_KWP.ceiling + 1])(
    'fills no size from a stored %s, which is not one',
    (kwp) => {
      expect(whatYouSellAfterRead(nothing, [], { segment: 'both', typicalSystemKwp: kwp })).toEqual(
        { segment: 'both', typicalSystemKwp: null },
      );
    },
  );

  it('leaves a company that declared nothing with nothing', () => {
    expect(whatYouSellAfterRead(nothing, [], nothing)).toEqual(nothing);
  });
});
