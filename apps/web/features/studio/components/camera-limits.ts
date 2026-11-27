'use client';
// biome-ignore lint/plugin: the web's three.js camera alone works out its reach; the phone opens the studio in its web view
import { edgeDepthAhead, groundReachPerMetre } from '@heliogrid/domain';
import { Box3, MathUtils, Vector3 } from 'three';

const RADIANS = MathUtils.DEG2RAD;
/** The field of view, kept narrow: a roof reads true, with little bend at the edges. */
const FOV_DEGREES = 30;
/** The camera's field of view, in degrees, which every reach below is worked out for. */
export function fieldOfView(): number {
  return FOV_DEGREES;
}

/**
 * How far the studio's camera may come and go over its picture (`T-M05-002a`): out until the
 * picture fills the room between the bars, in until it starts to blur, and only where the window
 * stays on the picture.
 */

/** The farthest the camera stands with no picture to keep it in. */
const DISTANCE_MAX = 600;
/** A floor under every other bound, so the camera never stands in the ground. */
const DISTANCE_MIN = 4;
/**
 * The closest the camera comes to a picture: one of its pixels at most this many screen pixels.
 * Nearer, the picture only blurs; the true size comes from typed lengths, not from more zoom.
 */
const SCREEN_PX_PER_PICTURE_PX = 4;
/** The least ground the window's shorter side shows on the grid, with no picture to blur. */
const GRID_SHORT_SIDE_M = 5;
/** Under this tilt the camera looks straight down: the map's own frame, side by side. */
const FLAT_TILT = 0.001;
/**
 * How deep the ground in view is counted once the camera tilts, in camera distances: the haze
 * starts at the point looked at and has taken most of the ground by here, and the haze's end is
 * kept before the picture's edge (`hazeOf`). A side view, which looks over the horizon, keeps the
 * house framed whole at this depth.
 */
const CLEAR_DEPTH = 1.3;
/** The haze, as shares of the camera's distance: it starts at the point looked at. */
const HAZE_FROM = 1;
const HAZE_TO = 2.4;
/**
 * The nearest the haze ends, in camera distances, when the picture's edge lies nearer than the
 * limits keep it (a frame that shows the roofs whole from farther off): just past the point looked
 * at, so the edge is taken by the haze and the roofs are not.
 */
