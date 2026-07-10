// FILE: src/utils/reportUtils.js

import { PIXELS_TO_WORLD } from "./scaleUtils";

export const DEFAULT_PANEL_WATTS = 400;          
export const DEFAULT_SYSTEM_EFFICIENCY = 0.86;    
export const DEFAULT_COST_PER_WATT = 0.75;        
export const DEFAULT_ELECTRICITY_RATE = 0.12;     
export const DEFAULT_INCENTIVE_PCT = 30;          
export const DEFAULT_LIFETIME_YEARS = 25;

const CO2_KG_PER_TREE_PER_YEAR = 21;
const CO2_KG_PER_KM_DRIVEN = 0.12;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function worldToCanvasPoint(position, globalCenter) {
  if (!position || !globalCenter) return { x: 0, y: 0 };
  return {
    x: position[0] / PIXELS_TO_WORLD + globalCenter.x,
    y: position[2] / PIXELS_TO_WORLD + globalCenter.y,
  };
}

const PANEL_TILT_RAD = 12 * (Math.PI / 180);

export function getPanelPixelSize(unit, mpp) {
  const isLandscape = unit.orientation === "landscape";
  const rawW = isLandscape ? 1.65 : 1.0;
  const rawH = isLandscape ? 1.0 : 1.65;
  const wM = unit.cols * rawW + (unit.cols - 1) * 0.05;
  const hM = unit.rows * rawH * Math.cos(PANEL_TILT_RAD) + (unit.rows - 1) * 0.3;
  return { wPx: wM / mpp, hPx: hM / mpp, wM, hM };
}

export function getObstaclePixelSize(obstacle, mpp) {
  const wM = obstacle.dimensions?.w || 1.2;
  const dM = obstacle.dimensions?.d || 1.2;
  return { wPx: wM / mpp, hPx: dM / mpp };
}

export function computeWeightedSunshineHours(solarData) {
  const segs = solarData?.roofSegments;
  if (!segs || !segs.length) return solarData?.maxSunshineHoursPerYear ?? 1600;
  const totalArea = segs.reduce((a, s) => a + (s.areaMeters2 || 0), 0);
  if (!totalArea) return solarData?.maxSunshineHoursPerYear ?? 1600;
  return segs.reduce((a, s) => a + (s.areaMeters2 || 0) * (s.sunshineHoursPerYear || 0), 0) / totalArea;
}

export function computeDerateBreakdown({ obstacles = [], totalPanels = 0 } = {}) {
  const inverterEff = 0.97;
  const wiringLoss = 0.98;
  const soilingLoss = 0.98;
  const mismatchLoss = 0.99;
  const tempDerate = 0.93; 

  const shadingLoss = totalPanels > 0
    ? Math.max(0.90, 1 - (obstacles.length * 0.5) / Math.max(totalPanels, 1))
    : 1;

  const combined = inverterEff * wiringLoss * soilingLoss * mismatchLoss * tempDerate * shadingLoss;

  return {
    inverterEff, wiringLoss, soilingLoss, mismatchLoss, tempDerate, shadingLoss,
    combined: +combined.toFixed(4),
  };
}

export function computeSystemMetrics({
  solarUnits = [],
  solarData,
  panelWatts = DEFAULT_PANEL_WATTS,
  efficiency = DEFAULT_SYSTEM_EFFICIENCY,
}) {
  const totalPanels = solarUnits.reduce((acc, u) => acc + (u.rows || 0) * (u.cols || 0), 0);
  const sunHours = computeWeightedSunshineHours(solarData);
  const totalWatts = totalPanels * panelWatts;
  const totalCapacityKw = +(totalWatts / 1000).toFixed(2);
  const annualKwh = Math.round((totalWatts * sunHours * efficiency) / 1000);
  const carbonFactor = solarData?.carbonOffsetFactorKgPerMwh ?? 0.42;
  const carbonOffsetKg = Math.round(annualKwh * carbonFactor);

  return { totalPanels, totalCapacityKw, annualKwh, carbonOffsetKg, sunHours: Math.round(sunHours), panelWatts, efficiency };
}

export function computeFinancials({
  annualKwh,
  totalCapacityKw,
  electricityRate = DEFAULT_ELECTRICITY_RATE,
  costPerWatt = DEFAULT_COST_PER_WATT,
  incentivePct = DEFAULT_INCENTIVE_PCT,
  lifetimeYears = DEFAULT_LIFETIME_YEARS,
}) {
  const annualSavingsUsd = Math.round(annualKwh * electricityRate);
  const grossSystemCostUsd = Math.round(totalCapacityKw * 1000 * costPerWatt);
  const incentiveUsd = Math.round(grossSystemCostUsd * (incentivePct / 100));
  const netSystemCostUsd = grossSystemCostUsd - incentiveUsd;
  const paybackYears = annualSavingsUsd > 0 ? +(netSystemCostUsd / annualSavingsUsd).toFixed(1) : null;
  const lifetimeSavingsUsd = Math.round(annualSavingsUsd * lifetimeYears - netSystemCostUsd);
  const monthlySavingsUsd = Math.round(annualSavingsUsd / 12);

  return {
    annualSavingsUsd, grossSystemCostUsd, incentiveUsd,
    netSystemCostUsd, paybackYears, lifetimeYears,
    lifetimeSavingsUsd, monthlySavingsUsd,
  };
}


