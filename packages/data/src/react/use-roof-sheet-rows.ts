'use client';
import {
  type History,
  historyAfter,
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
  roofFormOf,
  roofLengthsMeasuredTo,
  roofNumberReset,
  roofNumberSet,
  roofParapetAllRound,
  roofParapetBuilt,
  roofRidgeTurned,
  roofShapePicked,
  roofSideEnded,
  roofSideMarked,
  roofSideWallFollows,
} from '@heliogrid/domain/studio-kernel';
import { type RefObject, useEffect, useRef, useState } from 'react';
import type {
  RoofSheetRowMoves,
  RoofSheetRowsState,
  SheetPart,
  SheetRowKey,
} from './roof-sheet-rows-view';

/**
 * A roof's sheet beyond its height, and a side's sheet (`T-M05-002`, part e, board section 6):
 * which sheet shows — the roof's, one side's, or Parapet details — which row is open on a phone,
 * and the number in hand while a slider moves. Each value kept is one change, with Undo, through
 * the studio's history and save; the rules are domain's.
 */

/** The numbers a side holds of its own: on a side's sheet they are the side's. */
const SIDE_KEYS: readonly RoofNumber[] = ['parapet_height', 'setback'];

export function useRoofSheetRows({
  roof,
  latest,
  change,
  act,
  editable,
  facts,
  latitude,
  units,
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
}): { state: RoofSheetRowsState; moves: RoofSheetRowMoves } {
  const [part, setPart] = useState<SheetPart>({ kind: 'roof' });
  const [rowOpen, setRowOpen] = useState<SheetRowKey | null>(null);
  const [inHand, setInHand] = useState<{ at: NumberAt; value: number } | null>(null);
  const hand = useRef(inHand);
  hand.current = inHand;

  // Each roof opened starts on its own sheet, every row closed, nothing in hand.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new roof is a new sheet
  useEffect(() => {
    setPart({ kind: 'roof' });
    setRowOpen(null);
    setInHand(null);
  }, [roof]);

  const side = part.kind === 'side' ? part.side : null;
  const atOf = (key: RoofNumber): NumberAt | null =>
    roof === null ? null : { roof, key, side: SIDE_KEYS.includes(key) ? side : null };

  /** One change to the design as it stands, kept with Undo; nothing when it changes nothing. */
  const apply = (next: (design: StudioDocument) => StudioDocument) => {
    const at = latest.current;
    if (!editable || roof === null || at === null) return;
    const after = next(at.present);
    if (after !== at.present) change(historyAfter(at, after));
  };
  const keep = () => {
    const held = hand.current;
    hand.current = null;
    setInHand(null);
    if (held !== null) apply((design) => roofNumberSet(design, held.at, held.value, facts));
  };
  const onSide = (act: (design: StudioDocument, index: number, at: number) => StudioDocument) =>
    apply((design) => (roof === null || side === null ? design : act(design, roof, side)));

  return {
    state: {
      sheetPart: part,
      rowOpen,
      numberInHand: inHand,
      numberTyped: (shown) => roofNumberTyped(shown, units),
    },
    moves: {
      openRow: (key) => setRowOpen((open) => (open === key ? null : key)),
      slideNumber: (key, value) => {
        const at = atOf(key);
        if (!editable || at === null) return;
        const held = { at, value };
        hand.current = held;
        setInHand(held);
      },
      keepNumber: keep,
      setNumber: (key, value) => {
        const at = atOf(key);
        hand.current = null;
        setInHand(null);
        if (at !== null) apply((design) => roofNumberSet(design, at, value, facts));
      },
      resetNumber: (key) => {
        const at = atOf(key);
        hand.current = null;
        setInHand(null);
        if (at !== null) apply((design) => roofNumberReset(design, at, facts));
      },
      pickShape: (shape) =>
        apply((design) => (roof === null ? design : roofShapePicked(design, roof, shape, facts))),
      makeKind: (kind) => {
        if (editable && roof !== null) act({ kind: 'make', roof, into: kind, facts });
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
        setPart({ kind: 'side', side: at });
        setRowOpen(null);
      },
      openDetails: () => {
        keep();
        setPart({ kind: 'details' });
      },
      backToRoof: () => {
        keep();
        setPart({ kind: 'roof' });
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
      endSide: (end) => onSide((design, index, at) => roofSideEnded(design, index, at, end)),
      turnRidge: () =>
        apply((design) => {
          const at = roof === null ? undefined : design.roofs[roof];
          if (roof === null || at === undefined) return design;
          const picks = formPicksOf(design, roof, facts, latitude);
          const turned = roofFormOf(at, facts, picks).turned === true;
          return roofRidgeTurned(design, roof, facts, turned);
        }),
      dropNumber: () => {
        if (hand.current === null) return false;
        hand.current = null;
        setInHand(null);
        return true;
      },
    },
  };
}
