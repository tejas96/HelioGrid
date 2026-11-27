import type { StudioDocument } from './document';

import type { GroundPoint } from './ground';
import {
  LINE_UP_LIFT_MAX_M,
  LINE_UP_SHIFT_MAX_M,
  LINE_UP_STEP_M,
  type SiteLineUp,
} from './site-data';

/**
 * LiDAR (`T-M05-002g`, board v17): Google's height map as a lit 3D scan in the studio's own 3D
 * view, with the person's drawn roofs on it — Heights or Photo, Sunlight over either, and Move,
 * where the roofs and the map are lined up in one place. This file holds the view's state and the
 * map's line-up; the scan's maths is the kernel's (`roof-buildings.ts`).
 */

export const LIDAR_LOOKS = ['heights', 'photo'] as const;
export type LidarLook = (typeof LIDAR_LOOKS)[number];

/** Move's two tabs: the drawn roofs, or the map under them. */
export const LIDAR_MOVE_TABS = ['roofs', 'map'] as const;
export type LidarMoveTab = (typeof LIDAR_MOVE_TABS)[number];

export interface LidarMove {
  readonly tab: LidarMoveTab;
  /** The picked roofs, by id: whole buildings, as a tap or a chip picks them. */
  readonly picked: readonly string[];
}

export interface LidarView {
  readonly on: boolean;
  readonly look: LidarLook;
  /** The year's sunlight over the look, on the roof tops. */
  readonly sunlight: boolean;
  /** How see-through the scan is: 0 solid, to `SEE_THROUGH_MAX`. */
  readonly seeThrough: number;
  /** The Move sheet, or a reader's card of one roof; `null` while closed. */
  readonly move: LidarMove | null;
  /** The opening hint is gone: the person pressed the view once. */
  readonly tipGone: boolean;
  /** The foot's one-action message was put away with its ×, for this opening. */
  readonly footShut: boolean;
  /** Where the place has no height data, a tap on the dimmed button says why until put away. */
  readonly why: boolean;
}

/** LiDAR as the studio opens: off, Heights first, solid, nothing open. */
export const LIDAR_START: LidarView = {
  on: false,
  look: 'heights',
  sunlight: false,
  seeThrough: 0,
  move: null,
  tipGone: false,
  footShut: false,
  why: false,
};

/** The see-through slider's ends and step, as shares; the Map tab opens it at half. */
export const SEE_THROUGH_MAX = 1;
export const SEE_THROUGH_STEP = 0.05;
export const SEE_THROUGH_MAP_START = 0.5;

export type LidarEvent =
  /** The LiDAR button: on, or off again. */
  | { readonly kind: 'toggle' }
  /** × in the head, or the top view: LiDAR is 3D only. */
  | { readonly kind: 'off' }
  | { readonly kind: 'look'; readonly look: LidarLook }
  | { readonly kind: 'sunlight'; readonly on: boolean }
  | { readonly kind: 'see_through'; readonly share: number }
  /** The Move button: the sheet opens on Roofs with nothing picked, or closes. */
  | { readonly kind: 'move' }
  /** The foot's Fix: Move opens on Roofs with these roofs picked. */
  | { readonly kind: 'fix'; readonly picked: readonly string[] }
  | { readonly kind: 'tab'; readonly tab: LidarMoveTab }
  /** A chip: the building's roofs join the picked ones, or leave them. */
  | { readonly kind: 'pick'; readonly building: readonly string[] }
  | { readonly kind: 'pick_none' }
  /**
   * A tap on a drawn roof: an editor's opens Move on its building, or adds or takes it there; a
   * reader's shows that roof's card.
   */
  | {
      readonly kind: 'tap_roof';
      readonly building: readonly string[];
      readonly roof: string;
      readonly canEdit: boolean;
    }
  /** Esc, or the phone's back: the sheet closes first, then LiDAR goes off. */
  | { readonly kind: 'back' }
  /** The first press on the view: the opening hint goes. */
  | { readonly kind: 'pressed' }
  /** The foot's × puts its message away. */
  | { readonly kind: 'shut_foot' }
  /** A tap on the dimmed button where the place has no height data: it says why, or stops. */
  | { readonly kind: 'why'; readonly shown: boolean };

