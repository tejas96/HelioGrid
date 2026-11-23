import type { GroundPoint } from './ground';
import type { RoofKind } from './roof-parts';

/**
 * How a new roof meets the roofs already standing, as a fact the roof step is handed
 * (`T-M05-002`, part e). The studio's kernel works it out (`roof-meet.ts`); the roof step, which
 * every device bundles, only reads it, so it names no geometry of its own.
 */

/** Where a new roof lies among the others. */
export type RoofPlace = 'apart' | 'beside' | 'inside' | 'partly_over' | 'over_whole';

/** A chip on the line after a roof closes: a kind to make it, or a move. */
export type MeetChoice = RoofKind | 'join' | 'cut_to_edge';

export interface RoofMeeting {
  readonly place: RoofPlace;
  /** The new roof's corners, moved onto the roofs it meets within 0.3 m. */
  readonly corners: readonly GroundPoint[];
  /** What it is first guessed to be, and the chips offered, the guess first. */
  readonly kind: RoofKind;
  readonly choices: readonly MeetChoice[];
  /** The roof it stands on — the highest under it — and the one it belongs to: the one it covers most. */
  readonly on: number | null;
  readonly partOf: number | null;
  /** The roof Join would join it with; `null` when it meets none at its own height. */
  readonly joinWith: number | null;
  /**
   * The roof the new one starts like — made of the same thing, with the same shape: the roof it
   * lies on, or the level neighbour it meets; `null` for a roof apart, which starts as the market's
   * first roof does.
   */
  readonly startsLike: number | null;
  /**
   * Join is the first guess: the new roof starts like the neighbour it meets, so both are of one
   * material, and that neighbour slopes — two sloped roofs side by side would cut through each other.
   */
  readonly joinFirst: boolean;
  /** The guess rests on no measured height: it is marked to check. */
  readonly toCheck: boolean;
}
