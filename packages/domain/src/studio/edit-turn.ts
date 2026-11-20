/**
 * One editor at a time (`F4-15`): the person who has the design open to edit holds its turn, and
 * every other person sees it view-only with their name. An open studio renews its turn while it
 * stays open; a turn no studio renews runs out, so a closed app or a lost phone frees the design.
 */

/** How long a turn lasts with no sign of life from its studio. */
export const EDIT_TURN_SECONDS = 60;

/** How often an open studio renews its turn: three tries before the turn runs out. */
export const EDIT_TURN_RENEW_SECONDS = 20;

const MS_PER_SECOND = 1_000;

/** Who holds the turn, and until when — an instant in epoch milliseconds. */
export interface EditTurnHolder {
  readonly userId: string;
  readonly untilMs: number;
}

/** Whether a person may take the turn at `nowMs`: no one holds it, it is theirs, or it ran out. */
export function editTurnOpenTo(
  holder: EditTurnHolder | null,
  userId: string,
  nowMs: number,
): boolean {
  return holder === null || holder.userId === userId || holder.untilMs <= nowMs;
}

/** When a turn taken or renewed at `nowMs` runs out, in epoch milliseconds. */
export function editTurnUntil(nowMs: number): number {
  return nowMs + EDIT_TURN_SECONDS * MS_PER_SECOND;
}
