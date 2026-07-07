// FILE: src/utils/heatmapUtils.js
import { fromArrayBuffer } from "geotiff";
import { PIXELS_TO_WORLD } from "./scaleUtils";

// Professional "Turbo" Color Ramp (Used by industry tools)
// Dark Purple (Heavy Shade) -> Blue -> Green -> Yellow -> Red (Max Sun)
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

// We removed the 2D roof overlay function entirely per your request!
export async function generateFluxHeatmapCanvas() {
  return null; 
}

export async function samplePanelsFlux(tiffBuffer, solarUnits, mpu, mpp, globalCenter, monthIndex = 5) {
  if (!tiffBuffer || !solarUnits || solarUnits.length === 0) return solarUnits;
  
  const tiff = await fromArrayBuffer(tiffBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();
  const width = image.getWidth(), height = image.getHeight();
  const band = rasters[Math.max(0, Math.min(11, monthIndex))];
  
  let min = Infinity, max = -Infinity;
  for (const v of band) {
    if (v > 0 && v !== -9999 && !isNaN(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  // We requested radiusMeters = 100 in the API, meaning the TIFF is exactly 200x200 meters
  const TIFF_COVERAGE_METERS = 200; 
  const mpp_tiff = TIFF_COVERAGE_METERS / width;

  return solarUnits.map(unit => {
    // 1. Convert Panel's 3D coordinates back into 2D Canvas Pixels
    const canvasX = (unit.position[0] / PIXELS_TO_WORLD) + globalCenter.x;
    const canvasY = (unit.position[2] / PIXELS_TO_WORLD) + globalCenter.y;

    // 2. The Google Map is perfectly centered at canvas pixel (350, 250). 
    // Calculate the distance in METERS from the center of the searched property.
    const offsetX_meters = (canvasX - 350) * mpp;
    const offsetY_meters = (canvasY - 250) * mpp;

    // 3. Map that meter offset perfectly into the GeoTIFF's pixel grid
    const px = Math.floor((width / 2) + (offsetX_meters / mpp_tiff));
    const py = Math.floor((height / 2) + (offsetY_meters / mpp_tiff));

    if (px >= 0 && px < width && py >= 0 && py < height) {
      const val = band[py * width + px];
      if (val > 0 && val !== -9999) {
        const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
        const color = getColorForValue(normalized);
        const hex = "#" + color.map(c => c.toString(16).padStart(2, '0')).join('');
        return { ...unit, fluxYield: normalized, fluxColor: hex };
      }
    }
    // Fallback if panel is placed off the edge of the known universe
    return { ...unit, fluxYield: 0, fluxColor: "#30123b" }; 
  });
}