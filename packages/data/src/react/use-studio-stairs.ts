'use client';
import {
  type GroundPoint,
  type History,
  historyAfter,
  type StairsDrop,
  type StairsMoment,
  type StairsPlace,
  type StairsShown,
  type StudioDocument,
  stairsGuessKeyOf,
  stairsMomentOf,
  stairsPassed,
  stairsPlaced,
} from '@heliogrid/domain';
import { type RefObject, useRef, useState } from 'react';

/** What the stairs read of the model drawn (`RoofModelSeen`'s, which this file may not import). */
interface StairsSeen {
  readonly stairs: StairsShown | null;
  readonly stairsAsk: boolean;
  stairsDropAt(at: GroundPoint, reachM: number, magnet: boolean): StairsDrop | null;
}

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
  /** Esc or back while placing: nothing is placed, and the question stays; `false` when not placing. */
  stopPlacingStairs(): boolean;
  /**
   * A tap in the top view while placing: `true` when the tap was the stairs'. `beside`: the ground
   * a finger's width to the side, which sets the reach.
   */
  tapStairs(at: GroundPoint, beside: GroundPoint | null): boolean;
  grabStairs(): void;
  dragStairs(at: GroundPoint, beside: GroundPoint | null): void;
  /** Let go: the stairs land where the drag holds them; off every side, or where they stood, nothing is sent. */
  dropStairs(): void;
  /** The system took the press away mid-drag: the stairs stay where they were. */
  cancelStairs(): void;
  /** The Stairs row: one of the stair room's sides, at its middle, or Outside — a tap on an edge next. */
  stairsOnSide(room: number, side: number | 'outside', atM: number): void;
}

/** Two places along a side this close are one, in metres. */
const SAME_M = 1e-6;

/** How far a finger's width reaches on the ground there, in metres. */
const reachOf = (at: GroundPoint, beside: GroundPoint | null) =>
  beside === null ? 0 : Math.hypot(beside.east - at.east, beside.north - at.north);

export function useStudioStairs(args: {
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  magnetOn: () => boolean;
  /** Placing happens in the top view: Outside in the sheet goes there first; `false` when the sheet stays. */
  toTop: () => boolean;
}): {
  readonly view: StairsView;
  readonly moves: StairsMoves;
  readonly inHand: StairsPlace | null;
  /**
   * The model drawn, read once it is built (after this hook): where the stairs land and stand, and
   * what the bar says of them.
   */
  seen(model: StairsSeen): StairsMoment | null;
} {
  const { latest, change, editable, magnetOn } = args;
  // The model is built after this hook: a drag or a tap reads it when it comes.
  const drawn = useRef<StairsSeen | null>(null);
  // Where the stairs stood before the drag: while held, the model shows them where they are held.
  const stood = useRef<StairsPlace | null>(null);
  const dropAt = (at: GroundPoint, reachM: number, magnet: boolean) =>
    drawn.current?.stairsDropAt(at, reachM, magnet) ?? null;
  // The guess the design opened with: said when it was made, never again on a reopen.
  const opening = useRef<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [held, setHeldShown] = useState(false);
  // A grab and its first move can come in one event, before a render: the hand is kept in refs.
  const holding = useRef(false);
  const landed = useRef<StairsDrop | null>(null);
  const [landing, setLandingShown] = useState<StairsDrop | null>(null);
  const setHeld = (on: boolean) => {
    holding.current = on;
    setHeldShown(on);
  };
  const setLanding = (drop: StairsDrop | null) => {
    landed.current = drop;
    setLandingShown(drop);
  };

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
    stopPlacingStairs: () => {
      if (!placing) return false;
      setPlacing(false);
      return true;
    },
    tapStairs: (at, beside) => {
      if (!placing) return false;
      const drop = dropAt(at, reachOf(at, beside), magnetOn());
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
    dragStairs: (at, beside) => {
      if (holding.current) setLanding(dropAt(at, reachOf(at, beside), magnetOn()));
    },
    dropStairs: () => {
      const now = stood.current;
      const landing = landed.current;
      const moved =
        landing !== null &&
        (now === null ||
          now.roof !== landing.roof ||
          now.side !== landing.side ||
          Math.abs(now.atM - landing.atM) > SAME_M);
      if (holding.current && moved && landing !== null) place(landing);
      setHeld(false);
      setLanding(null);
    },
    cancelStairs: () => {
      setHeld(false);
      setLanding(null);
    },
    stairsOnSide: (room, side, atM) => {
      if (side !== 'outside') {
        place({ roof: room, side, atM });
        return;
      }
      if (args.toTop()) setPlacing(editable);
    },
  };
  return {
    view: { stairsPlacing: placing, stairsHeld: held, stairsLanding: landing },
    moves,
    inHand: held && landing !== null ? landing : null,
    seen: (model) => {
      drawn.current = model;
      if (!held) stood.current = model.stairs;
      // Until the first change of this opening, the guess shown is the one the design opened with.
      const guess = stairsGuessKeyOf(model.stairs);
      if ((latest.current?.past.length ?? 0) === 0) opening.current = guess;
      const facts = {
        ...{ placing, held, ask: model.stairsAsk, stairs: model.stairs, editable },
        guessNew: guess !== opening.current,
      };
      return stairsMomentOf(facts);
    },
  };
}
