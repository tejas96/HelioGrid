import type { TranslatedText } from '@heliogrid/contracts';
import type { TenantSegment, WhatYouSellQuestion } from '@heliogrid/domain';
import { useEffect, useRef } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { SetupWhatYouSellWords } from './SetupWhatYouSell.types';

/** A question a refusal marks, with the one line that fixes it. */
export interface RefusedQuestion {
  question: WhatYouSellQuestion;
  error: TranslatedText;
}

/** The first question the words mark as refused, in the screen's order. */
export function firstRefused(
  words: Pick<SetupWhatYouSellWords, 'groupError' | 'sizeError'>,
): RefusedQuestion | null {
  if (words.groupError !== null) return { question: 'segment', error: words.groupError };
  if (words.sizeError !== null) return { question: 'size', error: words.sizeError };
  return null;
}

/**
 * Answers each refusal once, the way its platform does. Only a new refusal is answered: a render
 * that changes the words alone — a card chosen after the refusal — moves nothing.
 */
export function useRefusalAnswer(
  refusals: number,
  words: Pick<SetupWhatYouSellWords, 'groupError' | 'sizeError'>,
  answer: (refused: RefusedQuestion) => void,
): void {
  const answered = useRef(refusals);
  const latest = useRef({ words, answer });
  latest.current = { words, answer };
  useEffect(() => {
    if (refusals === answered.current) return;
    answered.current = refusals;
    const refused = firstRefused(latest.current.words);
    if (refused !== null) latest.current.answer(refused);
  }, [refusals]);
}

/** Each kind of business's picture on its card: a home, a business's building, and the two together. */
export const SEGMENT_GLYPH: Readonly<Record<TenantSegment, ShellGlyphName>> = {
  residential: 'house',
  ci: 'building',
  both: 'layers',
};
