// FILE: src/components/SolarArray.jsx
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { metersToWorld } from "../utils/scaleUtils";

// Default Materials
const matPanelStandard = new THREE.MeshStandardMaterial({ color: "#0f1f3a", roughness: 0.08, metalness: 0.95, emissive: "#050e1c", emissiveIntensity: 0.35 });
const matCellLine = new THREE.MeshStandardMaterial({ color: "#0a1628", roughness: 0.06, metalness: 0.98, emissive: "#040c1a", emissiveIntensity: 0.20 });
const matAlumFrame = new THREE.MeshStandardMaterial({ color: "#d4d4d4", roughness: 0.25, metalness: 0.92 });
const matSteelLight = new THREE.MeshStandardMaterial({ color: "#bbbbbb", roughness: 0.4, metalness: 0.85 }); 
const matSteelHeavy = new THREE.MeshStandardMaterial({ color: "#777777", roughness: 0.6, metalness: 0.70 }); 
const matBasePlate = new THREE.MeshStandardMaterial({ color: "#555555", roughness: 0.80, metalness: 0.50 });
const matSelectGlow = new THREE.MeshStandardMaterial({ color: "#44aaff", emissive: "#0044aa", emissiveIntensity: 0.8, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
const matInvalidGlow = new THREE.MeshStandardMaterial({ color: "#ff4444", emissive: "#aa0000", emissiveIntensity: 0.8, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });

function addBox(group, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}

// Passed dynamic material down to the panels
function buildPanelAssembly(PW, PH, PT, mpu, activePanelMat) {
  const group = new THREE.Group();
  const BT = metersToWorld(0.022, mpu); 
  const CT = metersToWorld(0.010, mpu); 

  addBox(group, PW, PT, PH, activePanelMat, 0, PT / 2, PH / 2);

  const fY = PT + BT / 4; 
  addBox(group, PW, BT, BT, matAlumFrame, 0, fY, BT / 2);
  addBox(group, PW, BT, BT, matAlumFrame, 0, fY, PH - BT / 2);
  addBox(group, BT, BT, PH - BT * 2, matAlumFrame, -PW / 2 + BT / 2, fY, PH / 2);
  addBox(group, BT, BT, PH - BT * 2, matAlumFrame,  PW / 2 - BT / 2, fY, PH / 2);

  const innerW = PW - BT * 2, innerH = PH - BT * 2, cY = PT + CT / 2;
  const cellRows = PH > PW ? 3 : 2; 
  for (let i = 1; i < cellRows; i++) addBox(group, innerW, CT, CT, matCellLine, 0, cY, BT + (innerH * i) / cellRows);
  if (PH > PW) addBox(group, CT, CT, innerH, matCellLine, 0, cY, PH / 2);

  return group;
}

function buildSolarUnitGroup(mpu, rows, cols, orientation, mountingType, frontLegHeight, tiltAngleDeg, structureProfile, activePanelMat) {
  const root = new THREE.Group();
  const isLandscape = orientation === 'landscape';
  const rawW = isLandscape ? 1.65 : 1.00;
  const rawH = isLandscape ? 1.00 : 1.65;
  const PW = metersToWorld(rawW, mpu), PH = metersToWorld(rawH, mpu), PT = metersToWorld(0.035, mpu);  
  const GAP_X = metersToWorld(0.05, mpu), GAP_Z = metersToWorld(0.30, mpu);
  const isFlush = mountingType === 'flush';
  const TILT = isFlush ? 0 : tiltAngleDeg * (Math.PI / 180);       
  const MH_FRONT = isFlush ? 0 : metersToWorld(frontLegHeight, mpu);
  const MH_REAR = isFlush ? 0 : MH_FRONT + PH * Math.sin(TILT);
  
  const isHeavyBox = structureProfile === 'box';
  const RAIL_T = metersToWorld(isHeavyBox ? 0.080 : 0.040, mpu);
  const LEG_W = metersToWorld(isHeavyBox ? 0.100 : 0.050, mpu);
  const matStruct = isHeavyBox ? matSteelHeavy : matSteelLight;
  const BP_SIZE = metersToWorld(0.200, mpu), BP_T = metersToWorld(0.020, mpu);  

  const totalW = cols * PW + (cols - 1) * GAP_X;
  const totalD = rows * PH * Math.cos(TILT) + (rows - 1) * GAP_Z;

  const colX = []; for (let c = 0; c < cols; c++) colX.push(-totalW / 2 + c * (PW + GAP_X) + PW / 2);
  const rowFrontZ = []; for (let r = 0; r < rows; r++) rowFrontZ.push(-totalD / 2 + r * (PH * Math.cos(TILT) + GAP_Z));

  for (let r = 0; r < rows; r++) {
    const zFront = rowFrontZ[r], zRear = zFront + PH * Math.cos(TILT), zMid = (zFront + zRear) / 2;
    const yRailFront = MH_FRONT + RAIL_T / 2, yRailRear = MH_REAR + RAIL_T / 2;

    if (!isFlush) {
        for (let c = 0; c < cols; c++) {
          const xEdges = [colX[c] - PW / 2 + RAIL_T / 2, colX[c] + PW / 2 - RAIL_T / 2];
          for (const xe of xEdges) {
            const yAvg = (yRailFront + yRailRear) / 2;
            const railLen = Math.sqrt(Math.pow(zRear - zFront, 2) + Math.pow(MH_REAR - MH_FRONT, 2));
            const railTiltAngle = Math.atan2(MH_REAR - MH_FRONT, zRear - zFront);
            const rail = new THREE.Mesh(new THREE.BoxGeometry(RAIL_T, RAIL_T, railLen), matStruct);
            rail.position.set(xe, yAvg, zMid); rail.rotation.x = -railTiltAngle; rail.castShadow = true; root.add(rail);
          }
        }
        const crossRailLen = totalW + metersToWorld(0.10, mpu);
        addBox(root, crossRailLen, RAIL_T, RAIL_T, matStruct, 0, yRailFront, zFront);
        addBox(root, crossRailLen, RAIL_T, RAIL_T, matStruct, 0, yRailRear, zRear);

        const legXPositions = [-totalW / 2];
        for (let c = 0; c < cols - 1; c++) legXPositions.push(colX[c] + PW / 2 + GAP_X / 2); 
        legXPositions.push(totalW / 2); 

        for (const lx of legXPositions) {
          addBox(root, LEG_W, MH_FRONT, LEG_W, matStruct, lx, MH_FRONT / 2, zFront);
          addBox(root, BP_SIZE, BP_T, BP_SIZE, matBasePlate, lx, BP_T / 2, zFront);
          addBox(root, LEG_W, MH_REAR, LEG_W, matStruct, lx, MH_REAR / 2, zRear);
          addBox(root, BP_SIZE, BP_T, BP_SIZE, matBasePlate, lx, BP_T / 2, zRear);
        }
    }

    for (let c = 0; c < cols; c++) {
      const panelGroup = buildPanelAssembly(PW, PH, PT, mpu, activePanelMat); // Passed mat here
      panelGroup.rotation.x = -TILT;
      const yOffset = isFlush ? (PT / 2) + metersToWorld(0.04, mpu) : MH_FRONT + RAIL_T;
      panelGroup.position.set(colX[c], yOffset, zFront);
      root.add(panelGroup);
    }
  }

  return root;
}

export default function SolarUnit({ 
  id, position, rotation = 0, mpu, isSelected, isValid, onSelect, onDrag, onDrop, 
  rows = 3, cols = 4, orientation = 'portrait',
  mountingType = 'tilt_legs', frontLegHeight = 1.2, tiltAngle = 12, structureProfile = 'c_channel',
  viewMode, fluxColor // NEW PROPS FOR HEATMAP
}) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());
  const { camera, scene, gl } = useThree();

  const [localPos, setLocalPos] = useState(() => new THREE.Vector3(...position));
  const [localNormal, setLocalNormal] = useState(() => new THREE.Vector3(0, 1, 0));
  const [needsInitialSnap, setNeedsInitialSnap] = useState(true);

  const isRoofSloped = localNormal.y < 0.99;
  const activeMountingType = isRoofSloped ? 'flush' : mountingType;

  useEffect(() => {
    if (!isDragging.current) {
      setLocalPos(new THREE.Vector3(...position));
      setNeedsInitialSnap(true);
    }
  }, [position]);

  // Dynamically color the panel if heatmap is on
  const activePanelMat = useMemo(() => {
    if (viewMode === 'heatmap' && fluxColor) {
        return new THREE.MeshStandardMaterial({ color: fluxColor, roughness: 0.1, metalness: 0.6 });
    }
    return matPanelStandard;
  }, [viewMode, fluxColor]);

  const unitGroup = useRef(null);
  
  // Notice we added activePanelMat to the cache key so it rebuilds when color changes
  const currentKey = `${mpu}-${rows}-${cols}-${orientation}-${activeMountingType}-${frontLegHeight}-${tiltAngle}-${structureProfile}-${activePanelMat.uuid}`;
  
  if (!unitGroup.current || unitGroup.current.userData.cacheKey !== currentKey) {
    if (unitGroup.current) unitGroup.current.traverse(c => { c.geometry?.dispose(); });
    unitGroup.current = buildSolarUnitGroup(mpu, rows, cols, orientation, activeMountingType, frontLegHeight, tiltAngle, structureProfile, activePanelMat);
    unitGroup.current.userData.cacheKey = currentKey;
  }

  const getRoofHitAtWorldXZ = useCallback((x, z) => {
    const ray = new THREE.Raycaster(new THREE.Vector3(x, 1000, z), new THREE.Vector3(0, -1, 0));
    const intersects = ray.intersectObjects(scene.children, true);
    const hit = intersects.find(h => h.object.userData?.isRoof);
    if (!hit) return null;
    return { point: hit.point, normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize() };
  }, [scene]);

  const getCameraRayHit = useCallback((e) => {
    const nativeEvent = e.nativeEvent || e;
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((nativeEvent.clientX - rect.left) / rect.width) * 2 - 1, -((nativeEvent.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const intersects = ray.intersectObjects(scene.children, true);
    const hit = intersects.find(h => h.object.userData?.isRoof);
    if (!hit) return null;
    return { point: hit.point };
  }, [camera, gl, scene]);

  const onPointerDown = useCallback((e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId); 
    onSelect?.(id);
    isDragging.current = true;
    
    const camHit = getCameraRayHit(e);
    if (camHit) dragOffset.current.set(localPos.x - camHit.point.x, 0, localPos.z - camHit.point.z);
  }, [id, onSelect, localPos, getCameraRayHit]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    const camHit = getCameraRayHit(e);
    if (camHit) {
      const targetX = camHit.point.x + dragOffset.current.x;
      const targetZ = camHit.point.z + dragOffset.current.z;
      
      const roofHit = getRoofHitAtWorldXZ(targetX, targetZ);
      if (roofHit) {
        setLocalPos(roofHit.point);
        setLocalNormal(roofHit.normal);
        onDrag?.(id, [roofHit.point.x, roofHit.point.y, roofHit.point.z]);
      }
    }
  }, [getCameraRayHit, getRoofHitAtWorldXZ, onDrag, id]);

  const onPointerUp = useCallback((e) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    isDragging.current = false;
    try { e.target.releasePointerCapture(e.pointerId); } catch(err) {} 
    onDrop?.(id, [localPos.x, localPos.y, localPos.z]);
  }, [id, onDrop, localPos]);

  useEffect(() => {
    if (groupRef.current) {
      const up = new THREE.Vector3(0, 1, 0);
      const normalQuat = new THREE.Quaternion().setFromUnitVectors(up, localNormal);
      const userQuat = new THREE.Quaternion().setFromAxisAngle(up, -rotation);
      groupRef.current.quaternion.copy(normalQuat).multiply(userQuat);
    }
  }, [localNormal, rotation]);

  useFrame(({ clock }) => {
    if (needsInitialSnap && scene && !isDragging.current) {
      const roofHit = getRoofHitAtWorldXZ(localPos.x, localPos.z);
      if (roofHit) {
        setLocalPos(roofHit.point);
        setLocalNormal(roofHit.normal);
        setNeedsInitialSnap(false); 
      }
    }

    if (!groupRef.current) return;
    if (isSelected && isValid) {
        const s = 1 + 0.018 * Math.sin(clock.getElapsedTime() * 4);
        groupRef.current.scale.set(s, s, s);
    } else {
        groupRef.current.scale.set(1, 1, 1);
    }
  });

  const pos = localPos;

  const feedbackBox = (isSelected || !isValid) ? (() => {
    const isLandscape = orientation === 'landscape';
    const rawW = isLandscape ? 1.65 : 1.00;
    const rawH = isLandscape ? 1.00 : 1.65;
    
    const TILT = activeMountingType === 'flush' ? 0 : tiltAngle * (Math.PI / 180);
    const MH_FRONT = activeMountingType === 'flush' ? 0 : metersToWorld(frontLegHeight, mpu);
    
    const PW = metersToWorld(rawW, mpu), PH = metersToWorld(rawH, mpu), GAP_X = metersToWorld(0.05, mpu), GAP_Z = metersToWorld(0.30, mpu);
    const totalW = cols * PW + (cols - 1) * GAP_X;
    const totalD = rows * PH * Math.cos(TILT) + (rows - 1) * GAP_Z;
    const totalH = MH_FRONT + metersToWorld(0.15 + rawH * Math.sin(TILT), mpu);
    
    const pad = metersToWorld(0.12, mpu);
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