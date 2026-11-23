'use client';
import {
  type GroundPoint,
  type History,
  historyAfter,
  type StairsDrop,
  type StairsPlace,
  type StudioDocument,
  stairsPassed,
  stairsPlaced,
} from '@heliogrid/domain';
import { type RefObject, useState } from 'react';

/**
 * The stairs in the studio (`T-M05-002`, part e, E119–E122, board 7): the mark dragged to another
 * side or a roof's edge, the bar's Place and Skip where no stair room says where they are, and the
 * stair room's Stairs row. Each placing is one change, kept with Undo.
 */
export interface StairsView {
  /** After Place, or Outside in a stair room's sheet: the next tap on an edge places the stairs. */
  readonly stairsPlacing: boolean;
  /** The mark is held by a drag. */
  readonly stairsHeld: boolean;
  /** Where the held mark would land: a side within reach, and what the magnet pulled it to. */
  readonly stairsLanding: StairsDrop | null;
}

export interface StairsMoves {
  /** The bar's Place: the next tap on an edge places the stairs. */
  placeStairs(): void;
  /** The bar's Skip: the question is not asked again. */
  skipStairs(): void;
  /** Esc while placing: nothing is placed, and the question stays. */
  stopPlacingStairs(): void;
  /** A tap in the top view while placing: `true` when it placed the stairs. */
  tapStairs(at: GroundPoint, reachM: number): boolean;
  grabStairs(): void;
  dragStairs(at: GroundPoint, reachM: number): void;
  /** Let go: the stairs land where the drag holds them; off every side, they stay where they were. */
  dropStairs(): void;
  /** The Stairs row: one of the stair room's sides, at its middle, or Outside — a tap on an edge next. */
  stairsOnSide(room: number, side: number | 'outside', atM: number): void;
}

export function useStudioStairs(args: {
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  /** Where the stairs land at a point of the plan, as the kernel reads the design drawn. */
  dropAt: (at: GroundPoint, reachM: number, magnet: boolean) => StairsDrop | null;
  magnetOn: () => boolean;
  /** Placing happens in the top view: Outside in the sheet goes there first. */
  toTop: () => void;
}): {
  readonly view: StairsView;
  readonly moves: StairsMoves;
  readonly inHand: StairsPlace | null;
} {
  const { latest, change, editable, dropAt, magnetOn } = args;
  const [placing, setPlacing] = useState(false);
  const [held, setHeld] = useState(false);
  const [landing, setLanding] = useState<StairsDrop | null>(null);

  const apply = (next: (design: StudioDocument) => StudioDocument) => {
    const at = latest.current;
    if (!editable || at === null) return;
    change(historyAfter(at, next(at.present)));
  };
  const place = (drop: StairsPlace) =>
    apply((design) => stairsPlaced(design, { roof: drop.roof, side: drop.side, atM: drop.atM }));

  const moves: StairsMoves = {
    placeStairs: () => setPlacing(editable),
    skipStairs: () => {
      setPlacing(false);
      apply(stairsPassed);
    },
    stopPlacingStairs: () => setPlacing(false),
    tapStairs: (at, reachM) => {
      if (!placing) return false;
      const drop = dropAt(at, reachM, magnetOn());
      if (drop === null) return true;
      setPlacing(false);
      place(drop);
      return true;
    },
    grabStairs: () => {
      if (!editable) return;
      setHeld(true);
      setLanding(null);
    },
    dragStairs: (at, reachM) => {
      if (held) setLanding(dropAt(at, reachM, magnetOn()));
    },
    dropStairs: () => {
      if (held && landing !== null) place(landing);
      setHeld(false);
      setLanding(null);
    },
    stairsOnSide: (room, side, atM) => {
      if (side !== 'outside') {
        place({ roof: room, side, atM });
        return;
      }
      args.toTop();
      setPlacing(editable);
    },
  };
  return {
    view: { stairsPlacing: placing, stairsHeld: held, stairsLanding: landing },
    moves,
    inHand: held && landing !== null ? landing : null,
  };
}
