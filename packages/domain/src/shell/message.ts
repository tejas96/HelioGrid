/**
 * A passing message on a screen — a toast, the studio's bottom bar: how much it matters, which of
 * several shows, and how long one that only reports stays before it goes by itself.
 */

/** Worst first: when two messages are there at once, the worse one shows. */
export const MESSAGE_TONES = ['error', 'warning', 'info'] as const;
export type MessageTone = (typeof MESSAGE_TONES)[number];

/** How long a message that only reports stays before it goes by itself. */
export const MESSAGE_DWELL_MS = 4000;

/** The one message to show: the worst; of two as bad, the first given. `null` with none. */
export function worstMessage<M extends { readonly tone: MessageTone }>(
  messages: readonly M[],
): M | null {
  let worst: M | null = null;
  for (const message of messages) {
    if (worst === null || MESSAGE_TONES.indexOf(message.tone) < MESSAGE_TONES.indexOf(worst.tone)) {
      worst = message;
    }
  }
  return worst;
}

/**
 * A message goes by itself only when it reports and asks nothing: information with no act and no
 * choice. A warning, an error, or one that asks stays until it is fixed or closed.
 */
export function goesByItself(tone: MessageTone, asks: boolean): boolean {
  return tone === 'info' && !asks;
}
