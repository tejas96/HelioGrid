import type { TranslatedText } from '@heliogrid/contracts';
import { FIGURE_SLOT } from '@heliogrid/domain';
import type { BillingFact, BillingNeedRow, BillingValue } from './BillingHome.types';

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
  const pieces = sentence.split(FIGURE_SLOT);
  return pieces.flatMap((words, index) => {
    const filled = index < pieces.length - 1 ? figures[index] : undefined;
    return [
      ...(words === '' ? [] : [{ text: words, mono: false }]),
      ...(filled === undefined ? [] : [{ text: filled, mono: true }]),
    ];
  });
}

export function fact(key: string, label: TranslatedText, value: string): BillingFact {
  return { key, label, value: plain(value), under: null };
}

/** A `Needs you` row whose figure is a date: no chip, no line. */
export function dateRow(key: string, title: TranslatedText, date: string): BillingNeedRow {
  return { key, title, chip: null, figure: plain(date), line: null };
}
