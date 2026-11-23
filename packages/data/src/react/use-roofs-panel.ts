'use client';
import {
  type History,
  type MaterialPick,
  materialPickerOf,
  nextWaiting,
  pencilDoes,
  ROOFS_PANEL_START,
  type RoofFacts,
  type RoofList,
  type RoofSheetView,
  type RoofStepEvent,
  type RoofsPanel,
  type RoofsPanelEvent,
  roofsPanelAfter,
  type StudioDocument,
  type StudioView,
} from '@heliogrid/domain';
import { roofListOf, roofsWorked } from '@heliogrid/domain/studio-kernel';
import { type RefObject, useState } from 'react';
import type { RoofsPanelMoves, RoofsPanelView } from './roofs-panel-view';

/**
 * The pencil, Roofs and the material picker (`T-M05-002`, part e): what is open is domain's small
 * state machine; this holds it and joins it to the roof step and the roof's sheet.
 */
export function useRoofsPanel({
  document,
  latest,
  list,
  facts,
  editable,
  view,
  drawing,
  sheet,
  act,
  draw,
  stopDrawing,
  openSheet,
  closeSheet,
  copyRoof,
  deleteRoof,
}: {
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  /** The rows of Roofs for the design drawn. */
  list: RoofList;
  facts: RoofFacts;
  editable: boolean;
  view: StudioView;
  drawing: boolean;
  /** The roof's sheet that is open; `null` with none. */
  sheet: RoofSheetView | null;
  act: (event: RoofStepEvent) => void;
  draw: () => void;
  stopDrawing: () => void;
  openSheet: (roof: number) => void;
  /** The open sheet closes, its height kept; `false` when the height is refused and it stays. */
  closeSheet: () => boolean;
  copyRoof: (roof: number) => void;
  deleteRoof: (roof: number) => void;
}): { view: RoofsPanelView; moves: RoofsPanelMoves } {
  const [panel, setPanel] = useState<RoofsPanel>(ROOFS_PANEL_START);
  const [fromRoofs, setFromRoofs] = useState(false);
  const sheetRoof = sheet?.roof ?? null;
  const send = (event: RoofsPanelEvent) => setPanel((state) => roofsPanelAfter(state, event));
  const pencil = pencilDoes({
    roofs: document?.roofs.length ?? 0,
    drawing,
    editable,
    top: view === 'top',
  });

  /** A type picked or confirmed on the picker's roof: one change, then on to the next roof that waits. */
  const setMaterial = (pick?: MaterialPick) => {
    if (panel.open !== 'picker') return;
    act(
      pick === undefined
        ? { kind: 'material', roof: panel.roof }
        : { kind: 'material', roof: panel.roof, pick },
    );
    // The next roof that waits is read from the design as the pick left it: Confirm on a roof
    // also confirms what sits on it.
    const now = latest.current?.present;
    const rows = now === undefined ? list : roofListOf(now, facts, roofsWorked(now, facts));
    send({ kind: 'picked', next: nextWaiting(rows, panel.roof) });
  };

  return {
    view: {
      pencil,
      panel,
      materialPicker: document === null ? null : materialPickerOf(document, panel, facts),
      sheetFromRoofs: fromRoofs && sheetRoof !== null,
    },
    moves: {
      tapPencil: () => {
        if (pencil === 'draw') draw();
        else if (pencil === 'stop') stopDrawing();
        else send({ kind: 'pencil', does: pencil });
      },
      drawAnother: () => {
        send({ kind: 'close_all' });
        draw();
      },
      openRoofs: () => send({ kind: 'roofs' }),
      closePanel: () => send({ kind: 'close' }),
      pickRow: (roof) => {
        send({ kind: 'close_all' });
        setFromRoofs(true);
        openSheet(roof);
      },
      backToRoofs: () => {
        const roof = sheetRoof;
        if (!closeSheet()) return;
        setFromRoofs(false);
        setPanel({ open: 'roofs', lit: roof });
      },
      openMaterial: (roof, from) => send({ kind: 'material', roof, from }),
      pickerMode: (mode) => send({ kind: 'mode', mode }),
      typeOther: (draft) => send({ kind: 'other', draft }),
      pickMaterial: (pick) => setMaterial(pick),
      confirmMaterial: () => setMaterial(),
      copyRow: (roof) => {
        send({ kind: 'close_all' });
        copyRoof(roof);
      },
      deleteRow: (roof) => {
        send({ kind: 'close_all' });
        deleteRoof(roof);
      },
    },
  };
}
