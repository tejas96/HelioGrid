/** Where the listbox goes beside its trigger. */
export interface ListPlacement {
  /** The listbox rises above the trigger instead of dropping below it. */
  up: boolean;
  /** Tallest the listbox may be, in px, inside the space that is actually visible. */
  max: number;
}

/** Tallest a listbox ever is — "260 tall" when nothing crowds it. */
export const LIST_MAX = 260;
const LIST_MIN = 120;
const MIN_BELOW = 160;

/**
 * The listbox drops, rises or shortens to fit the room it has: it rises only when the room below is
 * short and the room above is larger, and it is never shorter than 120 nor taller than 260.
 */
export function listPlacement(below: number, above: number): ListPlacement {
  const up = below < MIN_BELOW && above > below;
  return { up, max: Math.max(LIST_MIN, Math.min(LIST_MAX, up ? above : below)) };
}
