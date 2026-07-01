import * as THREE from "three";
import { polygonToThreeJSWithCenter, calculateBoundingBox } from "./polygonUtils";
import { metersToWorld, PIXELS_TO_WORLD, PANEL_WIDTH_M, PANEL_HEIGHT_M, PANEL_GAP_M } from "./scaleUtils";

export function polygonToWorldPoints(polygon, globalCenter) {
  return polygonToThreeJSWithCenter(polygon, globalCenter, PIXELS_TO_WORLD);
}

// ─── CAD MESH BUILDER ────────────────────────────────────────────────────────

export function buildComplexRoofGeometry(nodes, faces, globalCenter, mpu) {
  if (!faces || faces.length === 0 || !nodes || nodes.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];

  const worldNodes = {};
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  nodes.forEach(n => {
    const pt = polygonToWorldPoints([{ x: n.x, y: n.y }], globalCenter)[0];
    worldNodes[n.id] = { wx: pt.x, wy: pt.y, wz: metersToWorld(parseFloat(n.z) || 0, mpu) };
    if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y;
  });

  const width = maxX - minX || 1, height = maxY - minY || 1;
  const getUv = (x, y) => [(x - minX) / width, (y - minY) / height];

  faces.forEach(face => {
    const facePts = face.nodeIds.map(id => worldNodes[id]).filter(Boolean);
    if (facePts.length < 3) return;

    const contour = facePts.map(p => new THREE.Vector2(p.wx, p.wy));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);

    triangles.forEach(tri => {
      const a = facePts[tri[0]], b = facePts[tri[1]], c = facePts[tri[2]];
      vertices.push(a.wx, a.wy, a.wz, b.wx, b.wy, b.wz, c.wx, c.wy, c.wz);
      uvs.push(...getUv(a.wx, a.wy), ...getUv(b.wx, b.wy), ...getUv(c.wx, c.wy));
    });
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

// ─── FIX: CAD WALL BUILDER ───────────────────────────────────────────────────

export function buildComplexWallsGeometry(nodes, faces, globalCenter, baseHeightM, mpu) {
  if (!faces || faces.length === 0) return null;

  const wallH = metersToWorld(parseFloat(baseHeightM) || 0, mpu);
  
  const worldNodes = {};
  nodes.forEach(n => {
    const pt = polygonToWorldPoints([{ x: n.x, y: n.y }], globalCenter)[0];
    worldNodes[n.id] = { wx: pt.x, wy: pt.y, wz: metersToWorld(parseFloat(n.z) || 0, mpu) };
  });

  // Extract every unique edge drawn
  const uniqueEdges = {};
  faces.forEach(face => {
    const fNodes = face.nodeIds;
    for (let i = 0; i < fNodes.length; i++) {
      const id1 = fNodes[i], id2 = fNodes[(i + 1) % fNodes.length];
      const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
      if (!uniqueEdges[key]) {
        uniqueEdges[key] = { p1: worldNodes[id1], p2: worldNodes[id2] };
      }
    }
  });

  const vertices = [];
  const uvs = [];
  
  // Drop a wall for every unique edge. Inner walls will be hidden inside the building, 
  // guaranteeing the outer perimeter shell is completely solid with no missing faces.
  Object.values(uniqueEdges).forEach(({ p1, p2 }) => {
    if (!p1 || !p2) return;
    
    const z1 = p1.wz + wallH;
    const z2 = p2.wz + wallH;

    // Triangle 1
    vertices.push(
      p1.wx, p1.wy, 0,
      p2.wx, p2.wy, 0,
      p1.wx, p1.wy, z1
    );
    uvs.push(0, 0, 1, 0, 0, 1);

    // Triangle 2
    vertices.push(
      p2.wx, p2.wy, 0,
      p2.wx, p2.wy, z2,
      p1.wx, p1.wy, z1
    );
    uvs.push(1, 0, 1, 1, 0, 1);
  });

  if (vertices.length === 0) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function computeSolarArrayPlacement(nodes, globalCenter, roofZ, mpu, marginM = 0.5) {
  // Legacy function signature preserved to avoid breaking external imports, 
  // but true advanced Auto-Fill is now handled inside RoofPolygonDrawer.jsx
  return null; 
}