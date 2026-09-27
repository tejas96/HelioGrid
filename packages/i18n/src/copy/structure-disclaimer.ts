import type { MessageRef } from '../runtime';

/**
 * What every structure-bearing output says it is and is not (`F8-28`): a material estimate and a
 * visual model, not a structural check, and an engineer verifies. A translation keeps every one of
 * those parts. It names no standard: a market's standard is its pack's engineering-standards label
 * (`F1-20`), printed beside this line by the sheet that carries both.
 */
export const STRUCTURE_DISCLAIMER: MessageRef = /*i18n*/ {
  id: 'This is a material estimate and a visual model, not a structural check. An engineer must verify the structure.',
};
