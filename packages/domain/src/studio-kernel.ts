/**
 * @heliogrid/domain/studio-kernel — the design studio's roof geometry (`T-M05-002`, part e).
 *
 * The kernel builds a roof's faces on any outline, joins roofs and cuts them out of each other,
 * and moves an outline in. It is heavy next to the rest of the studio's logic and carries the one
 * shape library the studio uses, so it has an entry of its own: the index every device bundles
 * never reaches it (dependency-cruiser `roof-kernel-has-its-own-entry`), and the phone, which
 * opens the studio as a page of the web app, never bundles it.
 *
 * Belongs here: pure roof geometry. Never here: a reducer, a view model, anything a screen of the
 * phone app needs.
 */

export { ridgePullOf, wallPullOf } from './studio/roof-arrow-magnet';
export { roofBuilt, roofFormOf, roofSlopeDeg } from './studio/roof-built';
export {
  roofLengthsMeasuredTo,
  roofParapetAllRound,
  roofParapetBuilt,
  roofRidgeTurned,
  roofShapePicked,
  roofSideEnded,
  roofSideMarked,
  roofSideWallFollows,
} from './studio/roof-choices';
export {
  type CutRoofs,
  cutInto,
  facesWithout,
  type HandFace,
  handFaces,
  movedIn,
} from './studio/roof-cuts';
export { type FaceOutline, JOG_M, outlineForFaces } from './studio/roof-face-outline';
export {
  type BuiltFace,
  type BuiltRoof,
  type FaceCorner,
  type FaceEdge,
  facesFromSides,
  riseOf,
  type ShapedRing,
  type SideShape,
} from './studio/roof-faces';
export {
  type FormedRoof,
  gableEnds,
  longestSide,
  type RoofForm,
  riseForSlope,
  roofFormed,
  type SideOwn,
  slopeForRise,
} from './studio/roof-forms';
export {
  roofAreaM2,
  roofGround,
  roofSurfaceM2,
  roofsAreaM2,
} from './studio/roof-free-ground';
export { heightPullOf } from './studio/roof-height-magnet';
export { roofHitOf } from './studio/roof-hit';
export {
  LEVEL_M,
  type RoofFacts,
  roofFloorM,
  roofHasWalls,
  roofMaterialNow,
  roofOwnHeightM,
  roofShapeNow,
  roofSloped,
} from './studio/roof-levels';
export { roofListOf } from './studio/roof-list-build';
export {
  cutToEdge,
  HOLE_MAX_M2,
  HOLE_SIDE_MAX_M,
  type HoleMeets,
  holeMeets,
  meetingOf,
  STAIR_ROOM_MAX_M2,
} from './studio/roof-meet';
export { meetingOfRoof, roofCutToEdge } from './studio/roof-meet-standing';
export {
  type EdgeState,
  type EdgeStretch,
  edgesOf,
  type ParapetNow,
  parapetNow,
} from './studio/roof-open-edges';
export { parapetInsidesOf } from './studio/roof-parapet-inside';
export {
  type FlatShape,
  joined,
  MET_M,
  metWith,
  ringAreaM2,
  type Stretch,
  shapeArea,
  shapeOf,
  shapesArea,
  shared,
  stretchesTaken,
  without,
} from './studio/roof-polygons';
export type { ProfilePart, StandingWall } from './studio/roof-profile';
export { roofSceneOf } from './studio/roof-scene-build';
export { sceneMotionOf } from './studio/roof-scene-motion';
export { setbackLines } from './studio/roof-setback';
export { type HeightSlide, roofSheetRowsOf } from './studio/roof-sheet-build';
export {
  bearingsApart,
  COMPASS_WAYS,
  type CompassWay,
  compassOf,
  equatorBearing,
  formPicksOf,
  gableTurnedFor,
  glassSideOf,
  type LowSide,
  lowSideOf,
  sideBearing,
} from './studio/roof-slope-way';
export { roofTopMarksOf } from './studio/roof-top-marks-build';
export { roofNumberOf } from './studio/roof-values';
export { roofNumberReset, roofNumberSet } from './studio/roof-values-set';
export { type RoofsWorked, roofsWorked, type WorkedBefore } from './studio/roof-worked';
export { sideSheetRowsOf } from './studio/side-sheet-build';
