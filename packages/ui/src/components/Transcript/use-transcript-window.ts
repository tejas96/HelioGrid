import { useEffect, useMemo, useState } from 'react';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { countLine, deriveSwitches, languageSentence, switchPoints } from './Transcript.language';
import { placeholderOf } from './Transcript.logic';
import type { TranscriptProps } from './Transcript.types';

/**
 * **The window and the language derivation**, held once for both halves: which turns are on
 * screen, how many are still held back, the one language sentence, the count line and the state
 * that stands in for the document. VOLUME: a chronological window from the START — the opposite
 * direction from ActivityStream's, because a conversation's first turn is the interesting one.
 */
export function useTranscriptWindow({
  turns = [],
  language,
  switches,
  agentName,
  customerName,
  visibleCount = 40,
  step = 40,
  hasMore = false,
  total,
  read,
  words,
}: TranscriptProps) {
  const state = surfaceStateOf(read);
  const [shown, setShown] = useState(visibleCount);
  useEffect(() => setShown(visibleCount), [visibleCount]);

  const derived = useMemo(
    () => switches ?? deriveSwitches(turns, language),
    [switches, turns, language],
  );
  const marks = useMemo(() => switchPoints(turns, language), [turns, language]);
  const remaining = Math.max(0, turns.length - shown);

  return {
    state,
    onRetry: retryOf(read),
    sentence: languageSentence(words, language, derived),
    /* The count line states the whole call — and only once there is a call to count. */
    count:
      state === 'ready' && turns.length > 0
        ? countLine(words, total ?? turns.length, agentName, customerName)
        : null,
    blocked: placeholderOf(state, turns.length) !== null,
    turnCount: turns.length,
    visible: turns.slice(0, shown),
    marks,
    remaining,
    more: remaining > 0 || hasMore,
    reveal: () => setShown((n) => n + step),
  };
}
