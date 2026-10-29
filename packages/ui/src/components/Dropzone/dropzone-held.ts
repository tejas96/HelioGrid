/* The held-on-device queue and its retry — the one place in the product where anything captured is
   kept back (M11-37 P0 / SCR-M11-03, F4-21). Not an app-wide connection state: for that, see
   `NoConnection`.

   THE COUNT IS NOT A STATUS LINE. Photographs are the ONE thing held back, F4-21 is "nothing
   captured is unrecoverable", and a surveyor on a roof with no signal needs to see that their
   eleven photos still exist. The number is a promise being kept, and the retry is the one act that
   can keep it sooner — which is why the count is its OWN element and `heldMessage` replaces the
   sentence and never the number.

   AND THE FLUSH REPORTS WHAT HAPPENED, the same contract `NoConnection.onRetry` has: return `false`
   or reject to say it failed, `retryTimeout` stops a flush that never answers, and any other
   outcome says nothing — a success is never claimed unobserved. */

import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { takesImages } from './Dropzone.logic';
import type { DropzoneProps, DropzoneWords } from './Dropzone.types';

/** Milliseconds before a flush that never answers is called one. */
export const HELD_RETRY_TIMEOUT = 10000;

/** What a flush reported. `null` covers both "not tried" and "said nothing we can claim". */
export type HeldFlushFailure = 'failed' | 'timeout' | null;

/** The flush the caller supplies — the prop's own type, so the two can never drift apart. */
export type HeldRetry = NonNullable<DropzoneProps['onRetry']>;

export interface HeldNouns {
  accept: string;
  /** What is waiting, singular, in the caller's words — "document". */
  heldNoun?: TranslatedText;
  /** Its plural; without it the singular names any count. */
  heldNounPlural?: TranslatedText;
}

/**
 * How many are waiting. The caller's fact when they have it — a device queue outlives this mount
 * and is usually longer than the thumbnails on screen — and the rendered files as the honest
 * fallback.
 */
export function heldTotal(heldCount: number | undefined, fileCount: number): number {
  return heldCount ?? fileCount;
}

/**
 * The count line, in the CALLER'S noun. Photos are the common case, not the only one: SCR-M08-03's
 * checklist rows hold PDFs, and "3 photos saved on this phone" was wrong on every one of them.
 */
export function heldCountWords(
  held: number,
  nouns: HeldNouns,
  words: DropzoneWords,
): TranslatedText | null {
  if (held <= 0) {
    return null;
  }
  if (nouns.heldNoun === undefined) {
    return words.heldCount({
      count: held,
      kind: takesImages(nouns.accept) ? 'photo' : 'file',
    });
  }
  const noun = held === 1 ? nouns.heldNoun : (nouns.heldNounPlural ?? nouns.heldNoun);
  return words.heldCountOf(held, noun);
}

/** `heldMessage` overrides the SENTENCE. The count above it is untouched — that is the point. */
export function heldSentence(heldMessage: ReactNode, held: TranslatedText): ReactNode {
  return heldMessage === undefined || heldMessage === null || heldMessage === false
    ? held
    : heldMessage;
}

/** The words for what the last flush reported. */
export function heldFailureWords(
  failure: HeldFlushFailure,
  words: { failedMessage: TranslatedText; timeoutMessage: TranslatedText },
): TranslatedText | null {
  if (failure === null) {
    return null;
  }
  return failure === 'timeout' ? words.timeoutMessage : words.failedMessage;
}

const TIMED_OUT = Symbol('timeout');

/** The attempt against the clock: its own answer, `false` when it threw, or the timeout sentinel. */
async function raceRetry(attempt: HeldRetry, retryTimeout: number): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(attempt()),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), retryTimeout);
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export interface HeldFlush {
  failure: HeldFlushFailure;
  flushing: boolean;
  run: () => void;
}

/**
 * The flush, and what it reported. A retry that never answers is stopped at `retryTimeout` rather
 * than spinning under someone who thinks it is still working; anything other than an explicit
 * failure or a non-answer says nothing at all.
 */
export function useHeldFlush(onRetry: HeldRetry | undefined, retryTimeout: number): HeldFlush {
  const alive = useRef(true);
  const [flushing, setFlushing] = useState(false);
  const [failure, setFailure] = useState<HeldFlushFailure>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(() => {
    if (flushing || onRetry === undefined) {
      return;
    }
    setFlushing(true);
    setFailure(null);
    void raceRetry(onRetry, retryTimeout).then((result) => {
      if (!alive.current) {
        return;
      }
      setFlushing(false);
      if (result === TIMED_OUT || result === false) {
        setFailure(result === TIMED_OUT ? 'timeout' : 'failed');
      }
    });
  }, [flushing, onRetry, retryTimeout]);

  return { failure, flushing, run };
}
