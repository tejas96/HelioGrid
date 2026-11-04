import { labelRunsOf } from '../Button/Button.logic';
import type { BillingValue } from './BillingStrip.types';

/** Words alone. */
export function plain(text: string): BillingValue {
  return [{ text, mono: false }];
}

/** A figure alone, in mono (`F7-09`). */
export function figure(text: string): BillingValue {
  return [{ text, mono: true }];
}

/** A sentence with its `FIGURE_SLOT`s filled, each figure in mono where the translation put it. */
export function figured(sentence: string, ...figures: readonly string[]): BillingValue {
  return labelRunsOf(sentence, figures);
}
