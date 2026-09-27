/**
 * How long after an action the product watched for an outcome (`F8-32`). A metric that relates an
 * action to an outcome reports what it observed — the action, then the outcome within this window —
 * and never that one caused the other; the window is stated with the figure, never implied.
 */

declare const OBSERVATION_WINDOW: unique symbol;

/**
 * Whole days. Branded, so a surface cannot type its own window: the caption and the read that
 * counts the deals must state the same one. Kept on one line: the brand registry reads this shape.
 */
export type ObservationWindow = number & { readonly [OBSERVATION_WINDOW]: 'days' };

/** The window the automated agent's impact block states — "within 3 days" (`F8-30`). */
export const AGENT_CALL_WINDOW = 3 as ObservationWindow;
