'use client';
import {
  type EditRefusal,
  entryMetres,
  entryOf,
  HEIGHT_PULL_M,
  HEIGHT_PULL_MAX_M,
  type HeightPull,
  type History,
  historyAfter,
  type LengthEntry,
  type MeasurementSystem,
  type RoofFacts,
  type RoofSheetView,
  roofHeightDragged,
  roofHeightKept,
  roofHeightOf,
  roofHeightReset,
  roofHeightStepped,
  roofSheetOf,
  roofStartHeightM,
  type SightAt,
  type StudioDocument,
} from '@heliogrid/domain';
import { type RefObject, useEffect, useRef, useState } from 'react';

/** A roof's sheet in 3D: opened by a tap, its height changed by the arrow, the slider or a box. */
export interface RoofSheetMoves {
  openRoof(roof: number): void;
  /**
   * A tap on the model in 3D, as the kernel reads it (`roofHitOf`): what it lands on — a roof
   * opens its sheet, a face its Slope, a side its own sheet, a gable's ridge turns; off every
   * roof, the sheet closes. `reachM`: how far a finger's width reaches there, in metres.
   */
  tapRoof(at: SightAt, reachM: number): void;
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
  /** The height in hand kept, the sheet left open: `false` when it is refused and stays. */
  keep(): boolean;
  /** Reset: the system's height comes back, as one change. */
  resetHeight(): void;
  /**
   * The blue arrow taken, and moved by how far the pointer rose, in metres. With the magnet on, a
   * height within `reachM` of a level that exists pulls to it.
   */
  grabHeight(): void;
  dragHeight(risenM: number, reachM?: number): void;
  /** Done: the height in hand is kept and the sheet closes; `false` when it is refused and stays. */
  done(): boolean;
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
  /** The level the dragged height is pulled to now: a level line and its tag; `null` when free. */
  readonly heightPull: HeightPull | null;
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
  facts,
  units,
  pullOf,
}: {
  document: StudioDocument | null;
  latest: RefObject<History<StudioDocument> | null>;
  change: (next: History<StudioDocument>) => void;
  editable: boolean;
  /** The market's roof facts: what a roof of each kind starts at, and where each one stands. */
  facts: RoofFacts;
  units: MeasurementSystem;
  /**
   * The magnet for a dragged height, from the studio's kernel: the level a height pulls to, or
   * `null` — while the magnet is off, or free for a moment — when it pulls to none.
   */
  pullOf: (
    design: StudioDocument,
    roof: number,
    metres: number,
    reachM: number,
  ) => HeightPull | null;
}): {
  state: RoofSheetState;
  moves: RoofSheetMoves;
  /** The sheet lands on a roof — `null` closes it — keeping a height in hand first; `false` when refused. */
  landOn(index: number | null): boolean;
} {
  const [open, setOpen] = useState<{ roof: number } | null>(null);
  const [inHand, setInHand] = useState<number | null>(null);
  // The box keeps what was typed, a half-typed number included, until the sheet moves on.
  const [typed, setTyped] = useState<LengthEntry | null>(null);
  const [refusal, setRefusal] = useState<EditRefusal | null>(null);
  const [pull, setPull] = useState<HeightPull | null>(null);
  const hand = useRef<number | null>(null);
  hand.current = inHand;
  const grabbedAt = useRef(0);

  const roof = open?.roof ?? null;
  /** The height the roof at `index` stands at where none is set: its kind's first height. */
  const startOf = (design: StudioDocument, index: number) => {
    const at = design.roofs[index];
    return at === undefined ? 0 : roofStartHeightM(design, at, facts);
  };
  const roofSheet =
    roof === null || document === null
      ? null
      : roofSheetOf(document, roof, startOf(document, roof), inHand);
  // Undo, or a save read again, took the open roof away: its sheet goes with it.
  const gone = open !== null && roofSheet === null && document !== null;
  useEffect(() => {
    if (gone) setOpen(null);
  }, [gone]);

  const standing = () => {
    const design = latest.current?.present;
    const at = design?.roofs[roof ?? -1];
    if (design === undefined || at === undefined) return null;
    return roofHeightOf(at, startOf(design, roof ?? -1)).metres;
  };
  const hold = (metres: number | null, entry: LengthEntry | null = null) => {
    hand.current = metres;
    setInHand(metres);
    setTyped(entry);
    setRefusal(null);
    setPull(null);
  };
  /** The height in hand kept: `false` when it is refused and stays in the box with its reason. */
  const keep = (): boolean => {
    const at = latest.current;
    if (!editable || roof === null || at === null) return true;
    const kept = roofHeightKept(at.present, roof, hand.current, startOf(at.present, roof));
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
  return {
    landOn: (index) => {
      if (index === roof) return true;
      if (!keep()) return false;
      if (index === null) setOpen(null);
      else openRoof(index);
      return true;
    },
    state: {
      roofSheet,
      sheetFrame: roofSheet === null ? null : open,
      heightEntry:
        roofSheet === null ? null : (typed ?? entryOf(roofSheet.height.metres, units, false)),
      heightRefusal: refusal,
      heightPull: pull,
    },
    moves: {
      openRoof,
      tapRoof: () => undefined,
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
      keep,
      resetHeight: () => {
        const at = latest.current;
        hold(null);
        if (!editable || roof === null || at === null) return;
        if (at.present.roofs[roof]?.height == null) return;
        change(historyAfter(at, roofHeightReset(at.present, roof)));
      },
      grabHeight: () => {
        grabbedAt.current = hand.current ?? standing() ?? 0;
      },
      dragHeight: (risenM, reachM = HEIGHT_PULL_M) => {
        const design = latest.current?.present;
        if (!editable || roof === null || design === undefined) return;
        const dragged = roofHeightDragged(grabbedAt.current, risenM);
        const reach = Math.min(Math.max(reachM, HEIGHT_PULL_M), HEIGHT_PULL_MAX_M);
        const pulled = pullOf(design, roof, dragged, reach);
        hold(pulled?.metres ?? dragged);
        setPull(pulled);
      },
      done: () => {
        if (!keep()) return false;
        setOpen(null);
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
