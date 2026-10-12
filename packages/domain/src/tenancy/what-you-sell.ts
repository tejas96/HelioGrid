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

/**
 * The step as a device holds it until `Continue` (`SCR-M01-04`): what the person answered here,
 * which questions they answered themselves, and where `Continue` was last refused.
 */
export interface WhatYouSellStep {
  /** The answers given on this screen; a stored declaration fills the rest (`whatYouSellAnswers`). */
  readonly given: WhatYouSellAnswers;
  readonly touched: readonly WhatYouSellQuestion[];
  readonly refusedAt: readonly WhatYouSellQuestion[];
  /**
   * How many times `Continue` was refused. It rises in the move that names the questions: a screen
   * answers each new count once, at the first question named, and a count that rose alone would be
   * answered by nothing.
   */
  readonly refusals: number;
}

export const WHAT_YOU_SELL_STEP_AT_OPEN: WhatYouSellStep = {
  given: { segment: null, typicalSystemKwp: null },
  touched: [],
  refusedAt: [],
  refusals: 0,
};

/** `stored` is the company's declaration as read, or null while no read has answered. */
export type WhatYouSellEvent =
  | { readonly type: 'segment-chosen'; readonly segment: TenantSegment }
  | { readonly type: 'size-declared'; readonly kwp: number }
  | { readonly type: 'continue-pressed'; readonly stored: WhatYouSellAnswers | null };

export function whatYouSellStep(step: WhatYouSellStep, event: WhatYouSellEvent): WhatYouSellStep {
  switch (event.type) {
    case 'segment-chosen':
      return answered(step, 'segment', { ...step.given, segment: event.segment });
    case 'size-declared':
      return answered(step, 'size', { ...step.given, typicalSystemKwp: event.kwp });
    case 'continue-pressed': {
      const owed = whatYouSellUnanswered(whatYouSellAnswers(step, event.stored));
      return { ...step, refusedAt: owed, refusals: step.refusals + (owed.length > 0 ? 1 : 0) };
    }
  }
}

function answered(
  step: WhatYouSellStep,
  question: WhatYouSellQuestion,
  given: WhatYouSellAnswers,
): WhatYouSellStep {
  const touched = step.touched.includes(question) ? step.touched : [...step.touched, question];
  return { ...step, given, touched };
}

/** The two answers the screen shows and `Continue` saves. */
export function whatYouSellAnswers(
  step: WhatYouSellStep,
  stored: WhatYouSellAnswers | null,
): WhatYouSellAnswers {
  return stored === null ? step.given : whatYouSellAfterRead(step.given, step.touched, stored);
}

/** The questions the last `Continue` was refused at and that are still owed — each shows its fix. */
export function whatYouSellRefused(
  step: WhatYouSellStep,
  stored: WhatYouSellAnswers | null,
): readonly WhatYouSellQuestion[] {
  const owed = whatYouSellUnanswered(whatYouSellAnswers(step, stored));
  return step.refusedAt.filter((question) => owed.includes(question));
}
