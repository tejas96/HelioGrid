'use client';
import type {
  HeightPull,
  History,
  MeasurementSystem,
  RoofFacts,
  RoofHit,
  RoofStepEvent,
  SightAt,
  StudioDocument,
  StudioView,
} from '@heliogrid/domain';
import { type RefObject, useState } from 'react';
import type {
  RoofSheetRowMoves,
  RoofSheetRowsState,
  SheetPart,
  SheetRowKey,
} from './roof-sheet-rows-view';
import { type RoofSheetMoves, type RoofSheetState, useRoofSheet } from './use-roof-sheet';
import { useRoofSheetRows } from './use-roof-sheet-rows';

/**
 * What a tap shows once its roof's sheet is open: a face opens Slope, a side its own sheet, a
 * gable's ridge turns (a hip's ridge does not turn: it opens Slope).
 */
function tapped(
  hit: RoofHit,
  showOn: (roof: number, part: SheetPart, row?: SheetRowKey | null) => void,
  turnRidge: (roof: number) => boolean,
) {
  if (hit.kind === 'side') showOn(hit.roof, { kind: 'side', side: hit.side });
  // A face drawn by hand opens its own sheet; any other face, the roof's Slope.
  else if (hit.kind === 'face' && hit.face !== undefined)
    showOn(hit.roof, { kind: 'face', face: hit.face });
  else if (hit.kind === 'face') showOn(hit.roof, ROOF, 'slope');
  else if (hit.kind === 'ridge' && !turnRidge(hit.roof)) showOn(hit.roof, ROOF, 'slope');
  else showOn(hit.roof, ROOF);
}

const ROOF: SheetPart = { kind: 'roof' };

/**
 * A roof's sheet as the studio holds it (`T-M05-002`, part e): its height, and its other rows and
 * a side's sheet, each with what is in hand while a slider moves. Done keeps both; × drops both.
 */
export function useStudioSheet(args: {
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  act: (event: RoofStepEvent) => void;
  editable: boolean;
  facts: RoofFacts;
  units: MeasurementSystem;
  /** The site's pin: its latitude says which way a one-way slope first faces. */
  pin: { readonly latitude: number } | null;
  pullOf: (
    design: StudioDocument,
    roof: number,
    metres: number,
    reachM: number,
  ) => HeightPull | null;
  /** The magnet is on, and not held off for a moment. */
  magnetOn: () => boolean;
  /** What a tap on the model lands on, as the kernel reads the design drawn. */
  hitAt: (at: SightAt, beside: SightAt, open: number | null) => RoofHit | null;
}): {
  readonly state: RoofSheetState & RoofSheetRowsState & { readonly arrowHeld: boolean };
  readonly moves: RoofSheetMoves & RoofSheetRowMoves;
  /** The side whose sheet shows over the roof's; `null` with none. */
  readonly side: number | null;
  /** The face drawn by hand whose sheet shows over the roof's; `null` with none. */
  readonly face: number | null;
  /** Undo puts back what is in hand first: `true` when something was. */
  dropInHand(): boolean;
  /**
   * A view picked with the sheet open: what is in hand is kept and the sheet stays; the top view
   * picks its roof, so its sides' dots show. `false` when a height is refused: the view stays.
   */
  viewing(next: StudioView): boolean;
  /** The phone's back: a side's sheet or a face's back to the roof's, else Done. */
  back(): void;
} {
  const { latest, change, act, editable, facts, units, pin } = args;
  const latitude = pin?.latitude ?? 0;
  const sheet = useRoofSheet(args);
  const roof = sheet.state.roofSheet?.roof ?? null;
  const rows = useRoofSheetRows({
    roof,
    latest,
    change,
    act,
    editable,
    facts,
    latitude,
    units,
    magnetOn: args.magnetOn,
  });
  const part = rows.state.sheetPart;
  // An arrow on the model held: the sheet steps aside for the magnet's pill until it is let go.
  const [held, setHeld] = useState(false);
  const holding =
    <A extends unknown[]>(move: (...args: A) => void) =>
    (...args: A) => {
      setHeld(true);
      move(...args);
    };
  const letting =
    <A extends unknown[], R>(move: (...args: A) => R) =>
    (...args: A): R => {
      setHeld(false);
      return move(...args);
    };
  const done = () => {
    rows.moves.keepNumber();
    return sheet.moves.done();
  };
  return {
    state: {
      ...sheet.state,
      ...rows.state,
      // One level line at a time: the height's, or a wall's or a ridge's.
      heightPull: sheet.state.heightPull ?? rows.pull,
      arrowHeld: held,
    },
    moves: {
      ...sheet.moves,
      ...rows.moves,
      grabHeight: holding(sheet.moves.grabHeight),
      grabWall: holding(rows.moves.grabWall),
      grabRidge: holding(rows.moves.grabRidge),
      keepHeight: letting(sheet.moves.keepHeight),
      keepNumber: letting(rows.moves.keepNumber),
      done: letting(done),
      closeRoof: () => {
        setHeld(false);
        rows.moves.dropNumber();
        sheet.moves.closeRoof();
      },
      openRoof: (index) => {
        rows.moves.keepNumber();
        sheet.moves.openRoof(index);
      },
      // A roof made a hole along its roof's edge is a notch in that roof now, and is gone: its
      // sheet goes to the roof that took the notch, never to the roof that slid into its place.
      makeKind: (kind) => {
        const before = latest.current?.present;
        const open = sheet.state.roofSheet?.roof;
        const was = open === undefined ? undefined : before?.roofs[open];
        rows.moves.makeKind(kind);
        const now = latest.current?.present;
        if (was === undefined || now === undefined || now.roofs.some((r) => r.id === was.id))
          return;
        // The roof that took the notch is the one whose outline this act changed.
        const into = now.roofs.findIndex(
          (r) => before?.roofs.find((b) => b.id === r.id)?.corners !== r.corners,
        );
        sheet.landOn(into < 0 ? null : into);
      },
      tapRoof: (at, beside) => {
        const hit = args.hitAt(at, beside, sheet.state.roofSheet?.roof ?? null);
        rows.moves.keepNumber();
        if (!sheet.landOn(hit?.roof ?? null) || hit === null) return;
        tapped(hit, rows.showOn, rows.moves.turnRidgeOf);
      },
    },
    side: part.kind === 'side' ? part.side : null,
    face: part.kind === 'face' ? part.face : null,
    dropInHand: () => sheet.moves.dropHeight() || rows.moves.dropNumber(),
    viewing: (next) => {
      if (!sheet.moves.keep()) return false;
      rows.moves.keepNumber();
      const open = sheet.state.roofSheet;
      if (next === 'top' && open !== null) {
        act({ kind: 'pick_roof', roof: open.roof, metres: open.height.metres });
      }
      return true;
    },
    back: () => {
      if (part.kind !== 'roof') rows.moves.backToRoof();
      else done();
    },
  };
}
