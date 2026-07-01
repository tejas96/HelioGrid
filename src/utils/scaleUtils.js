/**
 * scaleUtils.js
 *
 * Single source of truth for the coordinate-system bridge between:
 *   • Canvas pixels  (polygon drawing space, 700 × 500 px)
 *   • Real-world metres  (Solar API, building heights, panel dimensions)
 *   • Three.js world units  (the 3-D scene)
 *
 * Design rule: ONE conversion constant drives every spatial measurement
 * in the scene.  Nothing else may use a bare `* 0.1` or `* 0.012`.
 *
 * ─── Derivation ───────────────────────────────────────────────────────────
 *
 *  Google Maps zoom-20 satellite tile resolution (metres per pixel) at the
 *  equator is 0.149 m/px.  It scales with latitude:
 *
 *    metersPerPixel(lat, zoom) = (156543.03392 · cos(lat · π/180)) / 2^zoom
 *
 *  We render canvas pixels into Three.js world units with a fixed pixel→world
 *  scale (PIXELS_TO_WORLD = 0.012).  Therefore:
 *
 *    1 world unit = (1 / PIXELS_TO_WORLD) pixels
 *                 = (1 / 0.012) · metersPerPixel(lat, zoom)  metres
 *
 *    metersPerWorldUnit = metersPerPixel(lat, zoom) / PIXELS_TO_WORLD
 *
 *  At lat=28° (New Delhi), zoom=20:
 *    metersPerPixel ≈ 0.139 m/px
 *    metersPerWorldUnit ≈ 0.139 / 0.012 ≈ 11.6 m / world-unit
 *
 *  Consequence: to place a 6-metre-tall building wall we compute
 *    6 / 11.6 ≈ 0.517 world units   (not 6 * 0.1 = 0.6 — old wrong value)
 *
 * ─── Usage ────────────────────────────────────────────────────────────────
 *
 *  import { computeSceneScale, metersToWorld, worldToMeters } from './scaleUtils';
 *
 *  // Once, when location is known:
 *  const { mpu, pixelsToWorld } = computeSceneScale(location.lat);
 *
 *  // Then everywhere:
 *  const wallWorldHeight = metersToWorld(buildingHeightMeters, mpu);
 *  const panelWorldWidth = metersToWorld(1.0, mpu);   // 1-metre panel
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pixel-to-world-unit ratio used throughout the canvas→Three.js pipeline.
 *  Must match SCALE in Building3DViewer.jsx and polygonUtils.js. */
export const PIXELS_TO_WORLD = 0.012;

/** Google Maps zoom level at which the satellite tile is captured. */
export const SATELLITE_ZOOM = 20;

/** Canvas dimensions that the RoofPolygonDrawer uses. */
export const CANVAS_WIDTH  = 700;
export const CANVAS_HEIGHT = 500;

// ─── Core derivation ─────────────────────────────────────────────────────────

/**
 * Ground resolution in metres per pixel for a given latitude and zoom level.
 *
 * Formula: https://wiki.openstreetmap.org/wiki/Zoom_levels
 *   resolution = (156543.03392 * cos(lat_rad)) / 2^zoom
 *
 * @param {number} lat   Geographic latitude in decimal degrees.
 * @param {number} zoom  Map zoom level (default: 20).
 * @returns {number}  Metres covered by one canvas pixel.
 */
export function computeMetersPerPixel(lat, zoom = SATELLITE_ZOOM) {
  const latRad = (lat * Math.PI) / 180;
  return (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
}

/**
 * Metres covered by one Three.js world unit for a given location.
 *
 * @param {number} lat             Geographic latitude in decimal degrees.
 * @param {number} zoom            Map zoom level (default: 20).
 * @param {number} pixelsToWorld   Pixel→world multiplier (default: PIXELS_TO_WORLD).
 * @returns {number}  Real-world metres per world unit.
 */
export function computeMetersPerWorldUnit(
  lat,
  zoom = SATELLITE_ZOOM,
  pixelsToWorld = PIXELS_TO_WORLD,
) {
  const mpp = computeMetersPerPixel(lat, zoom);
  return mpp / pixelsToWorld;
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Convert a real-world measurement in metres to Three.js world units.
 *
 * @param {number} meters            Real-world distance in metres.
 * @param {number} metersPerWorldUnit  Output of computeMetersPerWorldUnit().
 * @returns {number}  Three.js world-unit distance.
 */
export function metersToWorld(meters, metersPerWorldUnit) {
  return meters / metersPerWorldUnit;
}

/**
 * Convert a Three.js world-unit distance back to real-world metres.
 *
 * @param {number} worldUnits        Distance in Three.js world units.
 * @param {number} metersPerWorldUnit  Output of computeMetersPerWorldUnit().
 * @returns {number}  Real-world distance in metres.
 */
export function worldToMeters(worldUnits, metersPerWorldUnit) {
  return worldUnits * metersPerWorldUnit;
}

// ─── Convenience bundle ───────────────────────────────────────────────────────

/**
 * Compute and return all scene-scale constants in one call.
 *
 * Call this once when the user's location is known and pass the result
 * (or just `mpu`) down to every component that needs to place geometry.
 *
 * @param {number} lat   Geographic latitude in decimal degrees.
 * @param {number} zoom  Map zoom level (default: 20).
 * @returns {{
 *   mpu: number,               // metres per Three.js world unit
 *   mpp: number,               // metres per canvas pixel
 *   pixelsToWorld: number,     // PIXELS_TO_WORLD constant (for reference)
 *   canvasWidthM: number,      // real-world width the canvas covers (metres)
 *   canvasHeightM: number,     // real-world height the canvas covers (metres)
 *   groundWidthWorld: number,  // ground plane width in world units
 *   groundHeightWorld: number, // ground plane height in world units
 * }}
 */
export function computeSceneScale(lat, zoom = SATELLITE_ZOOM) {
  const mpp = computeMetersPerPixel(lat, zoom);
  const mpu = computeMetersPerWorldUnit(lat, zoom, PIXELS_TO_WORLD);

  return {
    mpu,
    mpp,
    pixelsToWorld: PIXELS_TO_WORLD,
    canvasWidthM:      CANVAS_WIDTH  * mpp,
    canvasHeightM:     CANVAS_HEIGHT * mpp,
    groundWidthWorld:  CANVAS_WIDTH  * PIXELS_TO_WORLD,  // 8.4 world units
    groundHeightWorld: CANVAS_HEIGHT * PIXELS_TO_WORLD,  // 6.0 world units
  };
}

// ─── Solar panel defaults (real-world, in metres) ─────────────────────────────

/** Standard residential/commercial solar panel dimensions. */
export const PANEL_WIDTH_M  = 1.0;   // metres (narrow edge, horizontal on frame)
export const PANEL_HEIGHT_M = 1.7;   // metres (long edge, along tilt direction)

/** Gap between adjacent panels in the array. */
export const PANEL_GAP_M = 0.05;     // metres

/** Default tilt angle of panels from the roof surface. */
export const PANEL_TILT_DEG = 12;    // degrees

/** Height of the support pillar bases above the roof surface. */
export const MOUNT_HEIGHT_M = 0.30;  // metres

/** Rail cross-section (square tube). */
export const RAIL_THICKNESS_M = 0.05; // metres

/** Parapet wall height above roof surface. */
export const PARAPET_HEIGHT_M = 0.5; // metres

/** Parapet wall thickness. */
export const PARAPET_THICKNESS_M = 0.15; // metres