const HAZE_TO_LEAST = 1.15;
/** With the whole ground in view, the room round it, as a share of its size. */
const WHOLE_ROOM = 1.2;
/** A view tilted nearer level than this counts the ground behind the point looked at no farther. */
const LOWEST_COS = 0.1;
/** The ground plane round the picture, or the plain ground with none: a square this wide. */
const GROUND_SIDE_M = 1_200;
/** The ground plane's side, in metres, which the haze ends before. */
export function groundSide(): number {
  return GROUND_SIDE_M;
}
const NO_PICTURE_GROUND = {
  west: -GROUND_SIDE_M / 2,
  east: GROUND_SIDE_M / 2,
  south: -GROUND_SIDE_M / 2,
  north: GROUND_SIDE_M / 2,
};
/** The picture's sharp ground, in metres east and north of the pin. */
export interface ClearGround {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

/**
 * How much ground a camera straight down sees from one metre up, each way from its middle, in the
 * room between the bars — where the person works, and where `setViewOffset` puts the middle. Under
 * the glass bars the picture's faded edge may show; the room between them is always picture.
 */
export function seenPerMetre(
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
) {
  const down = Math.tan((FOV_DEGREES / 2) * RADIANS);
  const room = Math.max(1, size.height - free.top - free.bottom) / size.height;
  const wide = size.width / size.height;
  return { across: down * wide, along: down * room };
}

/**
 * How far round the point looked at the view shows ground, per metre the camera stands off: the
 * map's own frame each way straight down; tilted, the farthest corner on the ground, whichever way
 * the view turns.
 */
function shownPerMetre(seen: ReturnType<typeof seenPerMetre>, tilt: number) {
  if (tilt < FLAT_TILT) return seen;
  const round = groundReachPerMetre(tilt, seen, CLEAR_DEPTH);
  return { across: round, along: round };
}

/**
 * The farthest the camera stands with the picture still filling the room the view shows — or, with
 * `whole`, with all of it in the room and a little round it.
 */
function farthestOver(
  clear: ClearGround,
  seen: ReturnType<typeof seenPerMetre>,
  tilt: number,
  whole: boolean,
): number {
  // The whole ground in view is counted straight down: tilted, the view only shows more round it.
  const shown = whole ? seen : shownPerMetre(seen, tilt);
  const across = (clear.east - clear.west) / 2 / shown.across;
  const along = (clear.north - clear.south) / 2 / shown.along;
  const farthest = whole ? Math.max(across, along) * WHOLE_ROOM : Math.min(across, along);
  return Math.max(DISTANCE_MIN, farthest);
}

/** The closest the camera comes: by the picture's sharpness, or on the grid by the ground shown. */
function closestOver(
  metresPerPixel: number | null,
  size: { readonly width: number; readonly height: number },
): number {
  const down = Math.tan((FOV_DEGREES / 2) * RADIANS);
  const closest =
    metresPerPixel === null
      ? GRID_SHORT_SIDE_M / 2 / (down * Math.min(1, size.width / size.height))
      : (metresPerPixel * size.height) / (2 * SCREEN_PX_PER_PICTURE_PX * down);
  return Math.max(DISTANCE_MIN, closest);
}

/**
 * Where the camera may look at from this far off, at this tilt: the picture less what the view
 * shows round the point it looks at, so no edge of the picture comes into view. Scene x runs east,
 * y up and z south: it looks within a metre of `upM` above the ground — the ground, or the top of
 * the roof whose sheet is open.
 */
export function lookRoom(
  clear: ClearGround & { readonly upM: number },
  seen: ReturnType<typeof seenPerMetre>,
  distance: number,
  tilt: number,
  whole: boolean,
): Box3 {
  const { upM } = clear;
  const shown = shownPerMetre(seen, tilt);
  // With `whole` the edge may show: the camera looks anywhere on the ground.
  const keep = whole ? 0 : 1;
  const across = keep * Math.min(shown.across * distance, (clear.east - clear.west) / 2);
  const along = keep * Math.min(shown.along * distance, (clear.north - clear.south) / 2);
  return new Box3(
    new Vector3(clear.west + across, upM - 1, -(clear.north - along)),
    new Vector3(clear.east - across, upM + 1, -(clear.south + along)),
  );
}

/**
 * How near and how far the camera may stand now, for the picture it shows, the window it fills and
 * its tilt from straight down: tilted, it sees farther, so it stands nearer.
 */
export function reachOf(
  clear: ClearGround | null,
  metresPerPixel: number | null,
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
  tilt: number,
  whole: boolean,
): { readonly nearest: number; readonly farthest: number } {
  const farthest =
    clear === null ? DISTANCE_MAX : farthestOver(clear, seenPerMetre(size, free), tilt, whole);
  return { nearest: Math.min(closestOver(metresPerPixel, size), farthest), farthest };
}

/** The ground one screen pixel covers, looking straight down from this far up. */
export function groundPerPixel(distance: number, height: number): number {
  return (2 * distance * Math.tan((FOV_DEGREES / 2) * RADIANS)) / height;
}

/** The most ground the window's shorter side shows as the studio opens: the house and its neighbours. */
const OPENING_SHORT_SIDE_M = 90;

/**
 * How far the camera stands as the studio opens: the picture at its own sharpness — one of its
 * pixels on one of the screen's own pixels, so a 2× or 3× screen shows it crisp, never blown up —
 * but the window's shorter side showing no more than the house and its neighbours, and never
 * nearer than one picture pixel to one CSS pixel. With no picture, `null`: the view frames the
 * ground round the pin instead.
 */
export function openingDistance(
  metresPerPixel: number | null,
  size: { readonly width: number; readonly height: number },
  screenPixelsPerCss: number,
): number | null {
  if (metresPerPixel === null) return null;
  const shortSide = Math.min(size.width, size.height);
  const perCss = Math.max(
    metresPerPixel,
    Math.min(metresPerPixel * screenPixelsPerCss, OPENING_SHORT_SIDE_M / shortSide),
  );
  return (perCss * size.height) / (2 * Math.tan((FOV_DEGREES / 2) * RADIANS));
}

/**
 * The haze for where the camera stands: from the point it looks at, ending where the picture's
 * edge lies straight ahead, so that edge is never seen — never nearer than just past the point
 * looked at, nor farther than its own share of the distance. Inside the limits the picture's edge
 * lies past the ground they keep on it. Straight down it is the distance's shares alone. Scene x
 * runs east, y up and z south.
 */
export function hazeOf(
  camera: Vector3,
  looked: Vector3,
  tilt: number,
  distance: number,
  clear: ClearGround | null,
): { readonly near: number; readonly far: number } {
  const ahead = { east: looked.x - camera.x, north: camera.z - looked.z };
  const across = Math.hypot(ahead.east, ahead.north);
  const edge =
    across === 0
      ? null
      : edgeDepthAhead(
          { east: camera.x, north: -camera.z, up: camera.y },
          { east: ahead.east / across, north: ahead.north / across },
          tilt,
          clear ?? NO_PICTURE_GROUND,
        );
  // Measured from the ground in the middle of the view: the point looked at may stand up on the
  // roofs, and the ground lies on past it along the view — measured from the point itself, a tall
  // roof put the ground in the haze and the picture went dark.
  const ground = distance + Math.max(0, looked.y) / Math.max(Math.cos(tilt), LOWEST_COS);
  const far = Math.max(ground * HAZE_TO_LEAST, edge ?? Number.POSITIVE_INFINITY);
  return { near: ground * HAZE_FROM, far: Math.min(ground * HAZE_TO, far) };
}
