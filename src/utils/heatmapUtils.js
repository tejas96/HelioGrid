// FILE: src/utils/heatmapUtils.js
import { fromArrayBuffer } from "geotiff";
import { PIXELS_TO_WORLD } from "./scaleUtils";

const COLORS = [
  { val: 0.00, rgb: [48, 18, 59] },
  { val: 0.20, rgb: [70, 134, 251] },
  { val: 0.40, rgb: [27, 229, 181] },
  { val: 0.60, rgb: [164, 252, 60] },
  { val: 0.80, rgb: [251, 155, 6] },
  { val: 1.00, rgb: [227, 26, 28] }
];

export function getColorForValue(normalized) {
  for (let i = 0; i < COLORS.length - 1; i++) {
    if (normalized >= COLORS[i].val && normalized <= COLORS[i + 1].val) {
      const ratio = (normalized - COLORS[i].val) / (COLORS[i + 1].val - COLORS[i].val);
      return COLORS[i].rgb.map((c, j) => Math.round(c + (COLORS[i + 1].rgb[j] - c) * ratio));
    }
  }
  return COLORS[COLORS.length - 1].rgb;
}

export async function generateFluxHeatmapCanvas() {
  return null; 
}

export async function samplePanelsFlux(tiffBuffer, solarUnits, mpu, mpp, globalCenter, monthIndex = 5) {
  if (!tiffBuffer || !solarUnits || solarUnits.length === 0) return solarUnits;
  
  const tiff = await fromArrayBuffer(tiffBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();
  const width = image.getWidth(), height = image.getHeight();
  
  // Pre-calculate min/max for all 12 months to enable accurate shadow profiling
  const bandStats = [];
  for (let b = 0; b < 12; b++) {
    const band = rasters[b] || rasters[0]; 
    let min = Infinity, max = -Infinity;
    for (const v of band) {
      if (v > 0 && v !== -9999 && !isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    bandStats.push({ min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max });
  }

  // API radiusMeters = 100 means TIFF is exactly 200x200 meters
  const TIFF_COVERAGE_METERS = 200; 
  const mpp_tiff = TIFF_COVERAGE_METERS / width;

  return solarUnits.map(unit => {
    const canvasX = (unit.position[0] / PIXELS_TO_WORLD) + globalCenter.x;
    const canvasY = (unit.position[2] / PIXELS_TO_WORLD) + globalCenter.y;
    const offsetX_meters = (canvasX - 350) * mpp;
    const offsetY_meters = (canvasY - 250) * mpp;
    
    const px = Math.floor((width / 2) + (offsetX_meters / mpp_tiff));
    const py = Math.floor((height / 2) + (offsetY_meters / mpp_tiff));

    const monthlyRaw = [];
    const monthlyYield = [];

    // Extract all 12 months of data for this specific panel's coordinates
    if (px >= 0 && px < width && py >= 0 && py < height) {
      for(let b = 0; b < 12; b++) {
        const band = rasters[b] || rasters[0];
        const val = band[py * width + px];
        if (val > 0 && val !== -9999) {
          monthlyRaw.push(val);
          // 1.0 means this pixel gets the max possible sun on this roof. < 1.0 means it is shaded.
          monthlyYield.push(Math.max(0, Math.min(1, (val - bandStats[b].min) / (bandStats[b].max - bandStats[b].min))));
        } else {
          monthlyRaw.push(0); monthlyYield.push(0);
        }
      }
    } else {
      for(let b=0; b<12; b++) { monthlyRaw.push(0); monthlyYield.push(0); }
    }

    // Set the specific month's data for the 3D viewer rendering
    const safeMonth = Math.max(0, Math.min(11, monthIndex));
    const activeYield = monthlyYield[safeMonth];
    const fluxColor = getColorForValue(activeYield);
    const hex = "#" + fluxColor.map(c => c.toString(16).padStart(2, '0')).join('');

    return { ...unit, monthlyRaw, monthlyYield, fluxYield: activeYield, fluxColor: hex };
  });
}