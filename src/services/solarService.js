/**
 * solarService.js
 *
 * Real Google Solar API integration.
 * All calls go through /api/solar Vite proxy to avoid CORS.
 * Add this to vite.config.js server.proxy:
 *
 *   '/api/solar': {
 *     target: 'https://solar.googleapis.com',
 *     changeOrigin: true,
 *     rewrite: (path) => path.replace(/^\/api\/solar/, '/v1'),
 *   },
 */
import { fetchExactBuildingHeight } from "../utils/heightUtils";
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// ─── CORE FETCH ───────────────────────────────────────────────────────────────

async function solarFetch(path) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `/api/solar${path}${separator}key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Solar API ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── BUILDING INSIGHTS ───────────────────────────────────────────────────────

/**
 * Fetch full buildingInsights for a lat/lng.
 * Returns raw API response.
 */
export async function getBuildingInsights(lat, lng) {
  return solarFetch(
    `/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=LOW`
  );
}

// ─── POLYGON EXTRACTION ───────────────────────────────────────────────────────

function latLngToCanvas(lat, lng, centerLat, centerLng, zoom = 20) {
  const TILE_SIZE = 256;
  const scale = Math.pow(2, zoom);

  function project(latDeg, lngDeg) {
    const sinLat = Math.sin((latDeg * Math.PI) / 180);
    const x = (lngDeg + 180) / 360;
    const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
    return { x: x * TILE_SIZE * scale, y: y * TILE_SIZE * scale };
  }

  const center = project(centerLat, centerLng);
  const point  = project(lat, lng);
  return {
    x: (point.x - center.x) + 350,
    y: (point.y - center.y) + 250,
  };
}

function extractPolygonFromInsights(insights, centerLat, centerLng) {
  const segments = insights?.solarPotential?.roofSegmentStats;
  if (!segments || segments.length === 0) return null;

  // Use the segment with the largest area
  const largest = segments.reduce((best, seg) =>
    (seg.stats?.areaMeters2 || 0) > (best.stats?.areaMeters2 || 0) ? seg : best
  );

  if (!largest?.boundingBox) return null;

  const { sw, ne } = largest.boundingBox;
  return [
    { lat: sw.latitude, lng: sw.longitude },
    { lat: sw.latitude, lng: ne.longitude },
    { lat: ne.latitude, lng: ne.longitude },
    { lat: ne.latitude, lng: sw.longitude },
  ].map(({ lat, lng }) => latLngToCanvas(lat, lng, centerLat, centerLng));
}

/**
 * Fetch roof polygon as canvas pixel coords for the drawing canvas.
 */
export async function getRoofPolygon(lat, lng) {
  const insights = await getBuildingInsights(lat, lng);
  return extractPolygonFromInsights(insights, lat, lng);
}

// ─── SOLAR DATA MODEL ─────────────────────────────────────────────────────────

/**
 * Extract structured solar data from a buildingInsights response.
 *
 * Returns:
 * {
 *   maxSunshineHoursPerYear,
 *   maxArrayPanelsCount,
 *   maxArrayAreaMeters2,
 *   carbonOffsetFactorKgPerMwh,
 *   roofSegments: [{ pitchDegrees, azimuthDegrees, areaMeters2, sunshineHoursPerYear }],
 *   wholeRoofStats: { areaMeters2, sunshineHoursPerYear } | null,
 * }
 */
export function extractSolarData(insights) {
  const sp = insights?.solarPotential;
  if (!sp) return null;

  const roofSegments = (sp.roofSegmentStats || []).map((seg) => ({
    pitchDegrees:         seg.pitchDegrees          ?? 0,
    azimuthDegrees:       seg.azimuthDegrees         ?? 180,
    areaMeters2:          seg.stats?.areaMeters2     ?? 0,
    sunshineHoursPerYear: seg.stats?.sunshineQuantiles?.[2] ?? sp.maxSunshineHoursPerYear ?? 1600,
  }));

  const wholeRoof = sp.wholeRoofStats
    ? {
        areaMeters2:          sp.wholeRoofStats.areaMeters2 ?? 0,
        sunshineHoursPerYear: sp.wholeRoofStats.sunshineQuantiles?.[2] ?? sp.maxSunshineHoursPerYear ?? 1600,
      }
    : null;

  return {
    maxSunshineHoursPerYear:    sp.maxSunshineHoursPerYear    ?? 1600,
    maxArrayPanelsCount:        sp.maxArrayPanelsCount         ?? 0,
    maxArrayAreaMeters2:        sp.maxArrayAreaMeters2         ?? 0,
    carbonOffsetFactorKgPerMwh: sp.carbonOffsetFactorKgPerMwh ?? 0.42,
    roofSegments,
    wholeRoofStats: wholeRoof,
  };
}

// ─── COMBINED FETCH (single network call, returns both) ───────────────────────

/**
 * Fetch building insights and return both polygon + solar data in one call.
 * Use this in RoofEditor to avoid two round-trips.
 */
export async function fetchRoofAndSolarData(lat, lng) {
  const insights = await getBuildingInsights(lat, lng);
  return {
    polygon:     extractPolygonFromInsights(insights, lat, lng),
    solarData:   extractSolarData(insights),
    rawInsights: insights,
  };
}

// ─── SOLAR OUTPUT ESTIMATE ────────────────────────────────────────────────────

export function estimateSolarOutput(panelCount, solarData, panelWatts = 400, efficiency = 0.85) {
  const sunHours     = solarData?.maxSunshineHoursPerYear ?? 1600;
  const totalWatts   = panelCount * panelWatts;
  const annualKwh    = (totalWatts * sunHours * efficiency) / 1000;
  const carbonFactor = solarData?.carbonOffsetFactorKgPerMwh ?? 0.42;
  return {
    panelCount,
    totalCapacityKw:     +(totalWatts / 1000).toFixed(2),
    annualKwh:           Math.round(annualKwh),
    carbonOffsetKg:      Math.round(annualKwh * carbonFactor),
    estimatedSavingsUsd: Math.round(annualKwh * 0.12),
  };
}

// ─── BUILDING HEIGHT (OSM Overpass API) ───────────────────────────────────────

/**
 * Parse a raw OSM height tag string into metres (float).
 *
 * OSM stores heights inconsistently:
 *   "24"        → 24.0
 *   "24 m"      → 24.0
 *   "24.5m"     → 24.5
 *   "80 ft"     → 24.38  (feet → metres)
 *   ""          → null
 *
 * @param {string|undefined} raw
 * @returns {number|null}
 */
function parseOsmHeight(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();

  // Feet notation: "80 ft" or "80'"
  if (s.includes("ft") || s.includes("'")) {
    const ft = parseFloat(s);
    return isNaN(ft) ? null : +(ft * 0.3048).toFixed(2);
  }

  // Metres (default): strip any trailing "m" or spaces
  const m = parseFloat(s);
  return isNaN(m) ? null : m;
}

/**
 * Derive building height in metres from an OSM tags object.
 *
 * Priority:
 *   1. tags["height"]
 *   2. tags["building:height"]
 *   3. tags["building:levels"] × 3.2 m/floor
 *   4. tags["levels"] × 3.2 m/floor
 *   5. null  → caller uses its own default
 *
 * @param {object} tags  OSM way tags object
 * @returns {number|null}
 */
function heightFromTags(tags) {
  if (!tags) return null;

  // Explicit height fields
  for (const key of ["height", "building:height"]) {
    const h = parseOsmHeight(tags[key]);
    if (h !== null && h > 0) return h;
  }

  // Floor-count fields
  for (const key of ["building:levels", "levels"]) {
    const levels = parseInt(tags[key], 10);
    if (!isNaN(levels) && levels > 0) return +(levels * 3.2).toFixed(1);
  }

  return null;
}

/**
 * Query OSM Overpass API for building height at a given location.
 *
 * Uses a 40 m radius — tight enough to avoid neighbours, large enough
 * to tolerate a slightly off-centre click.
 *
 * Returns the best height found in metres, or null if:
 *   - No building is found in the radius
 *   - OSM has no height / levels tags for the building
 *   - The network request fails or times out
 *
 * Never throws — all errors are caught and return null so the caller
 * can fall back to its own default silently.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<number|null>}  Building height in real-world metres
 */



export async function fetchSolarDataLayers(lat, lng, radiusMeters = 100) {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  try {
    const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=${radiusMeters}&requiredQuality=LOW&key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return { monthlyFluxBuffer: null, exactHeight: null };
    const data = await response.json();

    let exactHeight = null;
    if (data.dsmUrl && data.demUrl) {
      exactHeight = await fetchExactBuildingHeight(data.dsmUrl, data.demUrl, API_KEY);
    }

    let monthlyFluxBuffer = null;
    // FETCH THE MONTHLY DATA (12 Bands)
    if (data.monthlyFluxUrl) {
      const tiffResponse = await fetch(data.monthlyFluxUrl + `&key=${API_KEY}`);
      if (tiffResponse.ok) monthlyFluxBuffer = await tiffResponse.arrayBuffer();
    }

    return { monthlyFluxBuffer, exactHeight };
  } catch (error) {
    console.error("🚨 Network Error loading Solar Data:", error);
    return { monthlyFluxBuffer: null, exactHeight: null };
  }
}