export function computeEnvironmentalEquivalents(carbonOffsetKg) {
  return {
    treesPlanted: Math.round((carbonOffsetKg || 0) / CO2_KG_PER_TREE_PER_YEAR),
    kmNotDriven: Math.round((carbonOffsetKg || 0) / CO2_KG_PER_KM_DRIVEN),
  };
}

export function azimuthToCompass(deg) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  let idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return dirs[idx];
}

export function summarizeRoofSegments(solarData) {
  if (!solarData?.roofSegments?.length) return [];
  return solarData.roofSegments.map((seg, i) => ({
    id: i + 1,
    pitchDegrees: Math.round(seg.pitchDegrees),
    azimuthDegrees: Math.round(seg.azimuthDegrees),
    azimuthLabel: azimuthToCompass(seg.azimuthDegrees),
    areaM2: Math.round(seg.areaMeters2),
    sunshineHoursPerYear: Math.round(seg.sunshineHoursPerYear),
  }));
}

const OBSTACLE_LABELS = { ac_unit: "AC Unit", water_tank: "Water Tank", tree: "Tree" };

export function summarizeObstacles(obstacles = []) {
  const counts = {};
  obstacles.forEach((o) => {
    const key = o.type || "other";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([type, count]) => ({
    type, label: OBSTACLE_LABELS[type] || type, count,
  }));
}

export const DEFAULT_PANEL_VOC = 41.0;   
export const DEFAULT_PANEL_VMP = 34.5;   
export const DEFAULT_PANEL_ISC = 12.4;   
export const DEFAULT_PANEL_IMP = 11.6;   

const INVERTER_MAX_STRING_VOLTAGE = 600; 
const INVERTER_MIN_STRING_VOLTAGE = 200; 
const COLD_TEMP_VOC_MULTIPLIER = 1.15;   

const STANDARD_INVERTER_SIZES_KW = [3, 3.8, 5, 6, 7.6, 10, 11.4, 15, 20, 25, 30, 36, 40, 50, 60, 75, 100, 125, 150];
const STANDARD_BREAKER_SIZES_A = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400];

function roundUpToStandard(value, table) {
  for (const t of table) if (t >= value) return t;
  return table[table.length - 1];
}

export function computeStringingPlan(totalPanels, {
  panelWatts = DEFAULT_PANEL_WATTS,
  voc = DEFAULT_PANEL_VOC,
  vmp = DEFAULT_PANEL_VMP,
  imp = DEFAULT_PANEL_IMP,
} = {}) {
  if (!totalPanels) {
    return { panelsPerString: 0, numStrings: 0, stringSizes: [], stringVoltage: 0, stringCurrent: 0, totalDcCurrent: 0, panelWatts };
  }

  const maxPerString = Math.max(1, Math.floor(INVERTER_MAX_STRING_VOLTAGE / (voc * COLD_TEMP_VOC_MULTIPLIER)));
  const minPerString = Math.max(1, Math.ceil(INVERTER_MIN_STRING_VOLTAGE / vmp));
  const neededStrings = Math.max(1, Math.ceil(totalPanels / maxPerString));
  const targetPerString = Math.min(maxPerString, Math.max(minPerString, Math.ceil(totalPanels / neededStrings)));

  const numStrings = Math.ceil(totalPanels / targetPerString);
  const stringSizes = [];
  let remaining = totalPanels;
  for (let i = 0; i < numStrings; i++) {
    const size = Math.min(targetPerString, remaining);
    stringSizes.push(size);
    remaining -= size;
  }

  return {
    panelsPerString: targetPerString,
    numStrings,
    stringSizes,
    stringVoltage: +(targetPerString * vmp).toFixed(1),
    stringCurrent: imp,
    totalDcCurrent: +(numStrings * imp).toFixed(1),
    panelWatts,
  };
}

function pickAcService(totalCapacityKw) {
  if (totalCapacityKw <= 10) return { voltage: 240, phase: 1, label: "240V Single-Phase" };
  if (totalCapacityKw <= 75) return { voltage: 208, phase: 3, label: "208V 3-Phase" };
  return { voltage: 480, phase: 3, label: "480V 3-Phase" };
}

