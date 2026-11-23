'use client';
import type {
  HeightPull,
  History,
  MeasurementSystem,
  RoofFacts,
  RoofStepEvent,
  StudioDocument,
  StudioView,
} from '@heliogrid/domain';
import type { RefObject } from 'react';
import type { RoofSheetRowMoves, RoofSheetRowsState } from './roof-sheet-rows-view';
import { type RoofSheetMoves, type RoofSheetState, useRoofSheet } from './use-roof-sheet';
import { useRoofSheetRows } from './use-roof-sheet-rows';

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
}): {
  readonly state: RoofSheetState & RoofSheetRowsState;
  readonly moves: RoofSheetMoves & RoofSheetRowMoves;
  /** The side whose sheet shows over the roof's; `null` with none. */
  readonly side: number | null;
  /** Undo puts back what is in hand first: `true` when something was. */
  dropInHand(): boolean;
  /**
   * A view picked with the sheet open: what is in hand is kept and the sheet stays; the top view
   * picks its roof, so its sides' dots show. `false` when a height is refused: the view stays.
   */
  viewing(next: StudioView): boolean;
  /** The phone's back: a side's sheet or Parapet details back to the roof's, else Done. */
  back(): void;
} {
  const { latest, change, act, editable, facts, units, pin } = args;
  const latitude = pin?.latitude ?? 0;
  const sheet = useRoofSheet(args);
  const roof = sheet.state.roofSheet?.roof ?? null;
  const rows = useRoofSheetRows({ roof, latest, change, act, editable, facts, latitude, units });
  const part = rows.state.sheetPart;
  const done = () => {
    rows.moves.keepNumber();
    return sheet.moves.done();
  };
  return {
    state: { ...sheet.state, ...rows.state },
    moves: {
      ...sheet.moves,
      ...rows.moves,
      done,
      closeRoof: () => {
        rows.moves.dropNumber();
        sheet.moves.closeRoof();
      },
    },
    side: part.kind === 'side' ? part.side : null,
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
