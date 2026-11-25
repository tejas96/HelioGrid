import { type GroundBox, type RoofStepState, type RoofsPanel, roofsBox } from '@heliogrid/domain';

/** The view held still: the bars may change, and the map stays while `clear` is not covered. */
export interface HeldView {
  /** The ground the bars must leave in sight, or the view moves; `null` with nothing drawn. */
  readonly clear: GroundBox | null;
}

/**
 * Whether the view stays where it is as the bars change (`T-M05-002`). While a roof is drawn, a
 * bar's message coming or going never moves the map, or the next corner lands off the spot the
 * person aimed at: only the corners drawn must stay clear, as a roof already off a zoomed-in
 * screen is not brought back by the move. Roofs and the picker keep the person's own view while
 * the roofs stay clear. `null`: the view settles in the middle of the room.
 */
export function heldViewOf(
  fit: GroundBox | null,
  step: RoofStepState,
  /** Roofs or the material picker, open at the foot or not. */
  panel: RoofsPanel,
): HeldView | null {
  if (step.kind === 'drawing') return { clear: roofsBox([{ corners: step.corners }]) };
  return panel.open === 'none' ? null : { clear: fit };
}
