import type { TranslatedText } from '@heliogrid/contracts';
import type { SurfaceState } from '../UnavailableNote';
import { clock, isCurrentTurn } from './Transcript.language';
import type { TranscriptTurn, TranscriptWords } from './Transcript.types';

/** The four states with no document to show. The header stays above every one of them. */
export type TranscriptPlaceholderKind = 'loading' | 'error' | 'unavailable' | 'empty';

/**
 * **What stands in for the turns**, or `null` when the document shows: the read's own state while
 * it is not ready, and `empty` for a call that connected but transcribed nothing.
 */
export function placeholderOf(
  state: SurfaceState,
  turnCount: number,
): TranscriptPlaceholderKind | null {
  if (state === 'loading' || state === 'error' || state === 'unavailable') return state;
  return turnCount === 0 ? 'empty' : null;
}

/** The loading form's bars, alternating tall and short so they hold the bubbles' footprint. */
export const TRANSCRIPT_SKELETON_BARS = [
  { key: 'a', tall: true },
  { key: 'b', tall: false },
  { key: 'c', tall: true },
  { key: 'd', tall: false },
] as const;

/** One turn as the list draws it: its key, whether it is playing, and the switch marked before it. */
export interface TranscriptTurnEntry {
  key: string | number;
  turn: TranscriptTurn;
  current: boolean;
  /** The in-flow marker where the language changed, so a reader meets it where it happened. */
  switchLine: TranslatedText | null;
}

export function turnEntriesOf(
  turns: TranscriptTurn[],
  marks: Record<number, string>,
  currentAt: number | undefined,
  words: TranscriptWords,
): TranscriptTurnEntry[] {
  return turns.map((turn, index) => {
    const switched = marks[index];
    return {
      key: turn.id ?? `${index}-${turn.party}`,
      turn,
      current: isCurrentTurn(turns, index, currentAt),
      switchLine: switched ? words.switchedTo(switched, clock(turn.at)) : null,
    };
  });
}

/**
 * **The reveal control's word.** ONE TARGET, TWO SOURCES: while the component still holds turns it
 * has not shown, pressing it widens the window; once it has shown them all, it asks the caller for
 * the next page. The word on it says which.
 */
export function moreLabelOf(
  words: TranscriptWords,
  remaining: number,
  loadingMore: boolean,
): TranslatedText {
  if (loadingMore) return words.loadingMore;
  return remaining > 0 ? words.showRest(remaining) : words.showMore;
}

/** The reveal control's press: the local window while turns are held unshown, the caller's page after. */
export function morePressOf(
  remaining: number,
  onReveal: () => void,
  onLoadMore: (() => void) | undefined,
): () => void {
  return () => {
    if (remaining > 0) {
      onReveal();
    } else {
      onLoadMore?.();
    }
  };
}
