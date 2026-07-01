import { useRef, useState, useCallback, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { metersToWorld } from "../utils/scaleUtils";

const matPanel = new THREE.MeshStandardMaterial({ color: "#0f1f3a", roughness: 0.08, metalness: 0.95, emissive: "#050e1c", emissiveIntensity: 0.35 });
const matCellLine = new THREE.MeshStandardMaterial({ color: "#0a1628", roughness: 0.06, metalness: 0.98, emissive: "#040c1a", emissiveIntensity: 0.20 });
const matAlumFrame = new THREE.MeshStandardMaterial({ color: "#d4d4d4", roughness: 0.25, metalness: 0.92 });
const matSteel = new THREE.MeshStandardMaterial({ color: "#aaaaaa", roughness: 0.45, metalness: 0.80 });
const matBasePlate = new THREE.MeshStandardMaterial({ color: "#888888", roughness: 0.60, metalness: 0.70 });
const matSelectGlow = new THREE.MeshStandardMaterial({ color: "#44aaff", emissive: "#0044aa", emissiveIntensity: 0.8, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
const matInvalidGlow = new THREE.MeshStandardMaterial({ color: "#ff4444", emissive: "#aa0000", emissiveIntensity: 0.8, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });

function addBox(group, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}

function buildPanelAssembly(PW, PH, PT, mpu) {
  const group = new THREE.Group();
  const BT = metersToWorld(0.022, mpu); 
  const CT = metersToWorld(0.010, mpu); 

  addBox(group, PW, PT, PH, matPanel, 0, PT / 2, PH / 2);

  const fY = PT + BT / 4; 
  addBox(group, PW, BT, BT, matAlumFrame, 0, fY, BT / 2);
  addBox(group, PW, BT, BT, matAlumFrame, 0, fY, PH - BT / 2);
  addBox(group, BT, BT, PH - BT * 2, matAlumFrame, -PW / 2 + BT / 2, fY, PH / 2);
  addBox(group, BT, BT, PH - BT * 2, matAlumFrame,  PW / 2 - BT / 2, fY, PH / 2);

  const innerW = PW - BT * 2, innerH = PH - BT * 2, cY = PT + CT / 2;
  // Adjust cell lines based on orientation ratio
  const cellRows = PH > PW ? 3 : 2; 
  for (let i = 1; i < cellRows; i++) addBox(group, innerW, CT, CT, matCellLine, 0, cY, BT + (innerH * i) / cellRows);
  if (PH > PW) addBox(group, CT, CT, innerH, matCellLine, 0, cY, PH / 2);

  return group;
}

function buildSolarUnitGroup(mpu, rows, cols, orientation) {
  const root = new THREE.Group();
  
  // Swap Dimensions for Landscape
  const isLandscape = orientation === 'landscape';
  const rawW = isLandscape ? 1.65 : 1.00;
  const rawH = isLandscape ? 1.00 : 1.65;
  
  const PW = metersToWorld(rawW, mpu), PH = metersToWorld(rawH, mpu), PT = metersToWorld(0.035, mpu);  
  const GAP_X = metersToWorld(0.05, mpu), GAP_Z = metersToWorld(0.30, mpu), TILT = 12 * (Math.PI / 180);       
  const RAIL_T = metersToWorld(0.050, mpu), LEG_W = metersToWorld(0.060, mpu), BP_SIZE = metersToWorld(0.180, mpu), BP_T = metersToWorld(0.020, mpu);  
  const MH_FRONT = metersToWorld(1.20, mpu), MH_REAR = MH_FRONT + PH * Math.sin(TILT);

  const totalW = cols * PW + (cols - 1) * GAP_X;
  const totalD = rows * PH * Math.cos(TILT) + (rows - 1) * GAP_Z;

  const colX = []; for (let c = 0; c < cols; c++) colX.push(-totalW / 2 + c * (PW + GAP_X) + PW / 2);
  const rowFrontZ = []; for (let r = 0; r < rows; r++) rowFrontZ.push(-totalD / 2 + r * (PH * Math.cos(TILT) + GAP_Z));

  for (let r = 0; r < rows; r++) {
    const zFront = rowFrontZ[r], zRear = zFront + PH * Math.cos(TILT), zMid = (zFront + zRear) / 2;
    const yRailFront = MH_FRONT + RAIL_T / 2, yRailRear = MH_REAR + RAIL_T / 2;

    for (let c = 0; c < cols; c++) {
      const xEdges = [colX[c] - PW / 2 + RAIL_T / 2, colX[c] + PW / 2 - RAIL_T / 2];
      for (const xe of xEdges) {
        const yAvg = (yRailFront + yRailRear) / 2;
        const railLen = Math.sqrt(Math.pow(zRear - zFront, 2) + Math.pow(MH_REAR - MH_FRONT, 2));
        const railTiltAngle = Math.atan2(MH_REAR - MH_FRONT, zRear - zFront);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(RAIL_T, RAIL_T, railLen), matSteel);
        rail.position.set(xe, yAvg, zMid); rail.rotation.x = -railTiltAngle; rail.castShadow = true; root.add(rail);
      }
    }

    const crossRailLen = totalW + metersToWorld(0.10, mpu);
    addBox(root, crossRailLen, RAIL_T, RAIL_T, matAlumFrame, 0, yRailFront, zFront);
    addBox(root, crossRailLen, RAIL_T, RAIL_T, matAlumFrame, 0, yRailRear, zRear);

    const legXPositions = [-totalW / 2];
    for (let c = 0; c < cols - 1; c++) legXPositions.push(colX[c] + PW / 2 + GAP_X / 2); 
    legXPositions.push(totalW / 2); 

    for (const lx of legXPositions) {
      addBox(root, LEG_W, MH_FRONT, LEG_W, matSteel, lx, MH_FRONT / 2, zFront);
      addBox(root, BP_SIZE, BP_T, BP_SIZE, matBasePlate, lx, BP_T / 2, zFront);
      addBox(root, LEG_W, MH_REAR, LEG_W, matSteel, lx, MH_REAR / 2, zRear);
      addBox(root, BP_SIZE, BP_T, BP_SIZE, matBasePlate, lx, BP_T / 2, zRear);
    }

    for (let c = 0; c < cols; c++) {
      const panelGroup = buildPanelAssembly(PW, PH, PT, mpu);
      panelGroup.rotation.x = -TILT;
      panelGroup.position.set(colX[c], MH_FRONT + RAIL_T, zFront);
      root.add(panelGroup);
    }
  }

  return root;
}

export default function SolarUnit({ id, position, rotation = 0, mpu, isSelected, isValid, onSelect, onDrag, onDrop, roofZ, rows = 3, cols = 4, orientation = 'portrait' }) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());
  const { camera, gl } = useThree();

  const [localPos, setLocalPos] = useState(() => new THREE.Vector3(...position));
  const actualRoofZ = roofZ !== undefined ? roofZ : position[1];

  useEffect(() => {
    if (!isDragging.current) setLocalPos(new THREE.Vector3(...position));
  }, [position]);

  const unitGroup = useRef(null);
  
  // Rebuild mesh if mpu, rows, cols, or orientation change
  const currentKey = `${mpu}-${rows}-${cols}-${orientation}`;
  if (!unitGroup.current || unitGroup.current.userData.cacheKey !== currentKey) {
    if (unitGroup.current) unitGroup.current.traverse(c => { c.geometry?.dispose(); });
    unitGroup.current = buildSolarUnitGroup(mpu, rows, cols, orientation);
    unitGroup.current.userData.cacheKey = currentKey;
  }

  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const getWorldPosFromPointer = useCallback((e) => {
    const nativeEvent = e.nativeEvent || e;
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((nativeEvent.clientX - rect.left) / rect.width) * 2 - 1, -((nativeEvent.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    dragPlane.current.constant = -actualRoofZ; 
    const hit = new THREE.Vector3();
    ray.ray.intersectPlane(dragPlane.current, hit);
    return hit;
  }, [camera, gl, actualRoofZ]);

  const onPointerDown = useCallback((e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId); 
    onSelect?.(id);
    isDragging.current = true;
    
    const worldHit = getWorldPosFromPointer(e);
    if (worldHit) {
      dragOffset.current.set(localPos.x - worldHit.x, 0, localPos.z - worldHit.z);
    }
  }, [id, onSelect, localPos, getWorldPosFromPointer]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    const worldHit = getWorldPosFromPointer(e);
    if (worldHit) {
      const newX = worldHit.x + dragOffset.current.x;
      const newZ = worldHit.z + dragOffset.current.z;
      setLocalPos(new THREE.Vector3(newX, actualRoofZ, newZ));
      onDrag?.(id, [newX, actualRoofZ, newZ]);
    }
  }, [getWorldPosFromPointer, actualRoofZ, onDrag, id]);

  const onPointerUp = useCallback((e) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    isDragging.current = false;
    try { e.target.releasePointerCapture(e.pointerId); } catch(err) {} 
    onDrop?.(id, [localPos.x, actualRoofZ, localPos.z]);
  }, [id, onDrop, localPos, actualRoofZ]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (isSelected && isValid) groupRef.current.scale.setScalar(1 + 0.018 * Math.sin(clock.getElapsedTime() * 4));
    else groupRef.current.scale.setScalar(1);
  });

  const pos = isDragging.current ? localPos : new THREE.Vector3(...position);

  const feedbackBox = (isSelected || !isValid) ? (() => {
    const isLandscape = orientation === 'landscape';
    const rawW = isLandscape ? 1.65 : 1.00;
    const rawH = isLandscape ? 1.00 : 1.65;
    const PW = metersToWorld(rawW, mpu), PH = metersToWorld(rawH, mpu), GAP_X = metersToWorld(0.05, mpu), GAP_Z = metersToWorld(0.30, mpu), TILT = 12 * (Math.PI / 180);
    
    const totalW = cols * PW + (cols - 1) * GAP_X;
    const totalD = rows * PH * Math.cos(TILT) + (rows - 1) * GAP_Z;
    const totalH = metersToWorld(0.15 + rawH * Math.sin(TILT) + 0.10, mpu), pad = metersToWorld(0.12, mpu);
    const material = isValid ? matSelectGlow : matInvalidGlow;

    return (
      <mesh position={[0, totalH / 2, 0]}>
        <boxGeometry args={[totalW + pad, totalH + pad, totalD + pad]} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  })() : null;

  return (
    <group
      ref={groupRef}
      position={[pos.x, pos.y, pos.z]}
      rotation={[0, -rotation, 0]} 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerUp} 
    >
      <primitive object={unitGroup.current} />
      {feedbackBox}
    </group>
  );
}