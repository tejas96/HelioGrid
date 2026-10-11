import type { TenantSegment } from './segment';

/**
 * The typical system size an EPC declares (`M01-23`), in kWp. The precision and the ceiling are the
 * stored column's — two decimals under one million — so a figure outside them cannot be stored and
 * no screen may send one.
 */
export const TYPICAL_SYSTEM_KWP = { precision: 2, ceiling: 999_999.99 } as const;

/** The step's two questions, in the order the screen asks them. */
const WHAT_YOU_SELL_QUESTIONS = ['segment', 'size'] as const;
export type WhatYouSellQuestion = (typeof WHAT_YOU_SELL_QUESTIONS)[number];

/** The two declarations as a device holds them: null until declared. */
export interface WhatYouSellAnswers {
  readonly segment: TenantSegment | null;
  readonly typicalSystemKwp: number | null;
}

/**
 * A figure a company can declare: above nothing, and one the column holds. A declared 0 is no
 * declaration. Only the range is judged here: the field that takes the figure rounds it to the
 * precision first, so a caller with no such field rounds before it asks.
 */
export function isTypicalSystemSize(kwp: number | null): kwp is number {
  return kwp !== null && kwp > 0 && kwp <= TYPICAL_SYSTEM_KWP.ceiling;
}

/** The questions still owed, in the screen's order — where `Continue` refuses. */
export function whatYouSellUnanswered(answers: WhatYouSellAnswers): readonly WhatYouSellQuestion[] {
  return WHAT_YOU_SELL_QUESTIONS.filter((question) =>
    question === 'segment'
      ? answers.segment === null
      : !isTypicalSystemSize(answers.typicalSystemKwp),
  );
}

/**
 * The answers once the company's stored declaration lands. It fills only a question the person has
 * not touched, so nothing changes under a finger (`SCR-M01-04` decision 9); a stored size that is
 * not one fills nothing, and the question stays owed.
 */
export function whatYouSellAfterRead(
  held: WhatYouSellAnswers,
  touched: readonly WhatYouSellQuestion[],
  stored: WhatYouSellAnswers,
): WhatYouSellAnswers {
  const storedSize = isTypicalSystemSize(stored.typicalSystemKwp) ? stored.typicalSystemKwp : null;
  return {
    segment: touched.includes('segment') ? held.segment : stored.segment,
    typicalSystemKwp: touched.includes('size') ? held.typicalSystemKwp : storedSize,
  };
}
