import { isPointInPolygon } from "./polygonUtils";

// Helper: Get corners of an oriented rectangle
function getOBBCorners(cx, cz, w, d, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const hw = w / 2;
  const hd = d / 2;

  // Local corners
  const corners = [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd }
  ];

  // Rotate and translate
  return corners.map(c => ({
    x: cx + (c.x * cos - c.y * sin),
    y: cz + (c.x * sin + c.y * cos)
  }));
}

// Separating Axis Theorem (SAT) for two OBBs
export function doOBBsIntersect(rect1Corners, rect2Corners) {
  const polys = [rect1Corners, rect2Corners];
  
  for (let i = 0; i < polys.length; i++) {
    const poly = polys[i];
    for (let j = 0; j < poly.length; j++) {
      const p1 = poly[j];
      const p2 = poly[(j + 1) % poly.length];
      
      // Normal vector
      const normal = { x: p2.y - p1.y, y: p1.x - p2.x };
      
      let minA = Infinity, maxA = -Infinity;
      for (const p of polys[0]) {
        const projected = normal.x * p.x + normal.y * p.y;
        minA = Math.min(minA, projected);
        maxA = Math.max(maxA, projected);
      }
      
      let minB = Infinity, maxB = -Infinity;
      for (const p of polys[1]) {
        const projected = normal.x * p.x + normal.y * p.y;
        minB = Math.min(minB, projected);
        maxB = Math.max(maxB, projected);
      }
      
      if (maxA < minB || maxB < minA) {
        return false; // Separating axis found
      }
    }
  }
  return true;
}

export function isOBBInsidePolygon(corners, polygon) {
  return corners.every(corner => isPointInPolygon(corner, polygon));
}

export function getEntityCorners(position, width, depth, rotation = 0) {
  // position is [x, y, z]. We map X -> X and Z -> Y for 2D math
  return getOBBCorners(position[0], position[2], width, depth, rotation);
}