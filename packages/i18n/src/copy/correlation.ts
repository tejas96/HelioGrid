import type { ObservationWindow } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

/**
 * The caption the automated agent's impact block carries (`F8-30`): what the product observed, in
 * what window, and that it cannot prove the call caused it. A translation keeps all three and makes
 * no causal claim (`F8-32`).
 *
 * The window is the `{days}` slot, never `#`: `#` prints in the language's own digits, and Marathi's
 * are `३`, beside figures that print `3`.
 */
export const AGENT_CALL_CORRELATION: MessageRef = /*i18n*/ {
  id: 'The agent called and the customer responded within {days, plural, one {{days} day} other {{days} days}}. We cannot prove the call caused it.',
};

/** The caption in the reader's language — `translate` is the mount's `t`. */
export function agentCallCorrelation(
  translate: Translator['t'],
  window: ObservationWindow,
): string {
  return translate(AGENT_CALL_CORRELATION, { days: window });
}
