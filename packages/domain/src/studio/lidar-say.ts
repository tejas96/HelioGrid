import { type CompassWay, compassOf } from './compass';
import type { GroundPoint } from './ground';
import type { LidarView } from './site-view';

/**
 * What LiDAR says (`T-M05-002g`, board v17): one instruction under the head, one message with one
 * action at the foot, and where the picked roofs stand against the scan — each for the moment the
 * person is in, one at a time.
 */

/** The one instruction under the head. */
export type LidarHint =
  | { readonly kind: 'open' }
  | { readonly kind: 'reader' }
  | { readonly kind: 'map' }
  | { readonly kind: 'pick' }
  | { readonly kind: 'drag' }
  | { readonly kind: 'now_drag' }
  | { readonly kind: 'moving'; readonly metres: number }
  /** A drag the magnet holds on the scan: let go, and the building sits where the scan sees it. */
  | { readonly kind: 'on_scan' };

/** The one message with one action at the foot: Moved · Undo, or Some roofs sit off · Fix. */
export type LidarFoot =
  | { readonly kind: 'moved'; readonly metres: number }
  | { readonly kind: 'off_spot' };

/**
 * Where the picked roofs stand against the scan: on it, or off it — the one building's shift to
 * where the scan sees it, and the scan's height for its roof where that differs.
 */
export type LidarStatus =
  | { readonly kind: 'matches' }
  | {
      readonly kind: 'off';
      readonly shift: GroundPoint | null;
      readonly scanHeightM: number | null;
    };

export interface LidarMoment {
  readonly view: LidarView;
  /** The scan is in. */
  readonly scanIn: boolean;
  readonly canEdit: boolean;
  readonly picked: number;
  /** How far a drag in hand has moved the picked roofs; `null` with none. */
  readonly draggedM: number | null;
  /** A finger holds a picked roof: the drag may start. */
  readonly holding: boolean;
  /** The drag in hand is held on the scan by the magnet. */
  readonly onScan: boolean;
  /** How far the last move took the picked roofs, while its Undo still stands; `null` with none. */
  readonly movedM: number | null;
  /** Roofs drawn on the leaning sky picture sit off where the scan sees their buildings. */
  readonly offSpot: boolean;
}

/** A move is said to the 10 cm, as its arrows step. */
const DM = 10;
const toDm = (metres: number) => Math.round(metres * DM) / DM;

/** The instruction while Move's Roofs tab is open, for an editor. */
function moveHintOf(moment: LidarMoment): LidarHint {
  if (moment.draggedM !== null) {
    return moment.onScan ? { kind: 'on_scan' } : { kind: 'moving', metres: toDm(moment.draggedM) };
  }
  if (moment.holding) return { kind: 'now_drag' };
  return moment.picked === 0 ? { kind: 'pick' } : { kind: 'drag' };
}

/** The instruction under the head; `null` when the moment needs none. */
export function lidarHintOf(moment: LidarMoment): LidarHint | null {
  const { view } = moment;
  if (!view.on || !moment.scanIn) return null;
  if (!moment.canEdit) return view.move === null ? { kind: 'reader' } : null;
  if (view.move?.tab === 'map') return { kind: 'map' };
  if (view.move !== null) return moveHintOf(moment);
  // One message at a time: the foot's Fix says it when roofs sit off.
  return view.tipGone || moment.offSpot ? null : { kind: 'open' };
}

/** The message at the foot; `null` when there is none. */
export function lidarFootOf(moment: LidarMoment): LidarFoot | null {
  const { view } = moment;
  if (!view.on || !moment.scanIn || !moment.canEdit) return null;
  if (view.move?.tab === 'roofs' && moment.movedM !== null && moment.draggedM === null) {
    return { kind: 'moved', metres: toDm(moment.movedM) };
  }
  if (view.move === null && !view.footShut && moment.offSpot) return { kind: 'off_spot' };
  return null;
}

/**
 * Where the picked roofs stand; `null` with nothing picked or before the scan's fits are in.
 * `shift` is the one picked building's, `scanHeightM` the scan's for the roof the slider sets.
 */
export function lidarStatusOf(input: {
  readonly picked: number;
  readonly fitsIn: boolean;
  /** A picked building sits off where the scan sees it. */
  readonly away: boolean;
  /** A picked flat roof stands at another height than the scan's. */
  readonly heightOff: boolean;
  readonly shift: GroundPoint | null;
  readonly scanHeightM: number | null;
}): LidarStatus | null {
  if (input.picked === 0 || !input.fitsIn) return null;
  if (!input.away && !input.heightOff) return { kind: 'matches' };
  return {
    kind: 'off',
    shift: input.shift,
    scanHeightM: input.heightOff ? input.scanHeightM : null,
  };
}

/** The compass way a shift on the ground points. */
export function compassWayOf(shift: GroundPoint): CompassWay {
  return compassOf((Math.atan2(shift.east, shift.north) * 180) / Math.PI);
}

/**
 * In the top view on the straight-down picture (board frame 20): roofs drawn on the leaning sky
 * picture that the scan sees elsewhere are said once, in the studio's bar, with Fix in LiDAR —
 * for a person who may edit, until its × for this opening.
 */
export function lidarTopFixOf(moment: {
  readonly topView: boolean;
  readonly straightDown: boolean;
  readonly offSpot: boolean;
  readonly canEdit: boolean;
  readonly footShut: boolean;
}): boolean {
  return (
    moment.topView && moment.straightDown && moment.offSpot && moment.canEdit && !moment.footShut
  );
}
