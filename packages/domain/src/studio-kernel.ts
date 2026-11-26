/**
 * @heliogrid/domain/studio-kernel — the design studio's roof geometry (`T-M05-002`, part e).
 *
 * The kernel builds a roof's faces on any outline, joins roofs and cuts them out of each other,
 * and moves an outline in. It is heavy next to the rest of the studio's logic and carries the one
 * shape library the studio uses, so it has an entry of its own: the index every device bundles
 * never reaches it (dependency-cruiser `roof-kernel-has-its-own-entry`), and the phone, which
 * opens the studio as a page of the web app, never bundles it.
 *
 * Part g's site maths lives here too: the height map read onto the site, the roof fit, the
 * outlines and eaves, the line-up, the skyline and the sunlight — heavy, and run by the server and
 * the studio's Web Worker alone.
 *
 * Belongs here: pure roof and site geometry. Never here: a reducer, a view model, anything a screen of the
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
export {
  handFaceClosed,
  handFaceLowSet,
  handFaceLowSideOf,
  handFaceRowsOf,
  handFaceSlopeSet,
  handFacesCleared,
} from './studio/roof-hand-face-set';
export { heightPullOf } from './studio/roof-height-magnet';
export { roofHitOf } from './studio/roof-hit';
export { type HoleMeets, holeFitOf, holeMeets } from './studio/roof-hole-fit';
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
export { eavesOf } from './studio/site-eaves';
export {
  cellMiddle,
  cellsInside,
  distanceToRing,
  type GridCell,
  gridCoarsened,
  gridCut,
  gridFromWire,
  gridToWire,
  type HeightGrid,
  heightAt,
  type MaskGrid,
  median,
  onBuilding,
  percentile,
} from './studio/site-grid';
export { groundUnder } from './studio/site-ground';
export { CALL_RADIUS_MAX_M, type RoofGroup, roofGroupsOf } from './studio/site-groups';
export { buildingOutlinesOf, squaredRing } from './studio/site-outline';
export {
  type PlaneFit,
  planeFacingDeg,
  planeFit,
  planeFitTwice,
  planeHeightAt,
  planeSlopeDeg,
} from './studio/site-plane';
export {
  greyOf,
  nearBoxOf,
  rasterBox,
  rasterOnGround,
  type SiteRead,
  siteReadOf,
  type UtmRaster,
} from './studio/site-read';
export { FIT_CLEAR_RMSE_M, mapHeightInside, type RoofFit, roofFitOf } from './studio/site-roof-fit';
export {
  type PictureGrid,
  type PictureShift,
  pictureFromWire,
  pictureShiftOf,
  pictureToWire,
  SHIFT_REACH_M,
  SHIFT_STEP_M,
} from './studio/site-shift';
export {
  type Eye,
  SKYLINE_STEP_DEG,
  type Skyline,
  shadeStretches,
  skylineAt,
  skylineAtBearing,
  skylineFromSouthBearings,
  skylinesJoined,
} from './studio/site-skyline';
export {
  SUNLIGHT_KEY_FROM,
  SUNLIGHT_KEY_TO,
  type SunSample,
  skyViewOf,
  sunlightSpread,
  sunShareOf,
  sunSharesOf,
  yearSunSamples,
} from './studio/site-sunlight';
export { type UtmPoint, type UtmZone, utmOf, utmZoneOfEpsg } from './studio/site-utm';