export function computeElectricalDesign({ totalPanels, totalCapacityKw, panelWatts = DEFAULT_PANEL_WATTS, voc = DEFAULT_PANEL_VOC, vmp = DEFAULT_PANEL_VMP, imp = DEFAULT_PANEL_IMP }) {
  const stringing = computeStringingPlan(totalPanels, { panelWatts, voc, vmp, imp });

  if (!totalPanels || !totalCapacityKw) return null;

  const targetInverterKw = totalCapacityKw / 1.2; 
  let inverterCount = 1;
  let perInverterKw = roundUpToStandard(targetInverterKw, STANDARD_INVERTER_SIZES_KW);
  const MAX_SINGLE_INVERTER_KW = 100;
  if (perInverterKw > MAX_SINGLE_INVERTER_KW) {
    inverterCount = Math.ceil(targetInverterKw / MAX_SINGLE_INVERTER_KW);
    perInverterKw = roundUpToStandard(targetInverterKw / inverterCount, STANDARD_INVERTER_SIZES_KW);
  }
  const totalInverterKw = +(perInverterKw * inverterCount).toFixed(2);

  const acService = pickAcService(totalCapacityKw);
  const pf = 0.99;
  const acCurrentTotal = acService.phase === 3
    ? (totalInverterKw * 1000) / (acService.voltage * Math.sqrt(3) * pf)
    : (totalInverterKw * 1000) / (acService.voltage * pf);

  const breakerSize = roundUpToStandard(acCurrentTotal * 1.25, STANDARD_BREAKER_SIZES_A);
  const stringsPerInverter = Math.ceil(stringing.numStrings / inverterCount);

  return {
    stringing, inverterCount, perInverterKw, totalInverterKw, stringsPerInverter,
    acService, acCurrentTotal: +acCurrentTotal.toFixed(1), breakerSize,
    dcAcRatio: totalInverterKw > 0 ? +(totalCapacityKw / totalInverterKw).toFixed(2) : null,
  };
}

export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

export function formatCurrency(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString()}`;
}

// FILE: src/utils/reportUtils.js (Replace these two functions at the bottom)

export function estimateMonthlyProduction(annualKwh, lat = 20, solarUnits = []) {
  const hasRealApiData = solarUnits.length > 0 && solarUnits[0].monthlyRaw;

  // PRODUCTION-GRADE: Distribute the annual total exactly according to the 
  // real monthly solar flux sampled from the Google Solar API GeoTIFF.
  if (hasRealApiData) {
    const monthlyTotals = new Array(12).fill(0);
    solarUnits.forEach(unit => {
      if (unit.monthlyRaw) {
        unit.monthlyRaw.forEach((val, i) => monthlyTotals[i] += val);
      }
    });

    const sumFlux = monthlyTotals.reduce((a, b) => a + b, 0);

    return MONTH_LABELS.map((month, i) => ({
      month,
      kwh: sumFlux > 0 ? Math.round((monthlyTotals[i] / sumFlux) * (annualKwh || 0)) : 0,
    }));
  }

  // FALLBACK: Use cosine curve if GeoTIFF wasn't processed yet
  const isNorthern = lat >= 0;
  const peakMonthIdx = isNorthern ? 5 : 11;
  const amplitude = 0.32;
  const rawWeights = MONTH_LABELS.map((_, i) => 1 + amplitude * Math.cos((2 * Math.PI * (i - peakMonthIdx)) / 12));
  const sumWeights = rawWeights.reduce((a, b) => a + b, 0);

  return MONTH_LABELS.map((month, i) => ({
    month,
    kwh: Math.round((rawWeights[i] / sumWeights) * (annualKwh || 0)),
  }));
}


export function generateShadowProfile(solarUnits = [], obstacles = [], lat = 20) {
  const hasRealApiData = solarUnits.length > 0 && solarUnits[0].monthlyYield;

  // PRODUCTION-GRADE: Read the shading exactness directly from the API. 
  // If a panel's yield is 0.7 compared to the unshaded roof max of 1.0, it is 30% shaded.
  if (hasRealApiData) {
    const monthlyShading = new Array(12).fill(0);
    const panelCount = solarUnits.length;

    solarUnits.forEach(unit => {
      if (unit.monthlyYield) {
        unit.monthlyYield.forEach((yieldVal, i) => {
          const shadingSeverity = 1 - yieldVal; 
          monthlyShading[i] += shadingSeverity;
        });
      }
    });

    return MONTH_LABELS.map((month, i) => {
       const avgShading = (monthlyShading[i] / panelCount) * 100;
       return { month, shadingPct: Math.round(avgShading) };
    });
  }

  // FALLBACK: Use geometric distance heuristics if GeoTIFF wasn't processed
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!obstacles.length || !solarUnits.length) {
    return months.map(month => ({ month, shadingPct: 0 }));
  }

  return months.map((month, i) => {
    const declination = 23.45 * Math.sin((360 / 365) * (284 + (i * 30)) * (Math.PI / 180));
    const avgElevation = 90 - Math.abs(lat - declination);
    const tanElevation = Math.tan(avgElevation * (Math.PI / 180));

    let totalShadingSeverity = 0;
    solarUnits.forEach(unit => {
      obstacles.forEach(obs => {
        const dx = unit.position[0] - obs.position[0];
        const dz = unit.position[2] - obs.position[2];
        const distanceWorld = Math.sqrt(dx * dx + dz * dz);
        const obsHeight = obs.dimensions?.h || 1.5; 
        const shadowLength = obsHeight / Math.max(0.1, tanElevation);
        
        if (distanceWorld < shadowLength) {
           const severity = 1 - (distanceWorld / shadowLength);
           totalShadingSeverity += severity;
        }
      });
    });

    const rawPct = (totalShadingSeverity / solarUnits.length) * 100;
    return { month, shadingPct: Math.min(Math.round(rawPct), 45) };
  });
}