const toggled = (picked: readonly string[], building: readonly string[]) => {
  const all = building.every((id) => picked.includes(id));
  return all
    ? picked.filter((id) => !building.includes(id))
    : [...picked, ...building.filter((id) => !picked.includes(id))];
};

type On<K extends LidarEvent['kind']> = (
  view: LidarView,
  event: Extract<LidarEvent, { kind: K }>,
) => LidarView;

const off = (view: LidarView): LidarView => (view.on ? { ...view, on: false, move: null } : view);

const picking: On<'pick'> = (view, event) =>
  view.move === null
    ? view
    : { ...view, move: { ...view.move, picked: toggled(view.move.picked, event.building) } };

/** The map is lined up against your roofs: it opens see-through, unless the person set it. */
const tabbing: On<'tab'> = (view, event) => {
  if (view.move === null || view.move.tab === event.tab) return view;
  const seeThrough =
    event.tab === 'map' && view.seeThrough === 0 ? SEE_THROUGH_MAP_START : view.seeThrough;
  return { ...view, seeThrough, move: { ...view.move, tab: event.tab } };
};

const tapping: On<'tap_roof'> = (view, event) => {
  if (!view.on) return view;
  if (!event.canEdit)
    return { ...view, move: { tab: 'roofs', picked: [event.roof] }, tipGone: true };
  if (view.move === null) {
    return { ...view, move: { tab: 'roofs', picked: [...event.building] }, tipGone: true };
  }
  return { ...view, move: { tab: 'roofs', picked: toggled(view.move.picked, event.building) } };
};

const ON: { readonly [K in LidarEvent['kind']]: On<K> } = {
  toggle: (view) => (view.on ? off(view) : { ...view, on: true }),
  off,
  look: (view, event) => (view.look === event.look ? view : { ...view, look: event.look }),
  sunlight: (view, event) => (view.sunlight === event.on ? view : { ...view, sunlight: event.on }),
  see_through: (view, event) => {
    const share = Math.min(SEE_THROUGH_MAX, Math.max(0, event.share));
    return share === view.seeThrough ? view : { ...view, seeThrough: share };
  },
  move: (view) => {
    if (!view.on) return view;
    return view.move === null
      ? { ...view, move: { tab: 'roofs', picked: [] }, tipGone: true }
      : { ...view, move: null };
  },
  fix: (view, event) =>
    view.on ? { ...view, move: { tab: 'roofs', picked: [...event.picked] }, tipGone: true } : view,
  tab: tabbing,
  pick: picking,
  pick_none: (view) =>
    view.move === null || view.move.picked.length === 0
      ? view
      : { ...view, move: { ...view.move, picked: [] } },
  tap_roof: tapping,
  back: (view) => (view.move !== null ? { ...view, move: null } : off(view)),
  pressed: (view) => (view.tipGone ? view : { ...view, tipGone: true }),
  shut_foot: (view) => (view.footShut ? view : { ...view, footShut: true }),
  why: (view, event) => (view.why === event.shown ? view : { ...view, why: event.shown }),
};

/** The view after one event; the same object when the event changes nothing. */
export function lidarViewAfter(view: LidarView, event: LidarEvent): LidarView {
  return (ON[event.kind] as On<typeof event.kind>)(view, event as never);
}

const NO_LINE_UP: SiteLineUp = { east: 0, north: 0, lift: 0 };
const toStep = (metres: number) => Math.round(metres / LINE_UP_STEP_M) * LINE_UP_STEP_M;
const clamp = (metres: number, max: number) => Math.max(-max, Math.min(max, toStep(metres)));

/**
 * The line-up in force: the person's, else the studio's own (`automatic`, from the straight-down
 * picture's edges), else none — the map where the data laid it.
 */
