import {
  type GroundPoint,
  type History,
  historyAfter,
  LINE_UP_SHIFT_MAX_M,
  LINE_UP_STEP_M,
  type LidarEvent,
  type RoofFacts,
  roofHeightSet,
  type SightAt,
  type SiteLineUp,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  type BuildingScanFit,
  type DrawnBuilding,
  draggedOntoScan,
  roofsAsDrawn,
  roofsMoved,
  scanMatched,
} from '@heliogrid/domain/studio-kernel';
import type { LidarMoves } from './lidar-view';

/**
 * LiDAR's moves (`T-M05-002g`): the view's events, and Move's changes to the design — each one
 * change of its history, so Undo takes it back, and none at all for a person who may not edit.
 */

const CM = 100;
const toCm = (metres: number) => Math.round(metres * CM) / CM;
/** A drag shorter than this moved nothing. */
const DRAG_MIN_M = 0.05;
/** One arrow press moves the picked roofs this far. */
const NUDGE_M = 0.1;

export interface LidarHands {
  readonly dispatch: (event: LidarEvent) => void;
  readonly latest: { current: History<StudioDocument> | null };
  readonly change: (next: History<StudioDocument>) => void;
  readonly editable: boolean;
  readonly facts: RoofFacts;
  readonly buildings: readonly DrawnBuilding[];
  /** The picked roofs, by index, and the whole buildings among them. */
  readonly picked: readonly number[];
  readonly pickedBuildings: readonly DrawnBuilding[];
  readonly fitOf: (building: DrawnBuilding) => BuildingScanFit | null;
  /** The buildings the scan sees elsewhere: the foot's Fix picks them. */
  readonly offBuildings: readonly DrawnBuilding[];
  /** The roof the height slider sets; `null` unless one building is picked. */
  readonly heightIndex: number | null;
  /** The design as it opened: Back to as drawn returns to it. */
  readonly opening: StudioDocument | null;
  /** Roof ids for these indices. */
  readonly ids: (indices: readonly number[]) => string[];
  readonly setHeightPick: (choice: number) => void;
  readonly setHolding: (on: boolean) => void;
  readonly setDrag: (by: GroundPoint | null) => void;
  readonly setOnScan: (on: boolean) => void;
  /** The studio's magnet is on: a drag near where the scan sees the building is pulled there. */
  readonly magnet: () => boolean;
  readonly dragBase: { current: History<StudioDocument> | null };
  readonly setMovedM: (metres: number | null) => void;
  readonly setMapDrag: (lineUp: SiteLineUp | null) => void;
  readonly site: {
    readonly lineUp: SiteLineUp;
    readonly dragMap: (to: GroundPoint) => void;
  };
  readonly undo: () => void;
  /** The roof a line of sight meets on the model. */
  readonly hitAt: (at: SightAt, beside: SightAt) => number | null;
}

