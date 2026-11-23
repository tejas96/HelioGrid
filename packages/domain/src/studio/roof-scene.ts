import type { GroundPoint } from './ground';

/**
 * The model of a design's roofs as the 3D scene draws it (`T-M05-002`, part e): plain solids and
 * surfaces in metres, every height counted from the ground, so a roof standing on another stands
 * on that roof's top and nothing is stretched. The studio's kernel builds it (`roof-scene-build.ts`);
 * a screen only turns it into triangles.
 */

/** What a solid is, which says how it is drawn. */
export type ScenePart =
  /** A roof's own walls and, where it is flat, its top. */
  | 'body'
  | 'parapet'
  /** A railing's posts and its rail. */
  | 'rail'
  /** A post an open shed stands on. */
  | 'post'
  /** An open shed's flat sheet. */
  | 'sheet'
  /** The floor a hole is open down to. */
  | 'floor';

/** An upright solid: an outline, with holes, standing between two heights. */
export interface ScenePrism {
  /** The roof it belongs to, by its place in the design. */
  readonly roof: number;
  readonly part: ScenePart;
  readonly outer: readonly GroundPoint[];
  readonly holes: readonly (readonly GroundPoint[])[];
  readonly footM: number;
  readonly topM: number;
  /** Its top is the roof's own top: it wears the picture. A sloped roof's walls have none. */
  readonly top: 'roof' | 'plain' | 'none';
}

/** A point of the model: on the ground's plan, and its height above the ground. */
export interface ModelPoint extends GroundPoint {
  readonly up: number;
}

/** A sloped face of a roof: flat in itself, anticlockwise from above. It wears the picture. */
export interface SceneFace {
  readonly roof: number;
  readonly corners: readonly ModelPoint[];
}

/** A wall that stands between a low edge and a high one: a gable end, a sawtooth's glass side. */
export interface SceneWall {
  readonly roof: number;
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  /** The foot and the top at each end, above the ground. */
  readonly footM: number;
  readonly fromTopM: number;
  readonly toTopM: number;
}

export interface RoofScene {
  readonly prisms: readonly ScenePrism[];
  readonly faces: readonly SceneFace[];
  readonly walls: readonly SceneWall[];
  /**
   * Each roof's levels above the ground, in the order of the design's roofs: where it stands, and
   * its top — its low edge where it slopes. A hole's are the top of the roof it is cut in.
   */
  readonly levels: readonly { readonly footM: number; readonly topM: number }[];
}

export const NO_ROOF_SCENE: RoofScene = { prisms: [], faces: [], walls: [], levels: [] };
