import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { metersToWorld } from "../utils/scaleUtils";

const matACUnit = new THREE.MeshStandardMaterial({ color: "#d4d4d4", roughness: 0.6, metalness: 0.2 });
const matFan = new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.9 });
const matTank = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.4, metalness: 0.1 });
const matSelectGlow = new THREE.MeshStandardMaterial({ color: "#44aaff", emissive: "#0044aa", emissiveIntensity: 0.8, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
const matInvalidGlow = new THREE.MeshStandardMaterial({ color: "#ff4444", emissive: "#aa0000", emissiveIntensity: 0.8, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });

function buildACUnit(w, h, d) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matACUnit);
  body.position.set(0, h / 2, 0); body.castShadow = true; body.receiveShadow = true; group.add(body);
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(w, d) * 0.35, Math.min(w, d) * 0.35, 0.05, 16), matFan);
  fan.position.set(0, h + 0.025, 0); group.add(fan);
  return group;
}

function buildWaterTank(w, h, d) {
  const group = new THREE.Group();
  const radius = Math.min(w, d) / 2;
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 32), matTank);
  tank.position.set(0, h / 2, 0); tank.castShadow = true; tank.receiveShadow = true; group.add(tank);
  return group;
}

export default function RoofObstacle({ id, type, dimensions, position, rotation = 0, mpu, isSelected, isValid, onSelect, onDrag, onDrop, roofZ }) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());
  const { camera, gl } = useThree();

  const [localPos, setLocalPos] = useState(() => new THREE.Vector3(...position));
  const actualRoofZ = roofZ !== undefined ? roofZ : position[1];

  useEffect(() => {
    if (!isDragging.current) setLocalPos(new THREE.Vector3(...position));
  }, [position]);

  const obstacleMesh = useMemo(() => {
    const w = metersToWorld(dimensions.w, mpu), d = metersToWorld(dimensions.d, mpu), h = metersToWorld(dimensions.h, mpu);
    if (type === "water_tank") return buildWaterTank(w, h, d);
    return buildACUnit(w, h, d);
  }, [type, dimensions, mpu]);

  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const getWorldPosFromPointer = useCallback((e) => {
    const nativeEvent = e.nativeEvent || e;
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((nativeEvent.clientX - rect.left) / rect.width) * 2 - 1,
      -((nativeEvent.clientY - rect.top) / rect.height) * 2 + 1,
    );
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
    
    // 👇 THIS IS THE CRITICAL FIX THAT OPENS THE SIDE MENU
    onSelect?.(id); 
    
    isDragging.current = true;
    const worldHit = getWorldPosFromPointer(e);
    if (worldHit) dragOffset.current.set(localPos.x - worldHit.x, 0, localPos.z - worldHit.z);
  }, [id, onSelect, localPos, getWorldPosFromPointer]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    const worldHit = getWorldPosFromPointer(e);
    if (worldHit) {
      const newX = worldHit.x + dragOffset.current.x, newZ = worldHit.z + dragOffset.current.z;
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
    const w = metersToWorld(dimensions.w, mpu), d = metersToWorld(dimensions.d, mpu), h = metersToWorld(dimensions.h, mpu), pad = metersToWorld(0.12, mpu);
    const material = isValid ? matSelectGlow : matInvalidGlow;
    return (
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + pad, h + pad, d + pad]} />
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
      <primitive object={obstacleMesh} />
      {feedbackBox}
    </group>
  );
}