export const centerPolygon = (points, canvasWidth = 700, canvasHeight = 500) => {
  if (!points || points.length === 0) return [];

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const polyWidth = maxX - minX;
  const polyHeight = maxY - minY;

  const offsetX = (canvasWidth - polyWidth) / 2 - minX;
  const offsetY = (canvasHeight - polyHeight) / 2 - minY;

  return points.map((p) => ({
    x: p.x + offsetX,
    y: p.y + offsetY,
  }));
};

export const normalizePolygon = (points, targetWidth = 400, targetHeight = 300) => {
  if (!points || points.length === 0) return [];

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const polyWidth = maxX - minX || 1;
  const polyHeight = maxY - minY || 1;

  const scaleX = targetWidth / polyWidth;
  const scaleY = targetHeight / polyHeight;
  const scale = Math.min(scaleX, scaleY);

  return points.map((p) => ({
    x: (p.x - minX) * scale,
    y: (p.y - minY) * scale,
  }));
};

export const polygonToThreeJS = (points, canvasWidth = 700, canvasHeight = 500, scale = 0.01) => {
  if (!points || points.length === 0) return [];

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return points.map((p) => ({
    x: (p.x - centerX) * scale,
    y: -(p.y - centerY) * scale,
  }));
};

export const calculatePolygonArea = (points) => {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

export const calculatePolygonCentroid = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return { x: cx, y: cy };
};

export const calculateBoundingBox = (points) => {
  if (!points || points.length === 0) return null;
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
};

export const isPolygonClockwise = (points) => {
  if (!points || points.length < 3) return false;
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
  }
  return sum > 0;
};

export const ensureCounterClockwise = (points) => {
  if (!points || points.length < 3) return points;
  if (isPolygonClockwise(points)) {
    return [...points].reverse();
  }
  return points;
};

export const scalePolygon = (points, factor) => {
  if (!points || points.length === 0) return [];
  const centroid = calculatePolygonCentroid(points);
  return points.map((p) => ({
    x: centroid.x + (p.x - centroid.x) * factor,
    y: centroid.y + (p.y - centroid.y) * factor,
  }));
};

export const translatePolygon = (points, dx, dy) => {
  if (!points || points.length === 0) return [];
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
};

export const isPointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

export const polygonPerimeter = (points) => {
  if (!points || points.length < 2) return 0;
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += Math.sqrt(
      (points[j].x - points[i].x) ** 2 + (points[j].y - points[i].y) ** 2
    );
  }

  return perimeter;
  };
  // Convert polygon using a shared global center across all sections
// globalCenter: { x, y } in canvas coords — compute once from all polygons combined
export const polygonToThreeJSWithCenter = (points, globalCenter, scale = 0.012) => {
  if (!points || points.length === 0) return [];
  return points.map((p) => ({
    x: (p.x - globalCenter.x) * scale,
    y: -(p.y - globalCenter.y) * scale,
  }));
};

// Compute global center from ALL parts of ALL sections combined
export const computeGlobalCenter = (sections) => {
  // Extract points from every part in every section
  const allPoints = sections.flatMap(s => s.parts.flatMap(p => p.polygon || []));
  
  if (!allPoints.length) return { x: 350, y: 250 };
  
  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxY = Math.max(...allPoints.map(p => p.y));
  
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
};

// --- NEW FOR PITCHED ROOFS ---
// Computes a basic "Center Peak" skeleton for 2D UI rendering
export const generateRoofSkeleton = (points) => {
  if (!points || points.length < 3) return { peak: null, ridges: [] };
  
  // Calculate centroid
  const centroid = calculatePolygonCentroid(points);
  
  // Create lines from centroid to every corner
  const ridges = points.map(p => ({ p1: p, p2: centroid }));
  
  return { peak: centroid, ridges };
};

// Gets the max distance from centroid to any edge (used for 3D height calculation)
export const getMaxCentroidDistance = (points, centroid) => {
  if (!points || !centroid || points.length < 3) return 0;
  let maxDist = 0;
  for (let i = 0; i < points.length; i++) {
    const dist = Math.sqrt(Math.pow(points[i].x - centroid.x, 2) + Math.pow(points[i].y - centroid.y, 2));
    if (dist > maxDist) maxDist = dist;
  }
  return maxDist;
};

// ... existing polygonUtils.js code ...

