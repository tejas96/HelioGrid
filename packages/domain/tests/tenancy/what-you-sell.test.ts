import { describe, expect, it } from 'vitest';
import {
  fitsTypicalSystemPrecision,
  isTypicalSystemSize,
  TYPICAL_SYSTEM_KWP,
  WHAT_YOU_SELL_STEP_AT_OPEN,
  type WhatYouSellAnswers,
  type WhatYouSellEvent,
  whatYouSellAfterRead,
  whatYouSellAnswers,
  whatYouSellRefused,
  whatYouSellStep,
  whatYouSellUnanswered,
} from '../../src/tenancy/what-you-sell';

const nothing: WhatYouSellAnswers = { segment: null, typicalSystemKwp: null };

describe('fitsTypicalSystemPrecision — a figure the column stores as written (M01-23)', () => {
  it.each([
    [0.01, true],
    [5.5, true],
    [TYPICAL_SYSTEM_KWP.ceiling, true],
    [0.004, false],
    [5.125, false],
    [1e-7, false],
  ])('%s kWp fits: %s', (kwp, fits) => {
    expect(fitsTypicalSystemPrecision(kwp)).toBe(fits);
  });
});

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

describe('whatYouSellStep — the step as a device holds it until Continue', () => {
  const stepAfter = (...events: readonly WhatYouSellEvent[]) =>
    events.reduce(whatYouSellStep, WHAT_YOU_SELL_STEP_AT_OPEN);
  const kind: WhatYouSellEvent = { type: 'segment-chosen', segment: 'residential' };
  const size: WhatYouSellEvent = { type: 'size-declared', kwp: 5 };
  const pressed: WhatYouSellEvent = { type: 'continue-pressed', stored: null };
  const stored: WhatYouSellAnswers = { segment: 'ci', typicalSystemKwp: 250 };

  it('opens with nothing answered, nothing touched and nothing refused', () => {
    expect(whatYouSellAnswers(WHAT_YOU_SELL_STEP_AT_OPEN, null)).toEqual(nothing);
    expect(WHAT_YOU_SELL_STEP_AT_OPEN.touched).toEqual([]);
    expect(WHAT_YOU_SELL_STEP_AT_OPEN.refusals).toBe(0);
  });

  it.each([
    {
      name: 'a kind chosen',
      events: [kind],
      touched: ['segment'],
      answers: { segment: 'residential', typicalSystemKwp: null },
    },
    {
      name: 'a size declared',
      events: [size],
      touched: ['size'],
      answers: { segment: null, typicalSystemKwp: 5 },
    },
    {
      name: 'a kind chosen twice',
      events: [kind, kind],
      touched: ['segment'],
      answers: { segment: 'residential', typicalSystemKwp: null },
    },
    {
      name: 'both answered',
      events: [size, kind],
      touched: ['size', 'segment'],
      answers: { segment: 'residential', typicalSystemKwp: 5 },
    },
  ] as const)('holds $name and marks it touched once', ({ events, touched, answers }) => {
    const step = stepAfter(...events);
    expect(step.touched).toEqual(touched);
    expect(whatYouSellAnswers(step, null)).toEqual(answers);
  });

  it('fills an untouched question from the stored declaration, and never a touched one', () => {
    expect(whatYouSellAnswers(stepAfter(kind), stored)).toEqual({
      segment: 'residential',
      typicalSystemKwp: 250,
    });
  });

  it.each([
    { name: 'nothing answered', events: [], refused: ['segment', 'size'], refusals: 1 },
    { name: 'the kind chosen', events: [kind], refused: ['size'], refusals: 1 },
    { name: 'the size declared', events: [size], refused: ['segment'], refusals: 1 },
    {
      name: 'a size of 0 declared',
      events: [kind, { type: 'size-declared', kwp: 0 }],
      refused: ['size'],
      refusals: 1,
    },
    { name: 'both answered', events: [kind, size], refused: [], refusals: 0 },
  ] as const)(
    'Continue with $name is refused at $refused, and the count rises with the questions',
    ({ events, refused, refusals }) => {
      const step = stepAfter(...events, pressed);
      expect(whatYouSellRefused(step, null)).toEqual(refused);
      expect(step.refusals).toBe(refusals);
    },
  );

  it('counts each refusal, so the same questions refused again are answered again', () => {
    expect(stepAfter(pressed, pressed).refusals).toBe(2);
  });

  it('is not refused at a question the stored declaration answers', () => {
    const step = whatYouSellStep(stepAfter(kind), { type: 'continue-pressed', stored });
    expect(whatYouSellRefused(step, stored)).toEqual([]);
    expect(step.refusals).toBe(0);
  });

  it('drops a refused question once it is answered, and keeps the one still owed', () => {
    const step = stepAfter(pressed, kind);
    expect(whatYouSellRefused(step, null)).toEqual(['size']);
    expect(step.refusals).toBe(1);
  });

  it('forgets the last refusal when Continue is pressed with both answered', () => {
    const step = stepAfter(pressed, kind, size, pressed);
    expect(whatYouSellRefused(step, null)).toEqual([]);
    expect(step.refusals).toBe(1);
  });
});
