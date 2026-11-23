'use client';
import {
  type EditRefusal,
  entryMetres,
  entryOf,
  type GroundPoint,
  type History,
  historyAfter,
  type LengthEntry,
  type MeasurementSystem,
  type RoofSheetView,
  roofHeightDragged,
  roofHeightKept,
  roofHeightOf,
  roofHeightReset,
  roofHeightStepped,
  roofHitAt,
  roofSheetOf,
  type StudioDocument,
} from '@heliogrid/domain';
import { type RefObject, useEffect, useRef, useState } from 'react';

/** A roof's sheet in 3D: opened by a tap, its height changed by the arrow, the slider or a box. */
export interface RoofSheetMoves {
  openRoof(roof: number): void;
  /** A tap in 3D: the roof it lands on opens; off every roof, the sheet closes. */
  tapRoof(groundAt: (heightM: number) => GroundPoint | null): void;
  /** × or Esc: the sheet closes; a height still in hand goes, as the length box's × does. */
  closeRoof(): void;
  /** The slider moved: the walls follow; nothing is kept yet. */
  slideHeight(metres: number): void;
  /** A height typed in the box, in the reader's units; a box with no number keeps none. */
  typeHeight(entry: LengthEntry): void;
  /** Up or Down on the blue arrow: one step, kept at once. */
  stepHeight(by: 1 | -1): void;
  /** The slider let go, or Enter: the height in hand is kept as one change. */
  keepHeight(): void;
  /** Reset: the system's height comes back, as one change. */
  resetHeight(): void;
  /** The blue arrow taken, and moved by how far the pointer rose, in metres. */
  grabHeight(): void;
  dragHeight(risenM: number): void;
  /** Done: the height in hand is kept and the sheet closes; `false` when it is refused and stays. */
  done(): boolean;
  /** Edit outline in 2D: the height kept, the top view with this roof picked; `false` as Done. */
  editOutline(): boolean;
  /** Undo with a height in hand puts that back first; `true` when there was one. */
  dropHeight(): boolean;
}

export interface RoofSheetState {
  /** The open roof's sheet, its height in hand shown; `null` when none is open. */
  readonly roofSheet: RoofSheetView | null;
  /** A new value each time a sheet opens: the camera frames that roof once. */
  readonly sheetFrame: object | null;
  /** The height as the typing box shows it, in the reader's units; `null` with no sheet open. */
  readonly heightEntry: LengthEntry | null;
  /** Why the height in hand was not kept: it stays in the box until it is changed. */
  readonly heightRefusal: EditRefusal | null;
}

/**
 * The roof sheet's state and moves (`T-M05-002`, part b): which roof's sheet is open and the
 * height in hand; each height kept is one change, through the studio's history and save. What
 * counts as a change, a step and a hit is domain's.
 */
export function useRoofSheet({
  document,
  latest,
  change,
  editable,
  startHeightM,
  units,
  outline,
}: {
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  startHeightM: number;
  units: MeasurementSystem;
  /** Edit outline in 2D: the top view, the roof picked, its height said. */
  outline: (roof: number, metres: number) => void;
}): { state: RoofSheetState; moves: RoofSheetMoves } {
  const [open, setOpen] = useState<{ roof: number } | null>(null);
  const [inHand, setInHand] = useState<number | null>(null);
  // The box keeps what was typed, a half-typed number included, until the sheet moves on.
  const [typed, setTyped] = useState<LengthEntry | null>(null);
  const [refusal, setRefusal] = useState<EditRefusal | null>(null);
  const hand = useRef<number | null>(null);
  hand.current = inHand;
  const grabbedAt = useRef(0);

  const roof = open?.roof ?? null;
  const roofSheet =
    roof === null || document === null ? null : roofSheetOf(document, roof, startHeightM, inHand);
  // Undo, or a save read again, took the open roof away: its sheet goes with it.
  const gone = open !== null && roofSheet === null && document !== null;
  useEffect(() => {
    if (gone) setOpen(null);
  }, [gone]);

  const standing = () => {
    const at = latest.current?.present.roofs[roof ?? -1];
    return at === undefined ? null : roofHeightOf(at, startHeightM).metres;
  };
  const hold = (metres: number | null, entry: LengthEntry | null = null) => {
    hand.current = metres;
    setInHand(metres);
    setTyped(entry);
    setRefusal(null);
  };
  /** The height in hand kept: `false` when it is refused and stays in the box with its reason. */
  const keep = (): boolean => {
    const at = latest.current;
    if (!editable || roof === null || at === null) return true;
    const kept = roofHeightKept(at.present, roof, hand.current, startHeightM);
    if (kept?.kind === 'refused') {
      setRefusal(kept.refusal);
      return false;
    }
    hold(null);
    if (kept?.kind === 'done') change(historyAfter(at, kept.document));
    return true;
  };
  const openRoof = (index: number) => {
    if (!keep()) return;
    hold(null);
    setOpen({ roof: index });
  };
  const close = () => {
    hold(null);
    setOpen(null);
  };
  /** The heights the roofs stand at now, the one in hand included: where a 3D tap meets them. */
  const heightsNow = (at: StudioDocument) =>
    at.roofs.map((each, i) =>
      i === roof && hand.current !== null ? hand.current : roofHeightOf(each, startHeightM).metres,
    );
  return {
    state: {
      roofSheet,
      sheetFrame: roofSheet === null ? null : open,
      heightEntry:
        roofSheet === null ? null : (typed ?? entryOf(roofSheet.height.metres, units, false)),
      heightRefusal: refusal,
    },
    moves: {
      openRoof,
      tapRoof: (groundAt) => {
        const at = latest.current?.present;
        if (at === undefined) return;
        const hit = roofHitAt(at, heightsNow(at), groundAt);
        if (hit === roof) return;
        if (!keep()) return;
        if (hit === null) setOpen(null);
        else openRoof(hit);
      },
      closeRoof: close,
      slideHeight: (metres) => {
        if (editable && roof !== null) hold(metres);
      },
      typeHeight: (entry) => {
        if (editable && roof !== null) hold(entryMetres(entry, units), entry);
      },
      stepHeight: (by) => {
        const now = hand.current ?? standing();
        if (!editable || now === null) return;
        hold(roofHeightStepped(now, by));
        keep();
      },
      keepHeight: () => void keep(),
      resetHeight: () => {
        const at = latest.current;
        hold(null);
        if (!editable || roof === null || at === null) return;
        if (at.present.roofs[roof]?.height == null) return;
        change(historyAfter(at, roofHeightReset(at.present, roof)));
      },
      grabHeight: () => {
        grabbedAt.current = hand.current ?? standing() ?? startHeightM;
      },
      dragHeight: (risenM) => {
        if (editable && roof !== null) hold(roofHeightDragged(grabbedAt.current, risenM));
      },
      done: () => {
        if (!keep()) return false;
        setOpen(null);
        return true;
      },
      editOutline: () => {
        if (!keep()) return false;
        const metres = standing();
        setOpen(null);
        if (roof !== null && metres !== null) outline(roof, metres);
        return true;
      },
      dropHeight: () => {
        if (hand.current === null) return false;
        hold(null);
        return true;
      },
    },
  };
}