export function lineUpOf(
  document: StudioDocument,
  automatic: SiteLineUp | null = null,
): SiteLineUp {
  return document.site?.lineUp ?? automatic ?? NO_LINE_UP;
}

/** A point of the map where the person's line-up moved it. */
export function linedUp<P extends GroundPoint>(point: P, lineUp: SiteLineUp): P {
  return { ...point, east: point.east + lineUp.east, north: point.north + lineUp.north };
}

/** The map lifted or lowered to `lift` metres, kept to its 10 cm steps and its ±3 m. */
export function lineUpLifted(
  document: StudioDocument,
  lift: number,
  automatic: SiteLineUp | null = null,
): StudioDocument {
  const now = lineUpOf(document, automatic);
  return withLineUp(document, { ...now, lift: clamp(lift, LINE_UP_LIFT_MAX_M) }, automatic);
}

/**
 * The map moved one 10 cm step the way an arrow points on the screen: `way` is that arrow's way on
 * the ground, as the camera turns it, so the arrows read right in any view.
 */
export function lineUpNudged(
  document: StudioDocument,
  way: GroundPoint,
  automatic: SiteLineUp | null = null,
): StudioDocument {
  const now = lineUpOf(document, automatic);
  const reach = Math.hypot(way.east, way.north) || 1;
  return withLineUp(
    document,
    {
      ...now,
      east: clamp(now.east + (way.east / reach) * LINE_UP_STEP_M, LINE_UP_SHIFT_MAX_M),
      north: clamp(now.north + (way.north / reach) * LINE_UP_STEP_M, LINE_UP_SHIFT_MAX_M),
    },
    automatic,
  );
}

/**
 * The map dragged on the 3D: moved to `east`, `north` metres, kept to its 10 cm steps and its ±5 m;
 * its height stays.
 */
export function lineUpDragged(
  document: StudioDocument,
  to: GroundPoint,
  automatic: SiteLineUp | null = null,
): StudioDocument {
  const now = lineUpOf(document, automatic);
  return withLineUp(
    document,
    {
      ...now,
      east: clamp(to.east, LINE_UP_SHIFT_MAX_M),
      north: clamp(to.north, LINE_UP_SHIFT_MAX_M),
    },
    automatic,
  );
}

/** Back to automatic: the person's line-up goes. */
export function lineUpCleared(document: StudioDocument): StudioDocument {
  if (document.site?.lineUp === undefined) return document;
  const { lineUp: _gone, ...site } = document.site;
  return { ...document, site };
}

/** A line-up back where the studio lays the map by itself is no line-up of the person's. */
function withLineUp(
  document: StudioDocument,
  lineUp: SiteLineUp,
  automatic: SiteLineUp | null,
): StudioDocument {
  const own = automatic ?? NO_LINE_UP;
  const near = (a: number, b: number) => Math.abs(a - b) < LINE_UP_STEP_M / 2;
  const still =
    near(lineUp.east, own.east) && near(lineUp.north, own.north) && near(lineUp.lift, own.lift);
  if (still) return lineUpCleared(document);
  const was = document.site?.lineUp;
  const same =
    was !== undefined &&
    near(was.east, lineUp.east) &&
    near(was.north, lineUp.north) &&
    near(was.lift, lineUp.lift);
  return same ? document : { ...document, site: { ...document.site, lineUp } };
}

/** The key's two ends: the low and the high of the map near the roofs, in metres above the ground. */
export function heightKeyOf(heights: readonly number[]): { lowM: number; highM: number } | null {
  const known = heights.filter((h) => Number.isFinite(h)).sort((a, b) => a - b);
  if (known.length === 0) return null;
  const at = (share: number) => known[Math.round(share * (known.length - 1))] as number;
  // The lowest twentieth and the highest hundredth are left out: a pit, a mast.
  const lowM = Math.max(0, Math.floor(at(KEY_LOW_SHARE)));
  const highM = Math.max(lowM + 1, Math.ceil(at(KEY_HIGH_SHARE)));
  return { lowM, highM };
}

const KEY_LOW_SHARE = 0.05;
const KEY_HIGH_SHARE = 0.99;