export function lidarMovesOf(hands: LidarHands): Omit<LidarMoves, 'retryScan' | 'fixInLidar'> {
  const { dispatch, latest, editable, buildings, picked, pickedBuildings, ids } = hands;
  const commit = (made: (now: StudioDocument) => StudioDocument) => {
    const now = latest.current;
    if (now === null || !editable) return;
    const next = made(now.present);
    if (next !== now.present) hands.change(historyAfter(now, next));
  };
  // The picked buildings move by their roofs on the ground; what stands on them goes with them.
  const roots = () => {
    const ground = pickedBuildings.flatMap((building) => building.roofs);
    return ground.length > 0 ? ground : picked;
  };
  const moveBy = (by: GroundPoint) =>
    commit((now) => {
      const moved = roofsMoved(now, roots(), by);
      return moved.fault === null ? moved.document : now;
    });
  const tapRoof = (index: number) => {
    const building = buildings.find((one) => one.members.includes(index));
    const [roof] = ids([index]);
    if (building === undefined || roof === undefined) return;
    dispatch({ kind: 'tap_roof', building: ids(building.members), roof, canEdit: editable });
  };
  return {
    toggle: () => dispatch({ kind: 'toggle' }),
    off: () => dispatch({ kind: 'off' }),
    look: (look) => dispatch({ kind: 'look', look }),
    sunlight: (on) => dispatch({ kind: 'sunlight', on }),
    seeThrough: (share) => dispatch({ kind: 'see_through', share }),
    move: () => dispatch({ kind: 'move' }),
    tab: (tab) => dispatch({ kind: 'tab', tab }),
    pick: (building) => {
      const one = buildings[building];
      if (one !== undefined) dispatch({ kind: 'pick', building: ids(one.members) });
    },
    pickNone: () => dispatch({ kind: 'pick_none' }),
    tapRoof,
    tapAt: (at, beside) => {
      const index = hands.hitAt(at, beside);
      if (index !== null) tapRoof(index);
    },
    pickedAt: (at, beside) => {
      const index = hands.hitAt(at, beside);
      return index !== null && picked.includes(index) ? index : null;
    },
    pressed: () => dispatch({ kind: 'pressed' }),
    shutFoot: () => dispatch({ kind: 'shut_foot' }),
    why: (shown) => dispatch({ kind: 'why', shown }),
    fix: () =>
      dispatch({ kind: 'fix', picked: ids(hands.offBuildings.flatMap((one) => one.members)) }),
    heightRoof: hands.setHeightPick,
    setHeight: (metres) => {
      const index = hands.heightIndex;
      if (index === null) return;
      commit((now) => {
        const set = roofHeightSet(now, index, metres);
        return set.kind === 'done' ? set.document : now;
      });
    },
    match: () =>
      commit((now) =>
        scanMatched(
          now,
          pickedBuildings.flatMap((building) => {
            const fit = hands.fitOf(building);
            return fit === null ? [] : [{ building, fit }];
          }),
          hands.facts,
        ),
      ),
    asDrawn: () => {
      const { opening } = hands;
      if (opening !== null) commit((now) => roofsAsDrawn(now, opening, ids(picked)));
    },
    nudge: (way) => {
      const reach = Math.hypot(way.east, way.north) || 1;
      moveBy({
        east: toCm((way.east / reach) * NUDGE_M),
        north: toCm((way.north / reach) * NUDGE_M),
      });
      hands.setMovedM(null);
    },
    holding: hands.setHolding,
    drag: (by, done) => {
      if (!editable || picked.length === 0) return;
      if (hands.dragBase.current === null) hands.dragBase.current = latest.current;
      // One building picked: the magnet pulls it onto where the scan sees it, once near.
      const [one, ...more] = pickedBuildings;
      const fit = one === undefined || more.length > 0 ? null : (hands.fitOf(one)?.shift ?? null);
      // A press with no move, or a cancel, moves nothing: the magnet acts on a real drag alone.
      const moved = Math.hypot(by.east, by.north) >= DRAG_MIN_M;
      const pulled = draggedOntoScan(
        { east: toCm(by.east), north: toCm(by.north) },
        fit,
        moved && hands.magnet(),
      );
      const shift = pulled.by;
      hands.setOnScan(pulled.onScan && !done);
      if (!done) {
        hands.setDrag(shift);
        return;
      }
      hands.dragBase.current = null;
      hands.setDrag(null);
      const metres = Math.hypot(shift.east, shift.north);
      if (metres < DRAG_MIN_M) return;
      moveBy(shift);
      hands.setMovedM(toCm(metres));
    },
    dragMap: (to, done) => {
      if (!editable) return;
      const step = (metres: number) => Math.round(metres / LINE_UP_STEP_M) * LINE_UP_STEP_M;
      const kept = (metres: number) =>
        Math.max(-LINE_UP_SHIFT_MAX_M, Math.min(LINE_UP_SHIFT_MAX_M, step(metres)));
      if (done) {
        hands.setMapDrag(null);
        hands.site.dragMap(to);
        return;
      }
      hands.setMapDrag({ ...hands.site.lineUp, east: kept(to.east), north: kept(to.north) });
    },
    undoMove: () => {
      hands.setMovedM(null);
      hands.undo();
    },
  };
}
