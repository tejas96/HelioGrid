'use client';
import {
  HEIGHT_PULL_M,
  HEIGHT_PULL_MAX_M,
  type HeightPull,
  type History,
  historyAfter,
  isSideNumber,
  type MeasurementSystem,
  type NumberAt,
  type RoofFacts,
  type RoofNumber,
  type RoofStepEvent,
  roofNumberTyped,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  edgesOf,
  formPicksOf,
  handFaceLowSet,
  holeFitOf,
  ridgePullOf,
  riseForSlope,
  roofFormOf,
  roofLengthsMeasuredTo,
  roofNumberReset,
  roofNumberSet,
  roofParapetAllRound,
  roofParapetBuilt,
  roofRidgeTurned,
  roofShapeNow,
  roofShapePicked,
  roofSideEnded,
  roofSideMarked,
  roofSideWallFollows,
  slopeForRise,
  wallPullOf,
} from '@heliogrid/domain/studio-kernel';
import { type RefObject, useRef, useState } from 'react';
import type {
  RoofSheetRowMoves,
  RoofSheetRowsState,
  SheetPart,
  SheetRowKey,
} from './roof-sheet-rows-view';

/**
 * A roof's sheet beyond its height, and a side's sheet (`T-M05-002`, part e, board section 6):
 * which sheet shows — the roof's, one side's or one face's — which row is open on a phone,
 * and the number in hand while a slider moves. Each value kept is one change, with Undo, through
 * the studio's history and save; the rules are domain's.
 */

const ROOF_PART: SheetPart = { kind: 'roof' };

/** What shows over the open roof, and which roof it belongs to. */
interface Shows {
  readonly roof: number | null;
  readonly part: SheetPart;
  readonly row: SheetRowKey | null;
}

/** How far a ridge's rise runs across at a slope: the run a dragged ridge keeps. */
function runForSlope(riseM: number, slopeDeg: number): number {
  const rises = riseForSlope(slopeDeg, 1);
  return rises > 0 ? riseM / rises : 0;
}

