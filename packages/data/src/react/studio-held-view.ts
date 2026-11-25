import type { GroundBox, RoofStepState, RoofsPanel } from '@heliogrid/domain';

/** The view held still: the bars may change, and the map stays while `clear` is not covered. */
export interface HeldView {
  /** The ground the bars must leave in sight, or the view moves; `null` with nothing drawn. */
  readonly clear: GroundBox | null;
}

/**
 * Whether the view stays where it is as the bars change (`T-M05-002`). While a roof is drawn the
 * map never moves for a bar's message coming or going — not even with a corner off a zoomed-in
 * screen or under a bar — or the next corner lands off the spot the person aimed at; they move
 * the map themselves. Roofs and the picker keep the person's own view while the roofs stay
 * clear. `null`: the view settles in the middle of the room.
 */
export function heldViewOf(
  fit: GroundBox | null,
  step: RoofStepState,
  /** Roofs or the material picker, open at the foot or not. */
  panel: RoofsPanel,
): HeldView | null {
  if (step.kind === 'drawing') return { clear: null };
  return panel.open === 'none' ? null : { clear: fit };
}
