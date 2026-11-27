import type { SkyPicturePiece } from '@heliogrid/contracts';
import type {
  GroundPoint,
  LidarFoot,
  LidarHint,
  LidarLook,
  LidarMoveTab,
  LidarStatus,
  LidarView,
  RoofHeightSlide,
  RoofName,
  SightAt,
  SiteLineUp,
} from '@heliogrid/domain';

/** LiDAR's view model (`T-M05-002g`): what its hook assembles for the studio's screen. */

/**
 * Where the scan stands: in, on its way, unreached on the first open, its maths broken (a retry
 * asks again), or none at this place.
 */
export type LidarScan = 'coming' | 'in' | 'unreached' | 'failed' | 'none';

/** One chip of Move's Roofs tab: a building, named by its roofs on the ground. */
export interface LidarBuildingShown {
  readonly roofs: readonly number[];
  /** Its roofs on the ground, by name: the chip says them. */
  readonly names: readonly RoofName[];
  readonly picked: boolean;
}

/** A pin on a drawn roof — the screen reads its top from the model — and its share of the sun. */
export interface LidarPin {
  readonly index: number;
  /** Where it stands on its roof's top: off a smaller roof standing on it, which has its own. */
  readonly spot: GroundPoint;
  readonly share: number | null;
  readonly picked: boolean;
}

export interface LidarMoves {
  /** The LiDAR button. */
  toggle(): void;
  /** × in the head. */
  off(): void;
  look(look: LidarLook): void;
  sunlight(on: boolean): void;
  seeThrough(share: number): void;
  /** The Move button. */
  move(): void;
  tab(tab: LidarMoveTab): void;
  /** A chip: building `building` (its place in `buildings`) picked or let go. */
  pick(building: number): void;
  pickNone(): void;
  /** A tap on drawn roof `index` in the 3D view. */
  tapRoof(index: number): void;
  /** A tap on the 3D, its line of sight read at any height (`SightAt`): the roof it meets, if any. */
  tapAt(at: SightAt, beside: SightAt): void;
  /** The picked roof under a press, which a drag then moves with the others; `null` for none. */
  pickedAt(at: SightAt, beside: SightAt): number | null;
  /** The first press on the view. */
  pressed(): void;
  /** The foot's ×. */
  shutFoot(): void;
  /** Where the place has no height data: the dimmed button's tap says why; × puts it away. */
  why(shown: boolean): void;
  /** The foot's Fix: Move opens with the buildings off their spot picked. */
  fix(): void;
  /** Which roof of the one picked building the height slider sets, by its place in `choices`. */
  heightRoof(choice: number): void;
  /** The height slider at `metres`: shown while held, saved once `done`. */
  setHeight(metres: number, done: boolean): void;
  /** Match the scan: each picked building onto the scan's footprint, its flat roofs to its height. */
  match(): void;
  /** Back to as drawn: the picked roofs as the design opened. */
  asDrawn(): void;
  /** One 10 cm step of the picked roofs, `way` on the ground as the arrow points on the screen. */
  nudge(way: GroundPoint): void;
  /** A finger holds a picked roof (phone): the drag may start. */
  holding(on: boolean): void;
  /** The picked roofs dragged `by` metres from where the drag began; `done` once it ends. */
  drag(by: GroundPoint, done: boolean): void;
  /** The map dragged on the 3D to `to`, metres east and north; kept once `done`. */
  dragMap(to: GroundPoint, done: boolean): void;
  /** The map's height slider at `lift` metres: shown while held, kept once `done`. */
  liftMap(lift: number, done: boolean): void;
  /** The foot's Undo. */
  undoMove(): void;
  /** The scan's maths broke: ask again. */
  retryScan(): void;
  /** The top view's Fix in LiDAR: LiDAR opens on Move with the buildings off their spot picked. */
  fixInLidar(): void;
}

/** The scan as one indexed mesh: x, y, z per vertex (x east, y up, z south), its normals, its triangles. */
export interface LidarMesh {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
}

export interface LidarScreen {
  readonly view: LidarView;
  readonly scan: LidarScan;
  /** The scan's mesh, built off the page's thread once LiDAR is on; `null` until it is. */
  readonly mesh: LidarMesh | null;
  /** Where the scan lies: the map's line-up, or where a drag on the 3D holds it now. */
  readonly lineUp: SiteLineUp;
  /** The straight-down photo the scan wears; `null` until it is in. */
  readonly photo: readonly SkyPicturePiece[] | null;
  readonly canEdit: boolean;
  /** One per building, in the order of their first roof. */
  readonly buildings: readonly LidarBuildingShown[];
  /** The picked roofs, by index. */
  readonly picked: readonly number[];
  /** One building picked: the roof the height slider sets, its building's roofs to choose from. */
  readonly heightRoof: {
    readonly index: number;
    /** Its building's roofs on the ground, by index and name: one switch picks among them. */
    readonly choices: readonly { readonly index: number; readonly name: RoofName }[];
    /** A sloped roof is a slope, not one height: its height stays as drawn. */
    readonly flat: boolean;
    readonly heightM: number;
    /** A sloped roof: the scan's low and high in it; `null` where the scan has no roof there. */
    readonly range: { readonly lowM: number; readonly highM: number } | null;
    /** The studio's height slider for it: its ends and its step. */
    readonly slide: RoofHeightSlide;
  } | null;
  /** `null` with nothing picked, or before the scan's fits are in. */
  readonly status: LidarStatus | null;
  readonly canMatch: boolean;
  /** A picked roof moved or changed height since the design opened: Back to as drawn shows. */
  readonly changed: boolean;
  readonly hint: LidarHint | null;
  /** The top view's bar says roofs sit off their spot, with Fix in LiDAR (board frame 20). */
  readonly topFix: boolean;
  readonly foot: LidarFoot | null;
  readonly pins: readonly LidarPin[];
  /** A reader's card of one roof: its height, the scan's under it, its sunlight. */
  readonly card: {
    readonly index: number;
    readonly name: RoofName;
    readonly heightM: number;
    readonly scanM: number | null;
    readonly share: number | null;
  } | null;
  readonly moves: LidarMoves;
}