export function useRoofSheetRows({
  roof,
  latest,
  change,
  act,
  editable,
  facts,
  latitude,
  units,
  magnetOn,
}: {
  /** The roof whose sheet is open; `null` with none open. */
  roof: number | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  act: (event: RoofStepEvent) => void;
  editable: boolean;
  facts: RoofFacts;
  /** The site's latitude: which way a one-way slope first faces, and a gable's ridge. */
  latitude: number;
  units: MeasurementSystem;
  /** The magnet is on, and not held off for a moment. */
  magnetOn: () => boolean;
}): {
  state: RoofSheetRowsState;
  moves: RoofSheetRowMoves;
  /** A tap on the model: what shows over `at`, the roof it opened — its sheet, a side, a row. */
  showOn(at: number, part: SheetPart, row?: SheetRowKey | null): void;
  /** The level a dragged wall or ridge is pulled to now: a level line and its tag; `null` when free. */
  pull: HeightPull | null;
} {
  // What shows over a roof belongs to that roof: another roof opened starts on its own sheet,
  // every row closed, nothing in hand.
  const [shows, setShows] = useState<Shows>({ roof: null, part: ROOF_PART, row: null });
  const [inHand, setInHand] = useState<{ at: NumberAt; value: number } | null>(null);
  // The number turned to typing, on the sheet it was turned on: another sheet shown never opens with it.
  const [started, setStarted] = useState<{
    shows: Shows;
    key: SheetRowKey;
    digit: string | null;
  } | null>(null);
  const hand = useRef(inHand);
  hand.current = inHand;
  // What an arrow held when it was taken: a wall's height, or the ridge's rise and its run.
  const grabbed = useRef<{ metres: number; runM: number }>({ metres: 0, runM: 0 });
  const [pull, setPull] = useState<HeightPull | null>(null);
  /** A number moved by an arrow: held in hand, and the level it pulled to, if any. */
  const holdArrow = (at: NumberAt, value: number, pulled: HeightPull | null) => {
    const held = { at, value };
    hand.current = held;
    setInHand(held);
    setPull(pulled);
  };
  const own = shows.roof === roof;
  const part = own ? shows.part : ROOF_PART;
  const rowOpen = own ? shows.row : null;
  const show = (part: SheetPart, row: SheetRowKey | null = null) => setShows({ roof, part, row });

  const side = part.kind === 'side' ? part.side : null;
  const face = part.kind === 'face' ? part.face : null;
  const atOf = (key: RoofNumber): NumberAt | null => {
    if (roof === null) return null;
    // A face's sheet holds its own slope alone.
    if (face !== null && key === 'slope') return { roof, key, face };
    return { roof, key, side: isSideNumber(key) ? side : null };
  };

  /** One change to the design as it stands, kept with Undo; nothing when it changes nothing. */
  const apply = (next: (design: StudioDocument) => StudioDocument) => {
    const at = latest.current;
    if (!editable || roof === null || at === null) return;
    const after = next(at.present);
    if (after !== at.present) change(historyAfter(at, after));
  };
  const keep = () => {
    setPull(null);
    const held = hand.current;
    hand.current = null;
    setInHand(null);
    if (held !== null) apply((design) => roofNumberSet(design, held.at, held.value, facts));
  };
  /** A gable's ridge turned 90°, or back; `false` where the roof has no ridge that turns. */
  const turnRidgeOf = (index: number): boolean => {
    const at = latest.current;
    const turning = at?.present.roofs[index];
    if (!editable || at === null || turning === undefined) return false;
    if (roofShapeNow(turning, facts) !== 'gable') return false;
    const picks = formPicksOf(at.present, index, facts, latitude);
    const turned = roofFormOf(turning, facts, picks).turned === true;
    change(historyAfter(at, roofRidgeTurned(at.present, index, facts, turned)));
    return true;
  };
  const onSide = (act: (design: StudioDocument, index: number, at: number) => StudioDocument) =>
    apply((design) => (roof === null || side === null ? design : act(design, roof, side)));

  // A sheet closed leaves no number turned to typing: opened again, no box takes the focus.
  if (roof === null && started !== null) setStarted(null);

  return {
    pull,
    showOn: (at, next, row = null) => {
      keep();
      setStarted(null);
      setShows({ roof: at, part: next, row });
    },
    state: {
      sheetPart: part,
      rowOpen,
      numberInHand: inHand,
      numberTyped: (shown) => roofNumberTyped(shown, units),
      numberStarted:
        started?.shows.roof === roof && started.shows.part === part
          ? { key: started.key, digit: started.digit }
          : null,
    },
    moves: {
      openRow: (key) => {
        setStarted(null);
        show(part, rowOpen === key ? null : key);
      },
      slideNumber: (key, value) => {
        const at = atOf(key);
        if (!editable || at === null) return;
        const held = { at, value };
        hand.current = held;
        setInHand(held);
      },
      keepNumber: keep,
      startNumber: (key, digit) => {
        if (editable && roof !== null)
          setStarted({ shows: { roof, part, row: rowOpen }, key, digit });
      },
      setNumber: (key, value) => {
        const at = atOf(key);
        hand.current = null;
        setInHand(null);
        setStarted(null);
        if (at !== null) apply((design) => roofNumberSet(design, at, value, facts));
      },
      resetNumber: (key) => {
        const at = atOf(key);
        setStarted(null);
        hand.current = null;
        setInHand(null);
        if (at !== null) apply((design) => roofNumberReset(design, at, facts));
      },
      pickShape: (shape) =>
        apply((design) => (roof === null ? design : roofShapePicked(design, roof, shape, facts))),
      makeKind: (kind) => {
        if (editable && roof !== null)
          act({ kind: 'make', roof, into: kind, facts, fitHole: holeFitOf });
      },
      setParapetAllRound: (on) =>
        apply((design) => (roof === null ? design : roofParapetAllRound(design, roof, on, facts))),
      setParapetBuilt: (build) =>
        apply((design) => (roof === null ? design : roofParapetBuilt(design, roof, build, facts))),
      setLengthsMeasured: (to) =>
        apply((design) =>
          roof === null ? design : roofLengthsMeasuredTo(design, roof, to, facts),
        ),
      openSide: (at) => {
        keep();
        show({ kind: 'side', side: at });
      },
      backToRoof: () => {
        keep();
        show(ROOF_PART);
      },
      setSideWall: (on) => {
        if (roof === null || side === null) return;
        const design = latest.current?.present;
        if (design === undefined) return;
        // The top view's dot and this switch are one control: the step says what changed.
        const walls = edgesOf(design, roof, facts).map((each) => each.some((s) => s.wall));
        if (walls[side] === on) return;
        const walled = walls.filter((has, i) => (i === side ? on : has)).length;
        act({ kind: 'side_wall', roof, side, wall: on, walled });
      },
      sideWallFollows: () => onSide(roofSideWallFollows),
      markSide: (mark) => onSide((design, index, at) => roofSideMarked(design, index, at, mark)),
      setFaceLow: (low) =>
        apply((design) =>
          roof === null || face === null ? design : handFaceLowSet(design, roof, face, low),
        ),
      endSide: (end) => onSide((design, index, at) => roofSideEnded(design, index, at, end)),
      turnRidge: () => {
        if (roof !== null) turnRidgeOf(roof);
      },
      turnRidgeOf,
      grabWall: (metres) => {
        grabbed.current = { metres, runM: 0 };
      },
      dragWall: (risenM, reachM = HEIGHT_PULL_M) => {
        const at = atOf('parapet_height');
        const design = latest.current?.present;
        if (!editable || at === null || at.side == null || design === undefined) return;
        const dragged = Math.max(0, grabbed.current.metres + risenM);
        const reach = Math.min(Math.max(reachM, HEIGHT_PULL_M), HEIGHT_PULL_MAX_M);
        const pulled = magnetOn()
          ? wallPullOf(design, at.roof, at.side, facts, dragged, reach)
          : null;
        holdArrow(at, pulled?.metres ?? dragged, pulled);
      },
      grabRidge: (riseM, slopeDeg) => {
        grabbed.current = { metres: riseM, runM: runForSlope(riseM, slopeDeg) };
      },
      dragRidge: (risenM, reachM = HEIGHT_PULL_M) => {
        const at = atOf('slope');
        const design = latest.current?.present;
        const { metres, runM } = grabbed.current;
        if (!editable || at === null || runM <= 0 || design === undefined) return;
        const dragged = Math.max(0, metres + risenM);
        const reach = Math.min(Math.max(reachM, HEIGHT_PULL_M), HEIGHT_PULL_MAX_M);
        const pulled = magnetOn() ? ridgePullOf(design, at.roof, facts, dragged, reach) : null;
        holdArrow(at, slopeForRise(pulled?.metres ?? dragged, runM), pulled);
      },
      dropNumber: () => {
        setPull(null);
        if (hand.current === null) return false;
        hand.current = null;
        setInHand(null);
        return true;
      },
    },
  };
}
