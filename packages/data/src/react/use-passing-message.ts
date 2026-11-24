import { goesByItself, MESSAGE_DWELL_MS, type MessageTone, worstMessage } from '@heliogrid/domain';
import { useCallback, useEffect, useState } from 'react';

/** A message a screen may show for a while: who it is, how much it matters, whether it asks. */
export interface PassingMessage {
  /** Who the message is: one closed shows again once it has gone and is said anew. */
  readonly key: string;
  readonly tone: MessageTone;
  /** It has an act or a choice of its own: it waits for the person. */
  readonly asks: boolean;
  /** It holds a job in hand (a drag, a length in the box): it stays while the job lasts. */
  readonly stays: boolean;
}

/** The one message in view, and how it is closed. */
export interface PassingMessageView<M extends PassingMessage> {
  /** The worst message not closed; `null` with nothing to say. */
  readonly shown: M | null;
  /** Closes the message in view: the next worst, if any, shows. */
  readonly close: () => void;
}

const NONE: ReadonlySet<string> = new Set();

/**
 * Of the messages there, the worst not closed is in view: × closes it, and one that only reports
 * goes by itself after `MESSAGE_DWELL_MS`. A closed message is forgotten once it is no longer
 * said, so the same words said again later show again. `shows` narrows what may be in view for a
 * while (a job holds the screen) without forgetting what was closed among the rest.
 */
export function usePassingMessage<M extends PassingMessage>(
  messages: readonly M[],
  shows: (message: M) => boolean = () => true,
): PassingMessageView<M> {
  const [closed, setClosed] = useState<ReadonlySet<string>>(NONE);
  const said = messages.map((message) => message.key).join('\n');
  // A key no longer said is forgotten.
  useEffect(() => {
    const now = new Set(said.split('\n'));
    setClosed((was) => {
      const kept = [...was].filter((key) => now.has(key));
      return kept.length === was.size ? was : new Set(kept);
    });
  }, [said]);
  const worst = worstMessage(
    messages.filter((message) => shows(message) && !closed.has(message.key)),
  );
  const key = worst?.key ?? null;
  const close = useCallback(() => {
    if (key !== null) setClosed((was) => new Set([...was, key]));
  }, [key]);
  const fades = worst !== null && !worst.stays && goesByItself(worst.tone, worst.asks);
  useEffect(() => {
    if (!fades) return;
    const timer = setTimeout(close, MESSAGE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [fades, close]);
  return { shown: worst, close };
}
