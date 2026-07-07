# Solar Roof POC Codebase

# FILE: src\App.jsx

```js
import { useState } from "react";
import MapView from "./components/MapView";
import RoofEditor from "./components/RoofEditor";
import "./styles/app.css";

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showRoofEditor, setShowRoofEditor] = useState(false);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowRoofEditor(false);
  };

  const handleOpenRoofEditor = () => {
    setShowRoofEditor(true);
  };

  const handleBackToMap = () => {
    setShowRoofEditor(false);
  };

  return (
    <div className="app-container">
      {!showRoofEditor ? (
        <div className="map-screen">
          <MapView onLocationSelect={handleLocationSelect} />
          {selectedLocation && (
            <div className="location-panel">
              <div className="location-info">
                <span>📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
                {selectedLocation.address && (
                  <span className="address-text">{selectedLocation.address}</span>
                )}
              </div>
              <button className="open-editor-btn" onClick={handleOpenRoofEditor}>
                Open Roof Editor
              </button>
            </div>
          )}
        </div>
      ) : (
        <RoofEditor
          location={selectedLocation}
          onBack={handleBackToMap}
        />
      )}
    </div>
  );
}
```

# FILE: src\components\Building3dViewer.jsx

```js
// FILE: src/components/Building3dViewer.jsx
import { useMemo, useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { polygonToThreeJSWithCenter } from "../utils/polygonUtils";
import { buildComplexRoofGeometry, buildComplexWallsGeometry, polygonToWorldPoints } from "../utils/buildingUtils";
import { computeSceneScale, metersToWorld, PIXELS_TO_WORLD, PARAPET_HEIGHT_M, PARAPET_THICKNESS_M } from "../utils/scaleUtils";
import { getSunPosition, getSunVector, getSunriseSunset, getSunPathPoints } from "../utils/sunUtils";
import SolarUnit from "./SolarArray";
import RoofObstacle from "./RoofObstacle";
import { doOBBsIntersect, isOBBInsidePolygon, getEntityCorners } from "../utils/collisionUtils";
import { generateFluxHeatmapCanvas } from "../utils/heatmapUtils";

const CANVAS_W = 700, CANVAS_H = 500, GROUND_W = CANVAS_W * PIXELS_TO_WORLD, GROUND_H = CANVAS_H * PIXELS_TO_WORLD;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SUN_DISTANCE_FACTOR = 3.2;
const CAMERA_HEIGHT_FACTOR = 1.35;
const CAMERA_DIST_FACTOR = 2.3;
const MIN_SCENE_RADIUS = 0.6;

function getSolarUnitDimensions(rows, cols, orientation, mpu, tiltAngleDeg = 12) {
  const isLandscape = orientation === 'landscape', rawW = isLandscape ? 1.65 : 1.00, rawH = isLandscape ? 1.00 : 1.65;
  const PW = metersToWorld(rawW, mpu), PH = metersToWorld(rawH, mpu), GAP_X = metersToWorld(0.05, mpu), GAP_Z = metersToWorld(0.30, mpu), TILT = tiltAngleDeg * (Math.PI / 180);
  return { w: cols * PW + (cols - 1) * GAP_X, d: rows * PH * Math.cos(TILT) + (rows - 1) * GAP_Z };
}

function canvasToTexture(c) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = true; t.needsUpdate = true; return t;
}

function useGroundTexture(satImage) {
  const ref = useRef(null); useEffect(() => () => ref.current?.dispose(), []);
  return useMemo(() => {
    if (!satImage) return null; ref.current?.dispose(); const c = document.createElement("canvas"); c.width = CANVAS_W; c.height = CANVAS_H;
    c.getContext("2d").drawImage(satImage, 0, 0, CANVAS_W, CANVAS_H); return (ref.current = canvasToTexture(c));
  }, [satImage]);
}

function useCadRoofTexture(satImage, nodes) {
  const ref = useRef(null); useEffect(() => () => ref.current?.dispose(), []);
  return useMemo(() => {
    if (!satImage || !nodes || nodes.length < 3) return null;
    const xs = nodes.map(p => p.x), ys = nodes.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const bw = Math.max(Math.round(maxX - minX), 1), bh = Math.max(Math.round(maxY - minY), 1);
    const out = document.createElement("canvas"); out.width = Math.min(bw, 1024); out.height = Math.min(bh, 1024);
    const ctx = out.getContext("2d"); const iw = satImage.naturalWidth || CANVAS_W, ih = satImage.naturalHeight || CANVAS_H;
    ctx.drawImage(satImage, minX * (iw / CANVAS_W), minY * (ih / CANVAS_H), bw * (iw / CANVAS_W), bh * (ih / CANVAS_H), 0, 0, out.width, out.height);
    ref.current?.dispose(); return (ref.current = canvasToTexture(out));
  }, [satImage, nodes]);
}

function TreeObstacle({ id, position, dimensions, rotation, mpu, isSelected, onSelect, onDrag, onDrop, orbitRef }) {
  const [isDragging, setIsDragging] = useState(false); const { camera, gl, raycaster } = useThree();
  const w = metersToWorld(dimensions.w, mpu), d = metersToWorld(dimensions.d, mpu), h = metersToWorld(dimensions.h, mpu); const radius = Math.max(w, d) / 2;
  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (e) => {
      const rect = gl.domElement.getBoundingClientRect(); const x = ((e.clientX - rect.left) / rect.width) * 2 - 1, y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const intersect = new THREE.Vector3(); raycaster.ray.intersectPlane(plane, intersect);
      if (intersect) onDrag(id, [intersect.x, 0, intersect.z]);
    };
    const handlePointerUp = () => { setIsDragging(false); if (orbitRef.current) orbitRef.current.enabled = true; onDrop(id, position); };
    window.addEventListener("pointermove", handlePointerMove); window.addEventListener("pointerup", handlePointerUp);
    return () => { window.removeEventListener("pointermove", handlePointerMove); window.removeEventListener("pointerup", handlePointerUp); };
  }, [isDragging, camera, gl, raycaster, id, onDrag, onDrop, position, orbitRef]);

  const handlePointerDown = (e) => { e.stopPropagation(); onSelect(id); setIsDragging(true); if (orbitRef.current) orbitRef.current.enabled = false; };
  return (
    <group position={position} rotation={[0, rotation || 0, 0]} onPointerDown={handlePointerDown}>
      <mesh position={[0, h * 0.2, 0]} castShadow receiveShadow><cylinderGeometry args={[radius * 0.15, radius * 0.2, h * 0.4, 8]} /><meshStandardMaterial color="#5c4033" /></mesh>
      <mesh position={[0, h * 0.6, 0]} castShadow receiveShadow><sphereGeometry args={[radius, 16, 16]} /><meshStandardMaterial color="#22c55e" /></mesh>
      {isSelected && (<mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshBasicMaterial color="#44aaff" wireframe={true} transparent opacity={0.5} /></mesh>)}
    </group>
  );
}

function CADBuildingSection({ section, baseHeightM, satImage, globalCenter, mpu }) {
  const roofTexture = useCadRoofTexture(satImage, section.nodes);
  const wallH = metersToWorld(parseFloat(baseHeightM) + parseFloat(section.baseElevation || 0), mpu);

  const roofGeo = useMemo(() => buildComplexRoofGeometry(section.nodes, section.faces, globalCenter, mpu), [section.nodes, section.faces, globalCenter, mpu]);
  const wallGeo = useMemo(() => buildComplexWallsGeometry(section.nodes, section.faces, globalCenter, parseFloat(baseHeightM) + parseFloat(section.baseElevation || 0), mpu), [section.nodes, section.faces, globalCenter, baseHeightM, section.baseElevation, mpu]);

  const isFlat = useMemo(() => section.nodes.every(n => (parseFloat(n.z) || 0) === 0), [section.nodes]);
  const perimeterEdges = useMemo(() => {
    if (!isFlat) return [];
    const counts = {};
    section.faces.forEach(face => {
      for (let i = 0; i < face.nodeIds.length; i++) {
        const id1 = face.nodeIds[i], id2 = face.nodeIds[(i + 1) % face.nodeIds.length];
        const key = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
        if (!counts[key]) counts[key] = { id1, id2, count: 0 };
        counts[key].count++;
      }
    });
    return Object.values(counts).filter(e => e.count === 1);
  }, [section.faces, isFlat]);

  useEffect(() => () => { roofGeo?.dispose(); wallGeo?.dispose(); }, [roofGeo, wallGeo]);

  if (!roofGeo && !wallGeo) return null;

  const parapetH = metersToWorld(PARAPET_HEIGHT_M, mpu), parapetT = metersToWorld(PARAPET_THICKNESS_M, mpu);
  const worldNodes = {};
  if (isFlat) {
    section.nodes.forEach(n => {
      worldNodes[n.id] = polygonToWorldPoints([{ x: n.x, y: n.y }], globalCenter)[0];
    });
  }

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {wallGeo && <mesh geometry={wallGeo} castShadow receiveShadow userData={{ isWall: true, sectionId: section.id }}><meshStandardMaterial color="#e0e0e0" roughness={0.8} metalness={0.05} side={THREE.DoubleSide} /></mesh>}
      {isFlat && perimeterEdges.map((edge, i) => {
        const p1 = worldNodes[edge.id1], p2 = worldNodes[edge.id2];
        if (!p1 || !p2) return null;
        const dx = p2.x - p1.x, dy = p2.y - p1.y, lenWorld = Math.sqrt(dx * dx + dy * dy), angle = Math.atan2(dy, dx), lenMeters = lenWorld * mpu;
        const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
        return (
          <group key={`para-${i}`}>
            <mesh position={[midX, midY, wallH + parapetH / 2]} rotation={[0, 0, angle]} castShadow><boxGeometry args={[lenWorld, parapetT, parapetH]} /><meshStandardMaterial color="#d0d0d0" roughness={0.7} /></mesh>
            {lenMeters > 0.5 && (<Html position={[midX, midY, wallH + parapetH + 0.2]} center zIndexRange={[100, 0]}><div className="dimension-label">{lenMeters.toFixed(1)}m</div></Html>)}
          </group>
        );
      })}
      {roofGeo && <mesh geometry={roofGeo} position={[0, 0, wallH]} receiveShadow castShadow userData={{ isRoof: true, sectionId: section.id }}><meshStandardMaterial map={roofTexture || undefined} color={roofTexture ? undefined : "#c8c8c8"} roughness={0.75} metalness={0.0} side={THREE.DoubleSide} /></mesh>}
    </group>
  );
}

function SceneSetup({ r, month, hour, lat, lng, showSunSim }) {
  const sunData = useMemo(() => {
    const pos = getSunPosition(month, hour, lat, lng);
    return { vec: getSunVector(pos.elevation, pos.azimuth, r * SUN_DISTANCE_FACTOR), isDay: pos.elevation > 0 };
  }, [month, hour, lat, lng, r]);

  return (
    <>
      <ambientLight intensity={showSunSim ? (sunData.isDay ? 0.35 : 0.08) : 0.75} />
      <hemisphereLight skyColor="#87ceeb" groundColor="#3a5a2a" intensity={showSunSim ? (sunData.isDay ? 0.25 : 0.08) : 0.45} />
      {showSunSim && sunData.isDay && sunData.vec && (
        <directionalLight
          position={sunData.vec}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-near={0.05}
          shadow-camera-far={r * (SUN_DISTANCE_FACTOR + 3)}
          shadow-camera-left={-r * 3}
          shadow-camera-right={r * 3}
          shadow-camera-top={r * 3}
          shadow-camera-bottom={-r * 3}
          shadow-bias={-0.0003}
          shadow-normalBias={0.02}
        />
      )}
    </>
  );
}

function SunSimulation3D({ r, month, hour, lat, lng }) {
  const SUN_DIST = r * SUN_DISTANCE_FACTOR;

  const currentPos = useMemo(() => getSunPosition(month, hour, lat, lng), [month, hour, lat, lng]);
  const isDay = currentPos.elevation > 0;
  const currentVec = useMemo(
    () => (isDay ? getSunVector(currentPos.elevation, currentPos.azimuth, SUN_DIST) : null),
    [currentPos, isDay, SUN_DIST]
  );

  const arcPoints3D = useMemo(() => {
    const raw = getSunPathPoints(month, lat, lng, 120);
    return raw
      .filter(p => p.elevation >= 0)
      .map(p => {
        const v = getSunVector(Math.max(0.001, p.elevation), p.azimuth, SUN_DIST);
        return v ? new THREE.Vector3(v[0], v[1], v[2]) : null;
      })
      .filter(Boolean);
  }, [month, lat, lng, SUN_DIST]);

  const arcLineObj = useMemo(() => {
    if (arcPoints3D.length < 2) return null;
    const geo = new THREE.BufferGeometry().setFromPoints(arcPoints3D);
    const mat = new THREE.LineBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.72 });
    return new THREE.Line(geo, mat);
  }, [arcPoints3D]);
  useEffect(() => () => { arcLineObj?.geometry.dispose(); arcLineObj?.material.dispose(); }, [arcLineObj]);

  const rayLineObj = useMemo(() => {
    if (!currentVec) return null;
    const sunPt = new THREE.Vector3(currentVec[0], currentVec[1], currentVec[2]);
    const groundPt = new THREE.Vector3(currentVec[0], 0, currentVec[2]);
    const geo = new THREE.BufferGeometry().setFromPoints([sunPt, groundPt]);
    const mat = new THREE.LineBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.45 });
    return new THREE.Line(geo, mat);
  }, [currentVec]);
  useEffect(() => () => { rayLineObj?.geometry.dispose(); rayLineObj?.material.dispose(); }, [rayLineObj]);

  const hourLabels = useMemo(() => {
    const { sunrise, sunset } = getSunriseSunset(month, lat, lng);
    const labels = [];
    const startH = Math.ceil(sunrise ?? 5);
    const endH = Math.floor(sunset ?? 19);
    for (let h = startH; h <= endH; h++) {
      const pos = getSunPosition(month, h, lat, lng);
      if (pos.elevation > 0.06) {
        const v = getSunVector(pos.elevation, pos.azimuth, SUN_DIST * 1.08);
        if (v) labels.push({ h, v });
      }
    }
    return labels;
  }, [month, lat, lng, SUN_DIST]);

  if (!isDay || !currentVec) return null;

  return (
    <group>
      {arcLineObj && <primitive object={arcLineObj} />}
      {rayLineObj && <primitive object={rayLineObj} />}
      {hourLabels.map(({ h, v }) => (
        <Html key={h} position={v} center zIndexRange={[0, 5]}>
          <div style={{
            color: "#d4b84a",
            fontSize: "13px",
            fontWeight: "700",
            textShadow: "0 0 4px #000, 0 1px 3px #000",
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
          }}>
            {h}
          </div>
        </Html>
      ))}
      <group position={currentVec}>
        <mesh renderOrder={-1}>
          <sphereGeometry args={[r * 0.30, 20, 20]} />
          <meshBasicMaterial color="#fff8d0" transparent opacity={0.08} depthWrite={false} depthTest={false} side={THREE.FrontSide} />
        </mesh>
        <mesh renderOrder={0}>
          <sphereGeometry args={[r * 0.19, 20, 20]} />
          <meshBasicMaterial color="#ffe97a" transparent opacity={0.22} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh renderOrder={1}>
          <sphereGeometry args={[r * 0.11, 24, 24]} />
          <meshBasicMaterial color="#fff5c0" depthTest={false} />
        </mesh>
        <mesh renderOrder={2}>
          <sphereGeometry args={[r * 0.06, 18, 18]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}

function formatHr(hr) {
  if (hr == null || Number.isNaN(hr)) return "--:--";
  const h = ((hr % 24) + 24) % 24, hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  const ampm = hh >= 12 ? "PM" : "AM", dh = hh % 12 === 0 ? 12 : hh % 12;
  return `${dh}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

function SimulationControlPanel({ month, setMonth, hour, setHour, lat, lng, showSunSim }) {
  const { sunrise, sunset } = useMemo(() => getSunriseSunset(month, lat, lng), [month, lat, lng]);

  const applyPreset = (preset) => {
    if (preset === "winter") { setMonth(12); setHour(13); }
    else if (preset === "summer") { setMonth(6); setHour(13); }
    else if (preset === "equinox") { setMonth(3); setHour(12); }
    else if (preset === "today") {
      const now = new Date();
      setMonth(now.getMonth() + 1);
      setHour(now.getHours() + now.getMinutes() / 60);
    }
  };

  return (
    <div className="solar-control-panel" style={{ background: "rgba(14,14,22,0.96)", border: `1px solid ${showSunSim ? "#fbbf24" : "#333"}`, padding: "12px", borderRadius: "8px", color: "#fff" }}>
      <div style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
        ☀ SUN SIMULATION {showSunSim ? <span style={{ color: "#4ade80", marginLeft: 4 }}>● ON</span> : <span style={{ color: "#666", marginLeft: 4 }}>○ OFF</span>}
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
        {["winter", "summer", "equinox", "today"].map(p => (
          <button key={p} onClick={() => applyPreset(p)}
            style={{ flex: 1, background: "rgba(255,255,255,0.07)", color: "#ccc", border: "1px solid #3a3a3a", borderRadius: "10px", padding: "3px 0", fontSize: "10px", cursor: "pointer", textTransform: "capitalize", lineHeight: 1.6 }}>
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "11px", color: "#aaa" }}>
          Time: <strong style={{ color: "#fbbf24" }}>{formatHr(hour)}</strong>
        </label>
        <input type="range" min="4" max="22" step="0.25" value={hour} onChange={(e) => setHour(parseFloat(e.target.value))} style={{ accentColor: "#fbbf24", width: "100%" }} />

        <label style={{ fontSize: "11px", color: "#aaa" }}>
          Month: <strong style={{ color: "#fff" }}>{MONTH_NAMES[month - 1]}</strong>
        </label>
        <input type="range" min="1" max="12" step="1" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ accentColor: "#fbbf24", width: "100%" }} />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#888", borderTop: "1px solid #2a2a2a", paddingTop: "6px", marginTop: "2px" }}>
          <span>🌅 {formatHr(sunrise)}</span>
          <span style={{ color: "#555" }}>|</span>
          <span>🌇 {formatHr(sunset)}</span>
        </div>
      </div>
    </div>
  );
}

function SunSimToggleButton({ active, onToggle }) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <button
        onClick={onToggle}
        title={active ? "Disable Sun Simulation" : "Enable Sun Simulation"}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: active ? "2px solid #fbbf24" : "2px solid #444",
          background: active
            ? "radial-gradient(circle at 40% 35%, #fff8c0, #fbbf24 60%, #f59e0b)"
            : "rgba(20,20,30,0.90)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          boxShadow: active ? "0 0 16px 4px rgba(251,191,36,0.55)" : "0 2px 8px rgba(0,0,0,0.6)",
          transition: "all 0.2s ease",
        }}
      >
        ☀
      </button>
      <span style={{
        fontSize: 9,
        color: active ? "#fbbf24" : "#666",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        textShadow: "0 1px 3px #000",
      }}>
        {active ? "Sun On" : "Sun Off"}
      </span>
    </div>
  );
}

function EditElementPanel({ selectedEntity, onRotate, onRemove, onDeselect, onUpdateLayout, onUpdateDimensions }) {
  if (!selectedEntity) return null;
  const rotationDeg = Math.round((selectedEntity.rotation || 0) * (180 / Math.PI));
  const isSolar = !selectedEntity.type;
  const isObstacle = !!selectedEntity.type;

  return (
    <div className="solar-control-panel" style={{ background: "rgba(20, 20, 30, 0.95)", border: "1px solid #44aaff", padding: "12px", borderRadius: "8px", color: "#fff", marginTop: "8px" }}>
      <div className="scp-header" style={{ color: "#44aaff", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>✏️ EDIT ELEMENT</div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* SOLAR PANEL LAYOUT CONTROLS */}
        {isSolar && (
          <>
            <label style={{ fontSize: "11px", color: "#aaa" }}>Layout: <strong style={{ color: "#fff" }}>{selectedEntity.rows} x {selectedEntity.cols}</strong></label>
            <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => onUpdateLayout(selectedEntity.id, { rows: Math.max(1, selectedEntity.rows - 1) })} style={{ flex: 1 }}>-</button>
                <span style={{ fontSize: "11px", alignSelf: "center", minWidth: "30px", textAlign: "center" }}>Rows</span>
                <button onClick={() => onUpdateLayout(selectedEntity.id, { rows: selectedEntity.rows + 1 })} style={{ flex: 1 }}>+</button>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => onUpdateLayout(selectedEntity.id, { cols: Math.max(1, selectedEntity.cols - 1) })} style={{ flex: 1 }}>-</button>
                <span style={{ fontSize: "11px", alignSelf: "center", minWidth: "30px", textAlign: "center" }}>Cols</span>
                <button onClick={() => onUpdateLayout(selectedEntity.id, { cols: selectedEntity.cols + 1 })} style={{ flex: 1 }}>+</button>
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                <button onClick={() => onUpdateLayout(selectedEntity.id, { orientation: "portrait" })} style={{ flex: 1, background: selectedEntity.orientation === "portrait" ? "#44aaff" : "#333" }}>Portrait</button>
                <button onClick={() => onUpdateLayout(selectedEntity.id, { orientation: "landscape" })} style={{ flex: 1, background: selectedEntity.orientation === "landscape" ? "#44aaff" : "#333" }}>Landscape</button>
            </div>

            {/* DYNAMIC MOUNTING CONTROLS */}
            <div style={{ borderTop: "1px solid #444", marginTop: "8px", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", color: "#44aaff", fontWeight: "bold" }}>🏗️ MOUNTING STRUCTURE</label>
                
                <select 
                    value={selectedEntity.mountingType || 'tilt_legs'} 
                    onChange={e => onUpdateLayout(selectedEntity.id, { mountingType: e.target.value })}
                    style={{ background: "#222", color: "#fff", border: "1px solid #555", padding: "4px", borderRadius: "4px", fontSize: "11px" }}
                >
                    <option value="flush">Flush Mount (Roof Sloped)</option>
                    <option value="tilt_legs">Fixed Tilt Legs (Elevated)</option>
                </select>

                {(!selectedEntity.mountingType || selectedEntity.mountingType === 'tilt_legs') && (
                    <>
                        <label style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>Structure Profile:</label>
                        <select 
                            value={selectedEntity.structureProfile || 'c_channel'} 
                            onChange={e => onUpdateLayout(selectedEntity.id, { structureProfile: e.target.value })}
                            style={{ background: "#222", color: "#fff", border: "1px solid #555", padding: "4px", borderRadius: "4px", fontSize: "11px" }}
                        >
                            <option value="c_channel">C-Channel (Standard)</option>
                            <option value="box">RHS / Box Section (Heavy)</option>
                        </select>

                        <label style={{ fontSize: "11px", color: "#aaa", display: "flex", justifyContent: "space-between" }}>
                            Front Leg Height: <strong>{selectedEntity.frontLegHeight ?? 1.2}m</strong>
                        </label>
                        <input type="range" min="0.2" max="4.0" step="0.1" value={selectedEntity.frontLegHeight ?? 1.2} onChange={(e) => onUpdateLayout(selectedEntity.id, { frontLegHeight: parseFloat(e.target.value) })} style={{ width: "100%" }} />
                        
                        <label style={{ fontSize: "11px", color: "#aaa", display: "flex", justifyContent: "space-between" }}>
                            Tilt Angle: <strong>{selectedEntity.tiltAngle ?? 12}°</strong>
                        </label>
                        <input type="range" min="0" max="45" step="1" value={selectedEntity.tiltAngle ?? 12} onChange={(e) => onUpdateLayout(selectedEntity.id, { tiltAngle: parseFloat(e.target.value) })} style={{ width: "100%" }} />
                    </>
                )}
            </div>
          </>
        )}

        {/* OBSTACLE CONTROLS */}
        {isObstacle && (
          <>
            <label style={{ fontSize: "11px", color: "#aaa" }}>Dimensions (m):</label>
            <div style={{ display: "flex", gap: "4px" }}>
              <input type="number" step="0.1" value={selectedEntity.dimensions.w} onChange={(e) => onUpdateDimensions(selectedEntity.id, { ...selectedEntity.dimensions, w: parseFloat(e.target.value) || 0.1 })} style={{ width: "33%" }} />
              <input type="number" step="0.1" value={selectedEntity.dimensions.d} onChange={(e) => onUpdateDimensions(selectedEntity.id, { ...selectedEntity.dimensions, d: parseFloat(e.target.value) || 0.1 })} style={{ width: "33%" }} />
              <input type="number" step="0.1" value={selectedEntity.dimensions.h} onChange={(e) => onUpdateDimensions(selectedEntity.id, { ...selectedEntity.dimensions, h: parseFloat(e.target.value) || 0.1 })} style={{ width: "33%" }} />
            </div>
          </>
        )}

        {/* UNIVERSAL ROTATION & ACTIONS */}
        <div style={{ borderTop: "1px solid #444", marginTop: "4px", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "11px", color: "#aaa", display: "flex", justifyContent: "space-between" }}>
                Rotation: <strong>{rotationDeg}°</strong>
            </label>
            <input type="range" min="0" max="360" step="1" value={rotationDeg} onChange={(e) => onRotate(selectedEntity.id, parseInt(e.target.value))} style={{ width: "100%" }} />
            
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={onDeselect} style={{ flex: 1, padding: "6px" }}>✕ Deselect</button>
                <button onClick={() => onRemove(selectedEntity.id)} style={{ flex: 1, padding: "6px", background: "#ef4444", border: "none", color: "white" }}>🗑 Delete</button>
            </div>
        </div>

      </div>
    </div>
  );
}

function GLCapture({ captureRef }) {
  const { gl } = useThree();
  useEffect(() => { captureRef.current = gl; }, [gl]);
  return null;
}

const Building3DViewer = forwardRef(function Building3DViewer(
  { roofSections, buildingHeight, location, satImage, solarUnits, setSolarUnits, obstacles, setObstacles, heatmapCanvas },
  ref
) {
  const [viewMode, setViewMode] = useState("satellite");
  const [simMonth, setSimMonth] = useState(6), [simHour, setSimHour] = useState(12);
  const [activeHeatmap, setActiveHeatmap] = useState(null), [selectedId, setSelectedId] = useState(null);
  const [showSunSim, setShowSunSim] = useState(false);

  const orbitRef = useRef();
  const glRef = useRef(null);
  const lat = location?.lat ?? 28.6, lng = location?.lng ?? 77.2;

  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      try {
        if (!glRef.current) return null;
        return glRef.current.domElement.toDataURL("image/png");
      } catch (e) {
        console.warn("3D snapshot capture failed:", e);
        return null;
      }
    },
  }));

const allNodes = roofSections.flatMap(s => s.nodes || []);
  const { mpu, mpp, groundWidthWorld } = useMemo(() => computeSceneScale(lat), [lat]); // <--- ADD mpp HERE

  const globalCenter = useMemo(() => {
    if (!allNodes.length) return { x: 350, y: 250 };
    const minX = Math.min(...allNodes.map(n => n.x)), maxX = Math.max(...allNodes.map(n => n.x));
    const minY = Math.min(...allNodes.map(n => n.y)), maxY = Math.max(...allNodes.map(n => n.y));
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [allNodes]);

  const wallH = metersToWorld(buildingHeight, mpu), s = groundWidthWorld;

  const buildingFootprintRadius = useMemo(() => {
    if (!allNodes.length) return MIN_SCENE_RADIUS;
    const xs = allNodes.map(n => n.x), ys = allNodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const halfDiagPx = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2) / 2;
    return halfDiagPx * PIXELS_TO_WORLD;
  }, [allNodes]);

  const sceneRadius = useMemo(
    () => Math.max(buildingFootprintRadius * 1.25, wallH * 1.6, MIN_SCENE_RADIUS),
    [buildingFootprintRadius, wallH]
  );

  const sectionWorldData = useMemo(() => roofSections.map(sec => {
    const elevH = metersToWorld(sec.baseElevation || 0, mpu), roofZ = wallH + elevH;
    const multiPolygons = (sec.faces || []).map(face => face.nodeIds.map(id => {
      const n = (sec.nodes || []).find(node => node.id === id);
      if (!n) return null;
      const wPt = polygonToThreeJSWithCenter([{ x: n.x, y: n.y }], globalCenter, PIXELS_TO_WORLD)[0];
      return { x: wPt.x, y: -wPt.y };
    }).filter(Boolean));
    return { id: sec.id, roofZ, multiPolygons };
  }), [roofSections, globalCenter, mpu, wallH]);

// Removed the 2D roof heatmap generation. 
  // We now ONLY color the panels to ensure a clean, professional UI.

  // Accurate Automated Panel Sampling Effect
  useEffect(() => {
    if (!heatmapCanvas || solarUnits.length === 0) return;
    
    // Only sample if a panel moved significantly, or hasn't been sampled yet
    const needsSampling = solarUnits.some(u => 
      !u.fluxColor || 
      !u.lastSampledPos || 
      Math.abs(u.position[0] - u.lastSampledPos[0]) > 0.1 ||
      Math.abs(u.position[2] - u.lastSampledPos[2]) > 0.1
    );

    if (!needsSampling) return;

    import('../utils/heatmapUtils').then(({ samplePanelsFlux }) => {
      // Pass mpp and globalCenter to accurately locate the panels mathematically!
      samplePanelsFlux(heatmapCanvas, solarUnits, mpu, mpp, globalCenter, simMonth - 1).then(sampledUnits => {
        const updated = sampledUnits.map(u => ({...u, lastSampledPos: [...u.position]}));
        setSolarUnits(updated);
      });
    });
  }, [heatmapCanvas, solarUnits, mpu, mpp, globalCenter, simMonth, setSolarUnits]);

  // Always use the clean satellite image for the roof texture
  const activeImage = satImage; 
  const groundTex = useGroundTexture(satImage);

  const validatePlacement = useCallback((id, newPos, newRotation, isObstacle, customDimensions = null, obsType = null) => {
    if (isObstacle && obsType === "tree") return { isValid: true, targetSection: null };
    let movingCorners;
    if (isObstacle) {
      const worldDim = { w: metersToWorld(customDimensions.w, mpu), d: metersToWorld(customDimensions.d, mpu) }; movingCorners = getEntityCorners(newPos, worldDim.w, worldDim.d, newRotation);
    } else {
      const dim = customDimensions || { rows: 3, cols: 4, orientation: "portrait", tiltAngle: 12 }; 
      const { w, d } = getSolarUnitDimensions(dim.rows, dim.cols, dim.orientation, mpu, dim.tiltAngle); 
      movingCorners = getEntityCorners(newPos, w, d, newRotation);
    }
    let targetSection = null; const sortedSectionsHighToLow = [...sectionWorldData].sort((a, b) => b.roofZ - a.roofZ);
    for (const sec of sortedSectionsHighToLow) { if (sec.multiPolygons.some(poly => isOBBInsidePolygon(movingCorners, poly))) { targetSection = sec; break; } }
    let hasOverlap = false;
    for (const unit of solarUnits) {
      if (unit.id === id) continue;
      const { w, d } = getSolarUnitDimensions(unit.rows, unit.cols, unit.orientation, mpu, unit.tiltAngle || 12), otherCorners = getEntityCorners(unit.position, w, d, unit.rotation || 0);
      if (doOBBsIntersect(movingCorners, otherCorners)) { hasOverlap = true; break; }
    }
    if (!hasOverlap) {
      for (const obs of obstacles) {
        if (obs.id === id) continue;
        const obsWorldDim = { w: metersToWorld(obs.dimensions.w, mpu), d: metersToWorld(obs.dimensions.d, mpu) }, otherCorners = getEntityCorners(obs.position, obsWorldDim.w, obsWorldDim.d, obs.rotation || 0);
        if (doOBBsIntersect(movingCorners, otherCorners)) { hasOverlap = true; break; }
      }
    }
    return { isValid: targetSection !== null && !hasOverlap, targetSection };
  }, [sectionWorldData, solarUnits, obstacles, mpu]);

  const handleRemove = useCallback((id) => { setSolarUnits(p => p.filter(u => u.id !== id)); setObstacles(p => p.filter(o => o.id !== id)); setSelectedId(null); }, []);
  const handleSelect = useCallback((id) => { setSelectedId(id); if (orbitRef.current) orbitRef.current.enabled = false; }, []);
  const handleDeselect = useCallback(() => { setSelectedId(null); if (orbitRef.current) orbitRef.current.enabled = true; }, []);

  const handleDrag = useCallback((id, newPos, currentRotation, isObstacle, dimensions) => {
    const type = isObstacle ? obstacles.find(o => o.id === id)?.type : null;
    const { isValid, targetSection } = validatePlacement(id, newPos, currentRotation, isObstacle, dimensions, type);
    const updateFn = prev => prev.map(item => item.id !== id ? item : { ...item, position: newPos, isValid });
    if (isObstacle) setObstacles(updateFn); else setSolarUnits(updateFn);
  }, [validatePlacement, setObstacles, setSolarUnits, obstacles]);

  const handleDrop = useCallback((id, dropPos, currentRotation, isObstacle, dimensions) => {
    const type = isObstacle ? obstacles.find(o => o.id === id)?.type : null;
    const { isValid, targetSection } = validatePlacement(id, dropPos, currentRotation, isObstacle, dimensions, type);
    const updateFn = prev => prev.map(item => {
      if (item.id !== id) return item;
      if (isValid && targetSection) return { ...item, position: dropPos, sectionId: targetSection.id, lastValidPos: dropPos, isValid: true };
      return { ...item, position: item.lastValidPos || item.position, isValid: true };
    });
    if (isObstacle) setObstacles(updateFn); else setSolarUnits(updateFn);
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, [validatePlacement, setObstacles, setSolarUnits, obstacles]);

  const handleRotate = useCallback((id, angleDeg) => {
    const angleRad = angleDeg * (Math.PI / 180), isObs = obstacles.some(o => o.id === id); const item = isObs ? obstacles.find(o => o.id === id) : solarUnits.find(u => u.id === id); if (!item) return;
    const dim = isObs ? item.dimensions : { rows: item.rows, cols: item.cols, orientation: item.orientation, tiltAngle: item.tiltAngle };
    const { isValid } = validatePlacement(id, item.position, angleRad, isObs, dim, isObs ? item.type : null);
    const updateFn = prev => prev.map(i => i.id === id ? { ...i, rotation: angleRad, isValid } : i);
    if (isObs) setObstacles(updateFn); else setSolarUnits(updateFn);
  }, [obstacles, solarUnits, validatePlacement, setObstacles, setSolarUnits]);

  const handleUpdateLayout = useCallback((id, updates) => {
    setSolarUnits(prev => prev.map(unit => {
      if (unit.id !== id) return unit; const newConfig = { ...unit, ...updates }, { isValid } = validatePlacement(id, unit.position, unit.rotation || 0, false, newConfig); return { ...newConfig, isValid };
    }));
  }, [validatePlacement, setSolarUnits]);

  const handleUpdateDimensions = useCallback((id, newDim) => {
    setObstacles(prev => prev.map(obs => {
      if (obs.id !== id) return obs; const { isValid } = validatePlacement(id, obs.position, obs.rotation || 0, true, newDim, obs.type); return { ...obs, dimensions: newDim, isValid };
    }));
  }, [validatePlacement, setObstacles]);

  if (allNodes.length === 0) return <div className="viewer-empty"><p>No roof faces drawn.</p></div>;
  const selectedEntity = [...(solarUnits || []), ...(obstacles || [])].find(e => e.id === selectedId);

  const camDistance = sceneRadius * CAMERA_DIST_FACTOR;
  const camHeight = wallH + sceneRadius * CAMERA_HEIGHT_FACTOR;
  const orbitMinDistance = Math.max(0.01, Math.min(s, sceneRadius) * 0.03);
  const orbitMaxDistance = Math.max(s * 2, sceneRadius * 9);
  const cameraFar = Math.max(s * 20, sceneRadius * 60, 200);

  return (
    <div className="building-viewer">
      <div style={{ position: "absolute", top: 12, left: 68, zIndex: 10, display: "flex", gap: "8px", background: "rgba(15,15,26,0.85)", padding: "6px", borderRadius: "8px", border: "1px solid #333" }} onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => setViewMode("satellite")} style={{ background: viewMode === "satellite" ? "#44aaff" : "transparent", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>🛰 Satellite</button>
        <button onClick={() => setViewMode("heatmap")} disabled={!heatmapCanvas} style={{ background: viewMode === "heatmap" ? "#fbbf24" : "transparent", color: heatmapCanvas ? "#fff" : "#666", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: heatmapCanvas ? "pointer" : "not-allowed", fontSize: "12px" }}>🔥 Solar Heatmap</button>
      </div>

      <SunSimToggleButton active={showSunSim} onToggle={() => setShowSunSim(v => !v)} />

      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 220, display: "flex", flexDirection: "column" }} onPointerDown={(e) => e.stopPropagation()}>
        <SimulationControlPanel month={simMonth} setMonth={setSimMonth} hour={simHour} setHour={setSimHour} lat={lat} lng={lng} showSunSim={showSunSim} />
        <EditElementPanel selectedEntity={selectedEntity} onRotate={handleRotate} onRemove={handleRemove} onDeselect={handleDeselect} onUpdateLayout={handleUpdateLayout} onUpdateDimensions={handleUpdateDimensions} />
      </div>

      <Canvas
        shadows
        frameloop="always"
        camera={{ position: [0, camHeight, camDistance], fov: 50, near: 0.001, far: cameraFar }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={handleDeselect}
      >
        <GLCapture captureRef={glRef} />
        <SceneSetup r={sceneRadius} month={simMonth} hour={simHour} lat={lat} lng={lng} showSunSim={showSunSim} />

        {showSunSim && (
          <SunSimulation3D r={sceneRadius} month={simMonth} hour={simHour} lat={lat} lng={lng} />
        )}

        {roofSections.map((section) => (
          <CADBuildingSection key={section.id} section={section} baseHeightM={buildingHeight} satImage={activeImage} globalCenter={globalCenter} mpu={mpu} />
        ))}

        {solarUnits.map(unit => {
          return (
            <SolarUnit 
              key={unit.id} id={unit.id} position={unit.position} rotation={unit.rotation || 0} mpu={mpu} 
              isSelected={selectedId === unit.id} isValid={unit.isValid} rows={unit.rows} cols={unit.cols} orientation={unit.orientation} 
              mountingType={unit.mountingType} frontLegHeight={unit.frontLegHeight} tiltAngle={unit.tiltAngle} structureProfile={unit.structureProfile}
              viewMode={viewMode} fluxColor={unit.fluxColor} // <--- ADDED PROPS
              onSelect={handleSelect} onDrag={(id, pos) => handleDrag(id, pos, unit.rotation || 0, false, { rows: unit.rows, cols: unit.cols, orientation: unit.orientation })} onDrop={(id, pos) => handleDrop(id, pos, unit.rotation || 0, false, { rows: unit.rows, cols: unit.cols, orientation: unit.orientation })} 
            />
          );
        })}

        {obstacles.map(obs => {
          const isTree = obs.type === "tree";
          if (isTree) return <TreeObstacle key={obs.id} id={obs.id} dimensions={obs.dimensions} position={[obs.position[0], 0, obs.position[2]]} rotation={obs.rotation || 0} mpu={mpu} isSelected={selectedId === obs.id} onSelect={handleSelect} onDrag={(id, pos) => handleDrag(id, pos, obs.rotation || 0, true, obs.dimensions)} onDrop={(id, pos) => handleDrop(id, pos, obs.rotation || 0, true, obs.dimensions)} orbitRef={orbitRef} />;
          return <RoofObstacle key={obs.id} id={obs.id} type={obs.type} dimensions={obs.dimensions} position={obs.position} rotation={obs.rotation || 0} mpu={mpu} isSelected={selectedId === obs.id} isValid={obs.isValid} onSelect={handleSelect} onDrag={(id, pos) => handleDrag(id, pos, obs.rotation || 0, true, obs.dimensions)} onDrop={(id, pos) => handleDrop(id, pos, obs.rotation || 0, true, obs.dimensions)} />;
        })}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
          <planeGeometry args={[GROUND_W, GROUND_H]} />
          {groundTex ? <meshStandardMaterial map={groundTex} roughness={1} metalness={0} /> : <meshStandardMaterial color="#3a5a2a" roughness={1} />}
        </mesh>

        <OrbitControls ref={orbitRef} enablePan enableZoom enableRotate minDistance={orbitMinDistance} maxDistance={orbitMaxDistance} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} target={[0, wallH / 2, 0]} />
      </Canvas>
    </div>
  );
});

export default Building3DViewer;
```

# FILE: src\components\MapView.jsx

```js
import { useRef } from "react";
import useGoogleMaps from "../hooks/useGoogleMaps";

export default function MapView({ onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const { isLoaded, error } = useGoogleMaps({
    mapContainerRef,
    searchInputRef,
    onLocationSelect,
  });

  return (
    <div className="map-view">
      <div className="search-bar-container">
        <div className="search-icon">🔍</div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a property or address..."
          className="search-input"
        />
        {!isLoaded && !error && (
          <div className="search-loading">Loading...</div>
        )}
      </div>

      {error && (
        <div className="map-error-banner">
          ⚠️ {error}
        </div>
      )}

      <div ref={mapContainerRef} className="map-container" style={{ width: "100%", height: "calc(100vh - 56px)", minHeight: "400px" }} />

      <div className="map-instructions">
        <span>🖱️ Double-click on a rooftop to place a marker</span>
        <span className="separator">|</span>
        <span>🔍 Or search for an address above</span>
      </div>
    </div>
  );
}
```

# FILE: src\components\ReportModal.jsx

```js
// FILE: src/components/ReportModal.jsx
import React, { useMemo, useState } from "react";
import { estimateSolarOutput } from "../services/solarService";
import ReportRoofLayout from "./ReportRoofLayout";
import SingleLineDiagram from "./SingleLineDiagram";
import {
  DEFAULT_PANEL_WATTS,
  DEFAULT_SYSTEM_EFFICIENCY,
  DEFAULT_COST_PER_WATT,
  DEFAULT_ELECTRICITY_RATE,
  DEFAULT_INCENTIVE_PCT,
  computeSystemMetrics,
  computeFinancials,
  estimateMonthlyProduction,
  computeEnvironmentalEquivalents,
  computeDerateBreakdown,
  computeElectricalDesign,
  summarizeRoofSegments,
  summarizeObstacles,
  formatNumber,
  formatCurrency,
} from "../utils/reportUtils";

function Section({ title, icon, children, style }) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 10,
        border: "1px solid #e3e5ea",
        padding: "20px 22px",
        breakInside: "avoid",
        pageBreakInside: "avoid",
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            margin: "0 0 14px 0",
            fontSize: 14,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#0f172a",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "2px solid #fbbf24",
            paddingBottom: 10,
          }}
        >
          {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "#f8f9fb",
        border: "1px solid #e3e5ea",
        borderRadius: 8,
        padding: "14px 16px",
        flex: "1 1 150px",
      }}
    >
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || "#0f172a", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px dashed #e8e9ed" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <strong style={{ color: strong || "#111827" }}>{value}</strong>
    </div>
  );
}

function AssumptionInput({ label, value, onChange, suffix, step = "1" }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
      {label}
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #d6d9e0", borderRadius: 6, padding: "4px 8px" }}>
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{ width: "100%", border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: "#111827" }}
        />
        {suffix && <span style={{ fontSize: 11, color: "#9ca3af" }}>{suffix}</span>}
      </div>
    </label>
  );
}

function MonthlyProductionChart({ monthly }) {
  const max = Math.max(...monthly.map((m) => m.kwh), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "4px 2px 0" }}>
      {monthly.map((m) => {
        const h = Math.max((m.kwh / max) * 110, 3);
        return (
          <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 9, color: "#6b7280" }}>{formatNumber(m.kwh)}</div>
            <div
              title={`${m.month}: ${formatNumber(m.kwh)} kWh`}
              style={{
                width: "100%",
                height: h,
                background: "linear-gradient(180deg, #fbbf24, #f59e0b)",
                borderRadius: "3px 3px 0 0",
              }}
            />
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{m.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function DerateRow({ label, factor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderBottom: "1px dashed #e8e9ed" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <strong style={{ color: "#111827" }}>{Math.round(factor * 100)}%</strong>
    </div>
  );
}

export default function ReportModal({
  onClose,
  location,
  solarData,
  solarUnits,
  obstacles,
  buildingHeight,
  roofSections = [],
  globalCenter,
  mpp,
  satImageUrl,
  // 3D snapshot of the panel layout, captured from Building3DViewer just
  // before the report is opened. Optional — degrades gracefully if absent.
  structureSnapshot,
}) {
  const [panelWatts, setPanelWatts] = useState(DEFAULT_PANEL_WATTS);
  const [efficiency, setEfficiency] = useState(DEFAULT_SYSTEM_EFFICIENCY);
  const [costPerWatt, setCostPerWatt] = useState(DEFAULT_COST_PER_WATT);
  const [electricityRate, setElectricityRate] = useState(DEFAULT_ELECTRICITY_RATE);
  const [incentivePct, setIncentivePct] = useState(DEFAULT_INCENTIVE_PCT);

  const safeSolarUnits = solarUnits || [];
  const safeObstacles = obstacles || [];

  void estimateSolarOutput;

  const metrics = useMemo(
    () => computeSystemMetrics({ solarUnits: safeSolarUnits, solarData, panelWatts, efficiency }),
    [safeSolarUnits, solarData, panelWatts, efficiency]
  );

  const financials = useMemo(
    () =>
      computeFinancials({
        annualKwh: metrics.annualKwh,
        totalCapacityKw: metrics.totalCapacityKw,
        electricityRate,
        costPerWatt,
        incentivePct,
      }),
    [metrics.annualKwh, metrics.totalCapacityKw, electricityRate, costPerWatt, incentivePct]
  );

  const monthly = useMemo(() => estimateMonthlyProduction(metrics.annualKwh, location?.lat ?? 20), [metrics.annualKwh, location?.lat]);
  const envEquivalents = useMemo(() => computeEnvironmentalEquivalents(metrics.carbonOffsetKg), [metrics.carbonOffsetKg]);
  const roofSegmentRows = useMemo(() => summarizeRoofSegments(solarData), [solarData]);
  const obstacleRows = useMemo(() => summarizeObstacles(safeObstacles), [safeObstacles]);
  const derateBreakdown = useMemo(() => computeDerateBreakdown({ obstacles: safeObstacles, totalPanels: metrics.totalPanels }), [safeObstacles, metrics.totalPanels]);
  const electricalDesign = useMemo(
    () => computeElectricalDesign({ totalPanels: metrics.totalPanels, totalCapacityKw: metrics.totalCapacityKw, panelWatts }),
    [metrics.totalPanels, metrics.totalCapacityKw, panelWatts]
  );

  const hasLayoutData = roofSections.some((s) => (s.faces || []).length > 0) && globalCenter && mpp;

  const handlePrint = () => window.print();
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      className="report-modal-overlay"
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-modal-overlay, .report-modal-overlay * { visibility: visible; }
          .report-modal-overlay { position: absolute; inset: 0; background: #fff !important; backdrop-filter: none !important; padding: 0 !important; }
          .report-modal-shell { max-height: none !important; box-shadow: none !important; border: none !important; max-width: none !important; width: 100% !important; }
          .report-no-print { display: none !important; }
          .report-section-break { page-break-after: always; }
        }
      `}</style>

      <div
        className="report-modal-shell"
        style={{
          background: "#eef0f4",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: "12px",
          border: "1px solid var(--accent)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="report-no-print"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#1e1e2d",
            borderRadius: "12px 12px 0 0",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "var(--accent)", fontSize: "20px" }}>📑 Solar Project Proposal</h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#aaa" }}>{location?.address || "Custom Location"}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handlePrint} style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              🖨️ Print / Save PDF
            </button>
            <button onClick={onClose} style={{ background: "transparent", color: "#fff", border: "1px solid #555", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Cover block */}
          <Section style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Solar Design &amp; Production Report</div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 24, marginTop: 6 }}>{location?.address || "Custom Project Site"}</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                  {location?.lat?.toFixed(5)}, {location?.lng?.toFixed(5)} · Generated {today}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.4)",
                  borderRadius: 8,
                  padding: "10px 16px",
                  textAlign: "right",
                }}
              >
                <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>System Size</div>
                <div style={{ color: "#fff", fontSize: 26, fontWeight: 800 }}>{metrics.totalCapacityKw} kW</div>
              </div>
            </div>
          </Section>

          {/* Key metrics */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <StatCard label="System Size" value={`${metrics.totalCapacityKw} kW`} sub={`${metrics.totalPanels} panels × ${panelWatts}W`} />
            <StatCard label="Annual Production" value={`${formatNumber(metrics.annualKwh)} kWh`} sub={`${metrics.sunHours} weighted sun-hrs/yr`} accent="#16a34a" />
            <StatCard label="Annual Savings" value={formatCurrency(financials.annualSavingsUsd)} sub={`≈ ${formatCurrency(financials.monthlySavingsUsd)}/mo`} accent="#d97706" />
            <StatCard label="Payback Period" value={financials.paybackYears ? `${financials.paybackYears} yrs` : "—"} sub={`${financials.lifetimeYears}-yr system life`} accent="#2563eb" />
          </div>

          {/* 3D Structure & Panel Placement */}
          <Section title="3D Structure &amp; Panel Placement" icon="🏗️">
            {structureSnapshot ? (
              <div>
                <img
                  src={structureSnapshot}
                  alt="3D structure with placed solar panels"
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, border: "1px solid #e3e5ea", background: "#0c0c14" }}
                />
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                  Snapshot of the 3D model showing the building and final placement of {metrics.totalPanels} panels, captured directly from the 3D viewer.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280", padding: "20px 0", textAlign: "center" }}>
                Open the 3D Structure Viewer once (and orbit to a clear angle) before generating the report to include a snapshot of the panel placement here.
              </div>
            )}
          </Section>

          {/* 2D Roof & Panel Layout */}
          <Section title="Roof &amp; Panel Layout (Plan View)" icon="🗺️">
            {hasLayoutData ? (
              <ReportRoofLayout
                roofSections={roofSections}
                solarUnits={safeSolarUnits}
                obstacles={safeObstacles}
                globalCenter={globalCenter}
                mpp={mpp}
                satImageUrl={satImageUrl}
              />
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280", padding: "20px 0", textAlign: "center" }}>
                Trace at least one roof face in the editor to generate the layout drawing.
              </div>
            )}
          </Section>

          {/* Electrical Single-Line Diagram */}
          <Section title="Electrical Single-Line Diagram (SLD)" icon="⚡">
            <SingleLineDiagram metrics={metrics} design={electricalDesign} />
          </Section>

          {/* Roof Segment Analysis (from Google Solar API) */}
          {roofSegmentRows.length > 0 && (
            <Section title="Roof Segment Analysis" icon="📐">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280", textTransform: "uppercase", fontSize: 10.5, letterSpacing: "0.03em" }}>
                      <th style={{ padding: "6px 8px" }}>Segment</th>
                      <th style={{ padding: "6px 8px" }}>Pitch</th>
                      <th style={{ padding: "6px 8px" }}>Orientation</th>
                      <th style={{ padding: "6px 8px" }}>Area</th>
                      <th style={{ padding: "6px 8px" }}>Sun Exposure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roofSegmentRows.map((seg) => (
                      <tr key={seg.id} style={{ borderTop: "1px solid #eef0f4" }}>
                        <td style={{ padding: "8px" }}>Segment {seg.id}</td>
                        <td style={{ padding: "8px" }}>{seg.pitchDegrees}°</td>
                        <td style={{ padding: "8px" }}>
                          {seg.azimuthLabel} ({seg.azimuthDegrees}°)
                        </td>
                        <td style={{ padding: "8px" }}>{formatNumber(seg.areaM2)} m²</td>
                        <td style={{ padding: "8px" }}>{formatNumber(seg.sunshineHoursPerYear)} hrs/yr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Equipment + Site specifications */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Section title="System Specifications" icon="⚙️" style={{ flex: "1 1 320px" }}>
              <Row label="Total Panels Placed" value={metrics.totalPanels} />
              <Row label="Panel Wattage (assumed)" value={`${panelWatts} W`} />
              <Row label="System Efficiency (derate)" value={`${Math.round(efficiency * 100)}%`} />
              <Row label="Obstacles / Keep-outs Mapped" value={safeObstacles.length} />
              <Row label="Building Base Height" value={`${buildingHeight} m`} />
              <Row label="Roof Sections / Buildings" value={Math.max(roofSections.length, 1)} />
            </Section>

            <Section title="Environmental Impact &amp; Site" icon="🌎" style={{ flex: "1 1 320px" }}>
              <Row label="Carbon Offset (Annual)" value={`${formatNumber(metrics.carbonOffsetKg)} kg CO₂`} strong="#16a34a" />
              <Row label="≈ Equivalent to Trees Planted" value={`${formatNumber(envEquivalents.treesPlanted)} trees/yr`} />
              <Row label="≈ Equivalent to Driving Avoided" value={`${formatNumber(envEquivalents.kmNotDriven)} km/yr`} />
              <Row label="Max Site Sunshine" value={`${Math.round(solarData?.maxSunshineHoursPerYear || 0)} hrs/yr`} />
              <Row label="Max Physical Capacity (API)" value={`${solarData?.maxArrayPanelsCount || 0} panels`} />
              <Row label="Coordinates" value={`${location?.lat?.toFixed(4)}, ${location?.lng?.toFixed(4)}`} />
            </Section>
          </div>

          {/* Obstacles breakdown */}
          {obstacleRows.length > 0 && (
            <Section title="Roof Obstructions Mapped" icon="🚧">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {obstacleRows.map((o) => (
                  <div key={o.type} style={{ background: "#f8f9fb", border: "1px solid #e3e5ea", borderRadius: 8, padding: "10px 16px", minWidth: 110 }}>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{o.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{o.count}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Production estimate — itemized derate breakdown for transparency/accuracy */}
          <Section title="Production Estimate — Derate Assumptions" icon="🔍">
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <DerateRow label="Inverter Efficiency" factor={derateBreakdown.inverterEff} />
                <DerateRow label="Wiring / Conductor Losses" factor={derateBreakdown.wiringLoss} />
                <DerateRow label="Soiling / Dirt Losses" factor={derateBreakdown.soilingLoss} />
                <DerateRow label="Module Mismatch" factor={derateBreakdown.mismatchLoss} />
                <DerateRow label="Cell Temperature (annualized)" factor={derateBreakdown.tempDerate} />
                <DerateRow label="Shading (from mapped obstacles)" factor={derateBreakdown.shadingLoss} />
              </div>
              <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f8f9fb", border: "1px solid #e3e5ea", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", fontWeight: 700 }}>Modeled Combined Derate</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>{Math.round(derateBreakdown.combined * 100)}%</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>
                  Editable "System Efficiency" below currently set to {Math.round(efficiency * 100)}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
              Annual production also uses an area-weighted average of the roof's sunshine hours across all mapped segments (not just the single best-facing segment), so mixed-orientation roofs aren't overstated.
            </div>
          </Section>

          {/* Monthly production estimate */}
          <Section title="Estimated Monthly Production" icon="📈">
            <MonthlyProductionChart monthly={monthly} />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
              Modeled distribution of the annual production estimate across the year based on seasonal sun angle for this latitude. Actual monthly output varies with weather, shading, and panel degradation.
            </div>
          </Section>

          {/* Financial analysis with editable assumptions */}
          <Section title="Financial Analysis" icon="💰">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, padding: "12px", background: "#f8f9fb", borderRadius: 8, border: "1px solid #e3e5ea" }}>
              <AssumptionInput label="Panel Wattage" value={panelWatts} onChange={setPanelWatts} suffix="W" step="10" />
              <AssumptionInput label="System Efficiency" value={Math.round(efficiency * 100)} onChange={(v) => setEfficiency(v / 100)} suffix="%" step="1" />
              <AssumptionInput label="Cost per Watt" value={costPerWatt} onChange={setCostPerWatt} suffix="$/W" step="0.01" />
              <AssumptionInput label="Electricity Rate" value={electricityRate} onChange={setElectricityRate} suffix="$/kWh" step="0.01" />
              <AssumptionInput label="Incentive" value={incentivePct} onChange={setIncentivePct} suffix="%" step="1" />
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px" }}>
                <Row label="Gross System Cost" value={formatCurrency(financials.grossSystemCostUsd)} />
                <Row label="Incentive / Rebate" value={`− ${formatCurrency(financials.incentiveUsd)}`} strong="#16a34a" />
                <Row label="Net System Cost" value={formatCurrency(financials.netSystemCostUsd)} strong="#0f172a" />
              </div>
              <div style={{ flex: "1 1 280px" }}>
                <Row label="Estimated Annual Savings" value={formatCurrency(financials.annualSavingsUsd)} />
                <Row label="Estimated Payback Period" value={financials.paybackYears ? `${financials.paybackYears} years` : "—"} />
                <Row label={`${financials.lifetimeYears}-Year Net Savings`} value={formatCurrency(financials.lifetimeSavingsUsd)} strong="#16a34a" />
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
              Lifetime savings assume a flat electricity rate with no annual escalation and no panel degradation, for simplicity. Actual savings are typically higher due to utility rate inflation.
            </div>
          </Section>

          {/* Disclaimer */}
          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              padding: "16px",
              borderRadius: "8px",
              color: "#1d4ed8",
              fontSize: "12.5px",
            }}
          >
            <strong>Note:</strong> This is an auto-generated preliminary report based on satellite tracing, manual roof drawing, and Google Solar API parameters. The single-line diagram uses generic panel/inverter electrical characteristics for sizing until real equipment is selected. Financial figures are estimates based on the assumptions above. A final physical site survey and a licensed electrical design are required before installation.
          </div>
        </div>
      </div>
    </div>
  );
}
```

# FILE: src\components\ReportroofLayout.jsx

```js
// FILE: src/components/ReportRoofLayout.jsx
import { worldToCanvasPoint, getPanelPixelSize, getObstaclePixelSize } from "../utils/reportUtils";

const CANVAS_W = 700;
const CANVAS_H = 500;

const OBSTACLE_STYLE = {
  ac_unit: { fill: "#d4d4d4", stroke: "#555555", round: false },
  water_tank: { fill: "#1a1a1a", stroke: "#000000", round: true },
  tree: { fill: "rgba(34,197,94,0.55)", stroke: "#15803d", round: true },
};

function LegendItem({ color, border, label, round, dashed }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 14, height: 14, background: color,
          border: `1.5px ${dashed ? "dashed" : "solid"} ${border}`,
          borderRadius: round ? "50%" : 3, display: "inline-block", flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export default function ReportRoofLayout({
  roofSections = [], solarUnits = [], obstacles = [], globalCenter, mpp, satImageUrl, scaleMetersBar = 5,
}) {
  const safeMpp = mpp || 0.15;
  const scaleBarPx = scaleMetersBar / safeMpp;
  const totalPanelCount = solarUnits.reduce((acc, u) => acc + (u.rows || 0) * (u.cols || 0), 0);

  return (
    <div>
      <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, background: "#0c0c14", border: "1px solid #e3e5ea" }}>
        
        {/* Define Gradient for Legend */}
        <defs>
          <linearGradient id="flux-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#30123b" />
            <stop offset="25%" stopColor="#4686fb" />
            <stop offset="50%" stopColor="#1be5b5" />
            <stop offset="75%" stopColor="#fb9b06" />
            <stop offset="100%" stopColor="#e31a1c" />
          </linearGradient>
        </defs>

        {satImageUrl && (
          <image href={satImageUrl} x={0} y={0} width={CANVAS_W} height={CANVAS_H} opacity={0.65} preserveAspectRatio="xMidYMid slice" />
        )}
        <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="rgba(0,0,0,0.4)" />

        {/* Roof Outlines */}
        {roofSections.map((section) =>
          (section.faces || []).map((face) => {
            const pts = face.nodeIds.map((id) => (section.nodes || []).find((n) => n.id === id)).filter(Boolean);
            if (pts.length < 3) return null;
            const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(" ");
            return (
              <polygon key={`${section.id}-${face.id}`} points={pointsStr} fill="rgba(255,255,255,0.05)" stroke="#ffffff" strokeWidth={1.5} strokeDasharray="4 4" />
            );
          })
        )}

        {/* Panel Arrays - Colored by Thermal Flux! */}
        {solarUnits.map((unit) => {
          const c = worldToCanvasPoint(unit.position, globalCenter);
          const { wPx, hPx } = getPanelPixelSize(unit, safeMpp);
          const deg = (unit.rotation || 0) * (180 / Math.PI);
          const cols = unit.cols || 1, rows = unit.rows || 1;
          
          // Use the API derived color, fallback to default blue
          const fillColor = unit.fluxColor || "#0f1f3a";

          return (
            <g key={unit.id} transform={`translate(${c.x} ${c.y}) rotate(${deg})`}>
              <rect x={-wPx / 2} y={-hPx / 2} width={wPx} height={hPx} fill={fillColor} stroke="#ffffff" strokeWidth={1} />
              {Array.from({ length: Math.max(cols - 1, 0) }).map((_, i) => {
                const cx = -wPx / 2 + ((i + 1) * wPx) / cols;
                return <line key={`c${i}`} x1={cx} y1={-hPx / 2} x2={cx} y2={hPx / 2} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />;
              })}
              {Array.from({ length: Math.max(rows - 1, 0) }).map((_, i) => {
                const cy = -hPx / 2 + ((i + 1) * hPx) / rows;
                return <line key={`r${i}`} x1={-wPx / 2} y1={cy} x2={wPx / 2} y2={cy} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />;
              })}
            </g>
          );
        })}

        {/* Obstacles */}
        {obstacles.map((o) => {
          const c = worldToCanvasPoint(o.position, globalCenter);
          const { wPx, hPx } = getObstaclePixelSize(o, safeMpp);
          const style = OBSTACLE_STYLE[o.type] || OBSTACLE_STYLE.ac_unit;
          const deg = (o.rotation || 0) * (180 / Math.PI);

          if (style.round) {
            return (
              <g key={o.id} transform={`translate(${c.x} ${c.y})`}>
                <circle r={Math.min(wPx, hPx) / 2} fill={style.fill} stroke={style.stroke} strokeWidth={1.5} />
              </g>
            );
          }
          return (
            <g key={o.id} transform={`translate(${c.x} ${c.y}) rotate(${deg})`}>
              <rect x={-wPx / 2} y={-hPx / 2} width={wPx} height={hPx} fill={style.fill} stroke={style.stroke} strokeWidth={1.5} />
            </g>
          );
        })}

        {/* North Arrow */}
        <g transform="translate(28 32)">
          <line x1={0} y1={16} x2={0} y2={-16} stroke="#ffffff" strokeWidth={2} />
          <polygon points="0,-22 -7,-10 7,-10" fill="#ffffff" />
          <text x={0} y={32} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight="bold">N</text>
        </g>
      </svg>

      {/* Enhanced Legend with Thermal Gradient */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "10px 2px 0", fontSize: 12, color: "#444" }}>
        
        {/* Color Ramp for Panel Yield */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "150px" }}>
            <span style={{ fontSize: "10px", fontWeight: "bold" }}>Panel Solar Yield</span>
            <div style={{ width: "100%", height: "8px", background: "linear-gradient(to right, #30123b, #4686fb, #1be5b5, #fb9b06, #e31a1c)", borderRadius: "4px" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#888" }}>
                <span>Shaded</span>
                <span>Optimal</span>
            </div>
        </div>

        <LegendItem color="#d4d4d4" border="#555555" label="AC Unit / Obstacle" />
        <LegendItem color="#1a1a1a" border="#000000" label="Water Tank" round />
        <LegendItem color="rgba(34,197,94,0.55)" border="#15803d" label="Tree" round />
      </div>
    </div>
  );
}
```

# FILE: src\components\RoofEditor.jsx

```js
// FILE: src/components/RoofEditor.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import RoofPolygonDrawer from "./RoofPolygonDrawer";
import Building3DViewer from "./Building3DViewer";
import Toolbar from "./Toolbar";
import ReportModal from "./ReportModal";
import { fetchRoofAndSolarData, fetchSolarDataLayers } from "../services/solarService";
import { computeGlobalCenter } from "../utils/polygonUtils";
import { computeSceneScale, metersToWorld } from "../utils/scaleUtils";

const STEPS = { LOADING: "loading", DRAW: "draw", VIEW3D: "view3d" };
const DEFAULT_HEIGHT = 6;
const MAX_HISTORY = 50; // cap undo stack depth per section

const DEFAULT_SECTION = (id, label = "Main Building") => ({
  id, label,
  baseElevation: 0,
  nodes: [],
  faces: []
});

export default function RoofEditor({ location, onBack }) {
  const [step, setStep] = useState(STEPS.LOADING);
  const [roofSections, setRoofSections] = useState([DEFAULT_SECTION(1)]);
  const [activeSectionId, setActiveSectionId] = useState(1);
  const [buildingHeight, setBuildingHeight] = useState(DEFAULT_HEIGHT);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [solarData, setSolarData] = useState(null);
  const [error, setError] = useState(null);
  const [isManualDraw, setIsManualDraw] = useState(false);
  const [nextSectionId, setNextSectionId] = useState(2);
  const satImageRef = useRef(null);
  const viewerRef = useRef(null); // Building3DViewer imperative handle (for capturing report snapshots)

  const [solarUnits, setSolarUnits] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [heatmapCanvas, setHeatmapCanvas] = useState(null);

  const [showReport, setShowReport] = useState(false);
  const [structureSnapshot, setStructureSnapshot] = useState(null);

  // NEW: undo history for roof polygon (nodes/faces) edits, kept per section id
  const [history, setHistory] = useState({}); // { [sectionId]: [{nodes, faces}, ...] }

  const { mpu, mpp } = useMemo(() => computeSceneScale(location?.lat ?? 28.6), [location?.lat]);

  const globalCenter = useMemo(() => {
    const allNodes = roofSections.flatMap(s => s.nodes || []);
    if (!allNodes.length) return { x: 350, y: 250 };
    const minX = Math.min(...allNodes.map(n => n.x)), maxX = Math.max(...allNodes.map(n => n.x));
    const minY = Math.min(...allNodes.map(n => n.y)), maxY = Math.max(...allNodes.map(n => n.y));
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [roofSections]);

  const activeSection = roofSections.find(s => s.id === activeSectionId);
  const activeRoofZ = metersToWorld(buildingHeight + (activeSection?.baseElevation || 0), mpu);
  const selectedNode = activeSection?.nodes?.find(n => n.id === selectedNodeId);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    (async () => {
      setStep(STEPS.LOADING); setError(null); setSolarData(null);
      const [solarResult, dataLayersResult] = await Promise.allSettled([ fetchRoofAndSolarData(location.lat, location.lng), fetchSolarDataLayers(location.lat, location.lng) ]);
      if (cancelled) return;

      if (solarResult.status === "fulfilled" && solarResult.value.polygon?.length >= 3) {
        setSolarData(solarResult.value.solarData);
        const nodes = solarResult.value.polygon.map((p, i) => ({ id: `n${i}`, x: p.x, y: p.y, z: 0 }));
        const face = { id: 'f1', nodeIds: nodes.map(n => n.id) };
        setRoofSections([{ ...DEFAULT_SECTION(1), nodes, faces: [face] }]);
        setIsManualDraw(false);
      } else {
        setIsManualDraw(true);
      }

      if (dataLayersResult.status === "fulfilled" && dataLayersResult.value?.monthlyFluxBuffer) setHeatmapCanvas(dataLayersResult.value.monthlyFluxBuffer);
      if (!cancelled) setStep(STEPS.DRAW);
    })();
    return () => { cancelled = true; };
  }, [location]);

  const updateActiveSection = (patch) => setRoofSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, ...patch } : s));

  // NEW: snapshot the active section's nodes/faces onto its undo stack, before a mutation is applied
  const pushHistory = () => {
    setHistory(prev => {
      const stack = prev[activeSectionId] || [];
      const snapshot = { nodes: activeSection?.nodes || [], faces: activeSection?.faces || [] };
      return { ...prev, [activeSectionId]: [...stack, snapshot].slice(-MAX_HISTORY) };
    });
  };

  const handleMeshChange = (nodes, faces) => { pushHistory(); updateActiveSection({ nodes, faces }); };

  const handleClearSection = () => {
    pushHistory();
    updateActiveSection({ nodes: [], faces: [] }); setSelectedNodeId(null); setIsManualDraw(true);
    setSolarUnits(prev => prev.filter(u => u.sectionId !== activeSectionId));
    setObstacles(prev => prev.filter(o => o.sectionId !== activeSectionId));
  };

  // NEW: pop the last snapshot for the active section and restore it
  const handleUndo = () => {
    const stack = history[activeSectionId] || [];
    if (stack.length === 0) return;
    const last = stack[stack.length - 1];
    updateActiveSection({ nodes: last.nodes, faces: last.faces });
    setHistory(prev => ({ ...prev, [activeSectionId]: stack.slice(0, -1) }));
    setSelectedNodeId(null);
  };

  // NEW: delete the currently-selected point, stripping it out of any face
  // (and dropping faces that fall below 3 points as a result)
  const handleDeletePoint = () => {
    if (!selectedNodeId || !activeSection) return;
    pushHistory();
    const updatedNodes = (activeSection.nodes || []).filter(n => n.id !== selectedNodeId);
    const updatedFaces = (activeSection.faces || [])
      .map(f => ({ ...f, nodeIds: f.nodeIds.filter(id => id !== selectedNodeId) }))
      .filter(f => f.nodeIds.length >= 3);
    updateActiveSection({ nodes: updatedNodes, faces: updatedFaces });
    setSelectedNodeId(null);
  };

  const canUndo = (history[activeSectionId] || []).length > 0;

  const handleNodeElevationChange = (val) => {
    const newZ = parseFloat(val);
    if (isNaN(newZ) || !selectedNodeId) return;
    pushHistory();
    const updatedNodes = (activeSection.nodes || []).map(n => n.id === selectedNodeId ? { ...n, z: newZ } : n);
    updateActiveSection({ nodes: updatedNodes });
  };

  const handleView3D = () => {
    if (!roofSections.some(s => s.faces?.length > 0)) return setError("Complete at least one roof face.");
    setError(null); setStep(STEPS.VIEW3D);
  };

  // Grabs a PNG snapshot of the current 3D view (if the 3D viewer has been
  // mounted at least once) right before opening the report, so the report's
  // "3D Structure & Panel Placement" section shows the actual panel layout.
  const handleGenerateReport = () => {
    const snap = viewerRef.current?.captureSnapshot?.();
    if (snap) setStructureSnapshot(snap);
    setShowReport(true);
  };

  return (
    <div className="roof-editor">
      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          location={location}
          solarData={solarData}
          solarUnits={solarUnits}
          obstacles={obstacles}
          buildingHeight={buildingHeight}
          roofSections={roofSections}
          globalCenter={globalCenter}
          mpp={mpp}
          mpu={mpu}
          satImageUrl={satImageRef.current?.src}
          structureSnapshot={structureSnapshot}
        />
      )}

      <div className="roof-editor-header">
        <button className="back-btn" onClick={onBack}>← Back to Map</button>
        <div className="header-info">
          <h2 className="editor-title">{step === STEPS.LOADING ? "Fetching Data..." : step === STEPS.DRAW ? "Roof Mesh Editor" : "3D Building Viewer"}</h2>
          {location?.address && <span className="editor-address">{location.address}</span>}
        </div>
      </div>

      {error && <div className="editor-error-banner">⚠️ {error} <button onClick={() => setError(null)}>✕</button></div>}
      {step === STEPS.LOADING && <div className="loading-screen"><div className="spinner" /><p>Fetching data...</p></div>}

      {step === STEPS.DRAW && (
        <div className="draw-screen">
          <div className="draw-layout">
            <div className="sections-panel">
              <div className="sections-panel-header">
                <span className="sections-title">🏗 Buildings</span>
                <button className="add-section-btn" onClick={() => {
                  const id = nextSectionId; setRoofSections(prev => [...prev, DEFAULT_SECTION(id, `Building ${id}`)]);
                  setActiveSectionId(id); setNextSectionId(id + 1); setIsManualDraw(true);
                }}>+ Add</button>
              </div>

              <div className="sections-list">
                {roofSections.map(section => (
                  <div key={section.id} className={`section-card ${activeSectionId === section.id ? "active" : ""}`} onClick={() => setActiveSectionId(section.id)}>
                    <div className="section-card-top">
                      <input className="section-label-input" value={section.label} onChange={e => setRoofSections(prev => prev.map(s => s.id === section.id ? {...s, label: e.target.value} : s))} onClick={e => e.stopPropagation()} />
                      {roofSections.length > 1 && <button className="remove-section-btn" onClick={e => { e.stopPropagation(); setRoofSections(p => p.filter(x => x.id !== section.id)); setSolarUnits(prev => prev.filter(u => u.sectionId !== section.id)); setObstacles(prev => prev.filter(o => o.sectionId !== section.id)); }}>✕</button>}
                    </div>

                    <div className="section-elevation-row" style={{ marginTop: '8px' }}>
                      <label>Base Elevation</label>
                      <div className="elevation-input-group"><input type="number" min="0" step="0.5" value={section.baseElevation} className="elevation-input" onChange={e => setRoofSections(prev => prev.map(s => s.id === section.id ? {...s, baseElevation: parseFloat(e.target.value)||0} : s))} onClick={e => e.stopPropagation()}/><span className="elevation-unit">m</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedNode && (
                <div style={{ padding: '12px 14px', background: 'rgba(251, 191, 36, 0.1)', borderTop: '1px solid var(--border-accent)', borderBottom: '1px solid var(--border-accent)' }}>
                  <label style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📐 POINT ELEVATION (PITCH)</label>
                  <div className="elevation-input-group" style={{ borderColor: '#fbbf24' }}>
                    <input type="number" step="0.5" value={selectedNode.z} className="elevation-input" style={{ color: '#fff', width: '100%' }} onChange={e => handleNodeElevationChange(e.target.value)} />
                    <span className="elevation-unit" style={{ color: '#fbbf24' }}>m</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#aaa', display: 'block', marginTop: '6px' }}>Raise this point to create sloped ridges and gables.</span>
                  {/* NEW: DELETE POINT BUTTON */}
                  <button
                    className="toolbar-btn danger"
                    style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                    onClick={handleDeletePoint}
                    title="Delete this point (Delete/Backspace)"
                  >
                    🗑 Delete Point
                  </button>
                </div>
              )}

              <div className="building-height-row">
                <label className="building-height-label">Building Height</label>
                <div className="elevation-input-group"><input type="number" min="3" max="600" step="0.5" value={buildingHeight} className="elevation-input" onChange={e => setBuildingHeight(parseFloat(e.target.value)||0)} /><span className="elevation-unit">m</span></div>
              </div>
              <div className="sections-panel-footer"><button className={`view3d-btn ${roofSections.some(s => s.faces?.length > 0) ? "" : "disabled"}`} onClick={handleView3D}>🏗 View 3D Structure →</button></div>
            </div>

            <div className="draw-canvas-area">
              <Toolbar isManualDraw={isManualDraw} polygon={activeSection?.nodes || []} onClear={handleClearSection} onEnableManual={() => setIsManualDraw(true)} onView3D={handleView3D} buildingHeight={buildingHeight} onHeightChange={setBuildingHeight} />
              <RoofPolygonDrawer
                key={`mesh-${activeSectionId}`}
                nodes={activeSection?.nodes || []} faces={activeSection?.faces || []} otherSections={roofSections.filter(s => s.id !== activeSectionId)}
                onMeshChange={handleMeshChange} selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId}
                location={location} globalCenter={globalCenter} activeRoofZ={activeRoofZ} mpp={mpp} mpu={mpu}
                activeSectionId={activeSectionId} onSatImageReady={img => satImageRef.current = img}
                solarUnits={solarUnits} setSolarUnits={setSolarUnits} obstacles={obstacles} setObstacles={setObstacles}
                solarData={solarData}
                onGenerateReport={handleGenerateReport}
                onUndo={handleUndo} canUndo={canUndo} onDeletePoint={handleDeletePoint}
              />
            </div>
          </div>
        </div>
      )}

      {step === STEPS.VIEW3D && (
        <div className="viewer-screen">
          <div className="viewer-controls-bar">
            <button className="back-btn secondary" onClick={() => setStep(STEPS.DRAW)}>← Edit Blueprint</button>
            <div className="height-control-inline"><label>Height:&nbsp;<input type="number" min="3" max="600" step="0.5" value={buildingHeight} className="height-number-input" onChange={e => setBuildingHeight(parseFloat(e.target.value)||0)} /><span className="elevation-unit">m</span></label></div>
            <button className="mode-btn" style={{ background: '#22c55e', color: 'black', fontWeight: 'bold' }} onClick={handleGenerateReport}>📑 Generate Report</button>
          </div>
          <Building3DViewer
            ref={viewerRef}
            roofSections={roofSections} buildingHeight={buildingHeight} location={location} satImage={satImageRef.current} solarData={solarData}
            solarUnits={solarUnits} setSolarUnits={setSolarUnits} obstacles={obstacles} setObstacles={setObstacles} heatmapCanvas={heatmapCanvas}
          />
        </div>
      )}
    </div>
  );
}
```

# FILE: src\components\RoofObstacle.jsx

```js
// FILE: src/components/RoofObstacle.jsx
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

export default function RoofObstacle({ id, type, dimensions, position, rotation = 0, mpu, isSelected, isValid, onSelect, onDrag, onDrop }) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const dragOffset = useRef(new THREE.Vector3());
  const { camera, scene, gl } = useThree();

  const [localPos, setLocalPos] = useState(() => new THREE.Vector3(...position));
  const [localNormal, setLocalNormal] = useState(() => new THREE.Vector3(0, 1, 0));
  
  const [needsInitialSnap, setNeedsInitialSnap] = useState(true);

  useEffect(() => {
    if (!isDragging.current) {
      setLocalPos(new THREE.Vector3(...position));
      setNeedsInitialSnap(true);
    }
  }, [position]);

  const obstacleMesh = useMemo(() => {
    const w = metersToWorld(dimensions.w, mpu), d = metersToWorld(dimensions.d, mpu), h = metersToWorld(dimensions.h, mpu);
    if (type === "water_tank") return buildWaterTank(w, h, d);
    return buildACUnit(w, h, d);
  }, [type, dimensions, mpu]);

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
        groupRef.current.scale.setScalar(s);
    } else {
        groupRef.current.scale.setScalar(1);
    }
  });

  // FIX: Always use our auto-snapped localPos instead of falling back to the raw prop!
  const pos = localPos;

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
```

# FILE: src\components\RoofPolygonDrawer.jsx

```js
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { PIXELS_TO_WORLD } from "../utils/scaleUtils";

const CANVAS_WIDTH = 700, CANVAS_HEIGHT = 500, POINT_RADIUS = 8, SNAP_DISTANCE = 18;

function isPointInPolygon(point, vs) {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isRectOverlapping(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1/2 < x2 - w2/2 || x1 - w1/2 > x2 + w2/2 || y1 + h1/2 < y2 - h2/2 || y1 - h1/2 > y2 + h2/2);
}

export default function RoofPolygonDrawer({
  nodes = [], faces = [], otherSections = [], onMeshChange, selectedNodeId, setSelectedNodeId,
  location, globalCenter, activeRoofZ, mpp, mpu, onSatImageReady,
  activeSectionId, solarUnits = [], setSolarUnits, obstacles = [], setObstacles,
  solarData, // <-- NEW PROP
  onGenerateReport, // <-- NEW PROP
  onUndo, canUndo, onDeletePoint // <-- NEW PROPS: undo history + point deletion (owned by parent RoofEditor)
}) {
  const canvasRef = useRef(null), bgImageRef = useRef(null);
  const [bgLoaded, setBgLoaded] = useState(false);
  
  const [viewTransform, setViewTransform] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastPanMouse = useRef({ x: 0, y: 0 });

  const [pendingNodeIds, setPendingNodeIds] = useState([]); 
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [inferenceGuides, setInferenceGuides] = useState([]);
  const [isNearFirst, setIsNearFirst] = useState(false);

  const draggingNodeRef = useRef(null);
  const hasDraggedNode = useRef(false);

  const [placementType, setPlacementType] = useState(null); 
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [draggingEntityId, setDraggingEntityId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [clipboard, setClipboard] = useState(null);

  const [dragAreaStart, setDragAreaStart] = useState(null);
  const [dragAreaCurrent, setDragAreaCurrent] = useState(null);

  const mToPx = useCallback((m) => m / mpp, [mpp]);
  const getDist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  const worldToCanvas = useCallback((wX, wZ) => ({ x: (wX / PIXELS_TO_WORLD) + globalCenter.x, y: (wZ / PIXELS_TO_WORLD) + globalCenter.y }), [globalCenter]);
  const canvasToWorld = useCallback((cX, cY) => ({ x: (cX - globalCenter.x) * PIXELS_TO_WORLD, z: (cY - globalCenter.y) * PIXELS_TO_WORLD }), [globalCenter]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screenX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width), screenY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      setViewTransform(prev => {
        let newZoom = Math.max(0.2, Math.min(prev.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 15));
        const factor = newZoom / prev.zoom;
        return { panX: screenX - (screenX - prev.panX) * factor, panY: screenY - (screenY - prev.panY) * factor, zoom: newZoom };
      });
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  const handleZoomButtons = (factor) => {
    setViewTransform(prev => {
      let newZoom = Math.max(0.2, Math.min(prev.zoom * factor, 15));
      const f = newZoom / prev.zoom, cX = CANVAS_WIDTH / 2, cY = CANVAS_HEIGHT / 2;
      return { panX: cX - (cX - prev.panX) * f, panY: cY - (cY - prev.panY) * f, zoom: newZoom };
    });
  };

  useEffect(() => {
    if (!location) return; setBgLoaded(false);
    const img = new Image(); img.onload = () => { bgImageRef.current = img; setBgLoaded(true); if (onSatImageReady) onSatImageReady(img); };
    img.src = `/api/staticmap?center=${location.lat},${location.lng}&zoom=20&size=700x500&maptype=satellite&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}`;
  }, [location, onSatImageReady]);

  const renderNodes = useMemo(() => {
    return (nodes || []).map(n => (draggingNodeRef.current === n.id && cursorPos) ? { ...n, x: cursorPos.x, y: cursorPos.y } : n);
  }, [nodes, cursorPos]);

  const currentFaceNodes = pendingNodeIds.map(id => renderNodes.find(n => n.id === id)).filter(Boolean);

  const getSnappedPosition = useCallback((rawPos) => {
    if (currentFaceNodes.length === 0) return { pos: rawPos, guides: [] };
    const lastNode = currentFaceNodes[currentFaceNodes.length - 1];
    
    const dist = getDist(lastNode, rawPos);
    let snappedPos = { ...rawPos }, guides = [], targetAngle = null, bestAngleDiff = Infinity;
    const angleThreshold = 5 * (Math.PI / 180); 

    const referenceAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    if (currentFaceNodes.length >= 2) {
      const p0 = currentFaceNodes[currentFaceNodes.length - 2];
      const prevAngle = Math.atan2(lastNode.y - p0.y, lastNode.x - p0.x);
      referenceAngles.push(prevAngle, prevAngle + Math.PI / 2, prevAngle + Math.PI, prevAngle - Math.PI / 2);
    }

    const currentAngle = Math.atan2(rawPos.y - lastNode.y, rawPos.x - lastNode.x);
    referenceAngles.forEach(refA => {
      let normRef = Math.atan2(Math.sin(refA), Math.cos(refA)), diff = Math.abs(currentAngle - normRef);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < angleThreshold && diff < bestAngleDiff) { bestAngleDiff = diff; targetAngle = normRef; }
    });

    if (targetAngle !== null) {
      snappedPos = { x: lastNode.x + Math.cos(targetAngle) * dist, y: lastNode.y + Math.sin(targetAngle) * dist };
      const ext = 2000; 
      guides.push({ p1: { x: lastNode.x - Math.cos(targetAngle)*ext, y: lastNode.y - Math.sin(targetAngle)*ext }, p2: { x: lastNode.x + Math.cos(targetAngle)*ext, y: lastNode.y + Math.sin(targetAngle)*ext }, color: "rgba(99, 210, 255, 0.6)" });
    }

    const firstNode = currentFaceNodes[0];
    const thresholdPx = 12 / viewTransform.zoom;
    if (Math.abs(snappedPos.x - firstNode.x) < thresholdPx) {
      snappedPos.x = firstNode.x; guides.push({ p1: { x: firstNode.x, y: firstNode.y - 2000 }, p2: { x: firstNode.x, y: firstNode.y + 2000 }, color: "rgba(251, 191, 36, 0.6)" });
    }
    if (Math.abs(snappedPos.y - firstNode.y) < thresholdPx) {
      snappedPos.y = firstNode.y; guides.push({ p1: { x: firstNode.x - 2000, y: firstNode.y }, p2: { x: firstNode.x + 2000, y: firstNode.y }, color: "rgba(251, 191, 36, 0.6)" });
    }
    return { pos: snappedPos, guides };
  }, [currentFaceNodes, viewTransform.zoom, getDist]);

  const handleAutoFill = () => {
    if (!faces || faces.length === 0) return;

    const panelCols = 1, panelRows = 1;
    const pW = mToPx((panelCols * 1.00)); 
    const pH = mToPx((panelRows * 1.65 * Math.cos(12 * (Math.PI / 180)))); 
    const gap = mToPx(0.1); 
    const edgeSetback = mToPx(0.5); 

    const newPanels = [];
    
    const obsData = (obstacles || []).filter(o => o.sectionId === activeSectionId).map(o => {
      const c = worldToCanvas(o.position[0], o.position[2]);
      const w = mToPx(o.dimensions?.w || 1.2), d = mToPx(o.dimensions?.d || 1.2);
      return { x: c.x, y: c.y, w: w * 1.5, h: d * 1.5 }; 
    });

    faces.forEach(face => {
      const faceNodes = face.nodeIds.map(id => renderNodes.find(n => n.id === id)).filter(Boolean);
      if(faceNodes.length < 3) return;
      
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      faceNodes.forEach(p => {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      });

      const hardwareMargin = mToPx(0.15); 
      const startY = minY + pH/2 + edgeSetback + hardwareMargin;
      const endY = maxY - pH/2 - edgeSetback - hardwareMargin;
      const startX = minX + pW/2 + edgeSetback + hardwareMargin;
      const endX = maxX - pW/2 - edgeSetback - hardwareMargin;

      for (let y = startY; y <= endY; y += pH + gap) {
        for (let x = startX; x <= endX; x += pW + gap) {
          const corners = [
            { x: x - pW/2, y: y - pH/2 }, { x: x + pW/2, y: y - pH/2 },
            { x: x + pW/2, y: y + pH/2 }, { x: x - pW/2, y: y + pH/2 }
          ];

          const isInside = corners.every(c => isPointInPolygon(c, faceNodes));
          let collides = false;

          if (isInside) {
            collides = obsData.some(obs => isRectOverlapping(x, y, pW, pH, obs.x, obs.y, obs.w, obs.h));
          }

          if (isInside && !collides) {
            const worldPos = canvasToWorld(x, y);
            newPanels.push({
              id: `solar-auto-${Date.now()}-${x}-${y}`,
              position: [worldPos.x, activeRoofZ, worldPos.z],
              roofZ: activeRoofZ, rotation: 0, isValid: true, sectionId: activeSectionId,
              rows: panelRows, cols: panelCols, orientation: 'portrait'
            });
          }
        }
      }
    });

    setSolarUnits(prev => {
      const filtered = (prev || []).filter(p => p.sectionId !== activeSectionId);
      return [...filtered, ...newPanels];
    });
  };

  const handleCopy = useCallback(() => {
    if (!selectedEntityId) return;
    const entity = [...(solarUnits || []), ...(obstacles || [])].find(e => e.id === selectedEntityId);
    if (entity) {
      const isSolar = entity.cols !== undefined; 
      const type = isSolar ? 'solar' : (entity.type || 'obstacle');
      const { id, position, ...entityData } = entity;
      setClipboard({ type, data: entityData });
    }
  }, [selectedEntityId, solarUnits, obstacles]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const cx = (CANVAS_WIDTH / 2 - viewTransform.panX) / viewTransform.zoom;
    const cy = (CANVAS_HEIGHT / 2 - viewTransform.panY) / viewTransform.zoom;
    const pasteCanvasPos = cursorPos || { x: cx, y: cy };
    
    const worldPos = canvasToWorld(pasteCanvasPos.x, pasteCanvasPos.y);
    const newId = `${clipboard.type}-${Date.now()}`;
    const isTree = clipboard.type === 'tree';
    const placementZ = isTree ? 0 : activeRoofZ;

    const newEntity = {
      ...clipboard.data,
      id: newId,
      position: [worldPos.x, placementZ, worldPos.z],
      roofZ: placementZ,
      isValid: true,
      sectionId: isTree ? null : activeSectionId
    };

    if (clipboard.type === 'solar') {
      setSolarUnits(p => [...(p || []), newEntity]);
    } else {
      setObstacles(p => [...(p || []), newEntity]);
    }

    setSelectedEntityId(newId);
    setDraggingEntityId(newId);
    dragOffset.current = { x: 0, y: 0 }; 
  }, [clipboard, cursorPos, canvasToWorld, activeRoofZ, viewTransform, activeSectionId, setSolarUnits, setObstacles]);

  // NEW: undo / delete-point wrapper callbacks.
  // These also tidy up local in-progress-drawing state (pendingNodeIds/hoveredNodeId)
  // so we never reference a node id that the parent has just removed/restored away.
  const handleUndoClick = useCallback(() => {
    setPendingNodeIds([]);
    setInferenceGuides([]);
    if (onUndo) onUndo();
  }, [onUndo]);

  const handleDeletePointClick = useCallback(() => {
    if (!selectedNodeId) return;
    setPendingNodeIds(prev => prev.filter(id => id !== selectedNodeId));
    setHoveredNodeId(prev => (prev === selectedNodeId ? null : prev));
    if (onDeletePoint) onDeletePoint();
  }, [selectedNodeId, onDeletePoint]);

  const copyRef = useRef(handleCopy);
  const pasteRef = useRef(handlePaste);
  const undoRef = useRef(handleUndoClick);
  const deletePointRef = useRef(handleDeletePointClick);
  useEffect(() => { copyRef.current = handleCopy; }, [handleCopy]);
  useEffect(() => { pasteRef.current = handlePaste; }, [handlePaste]);
  useEffect(() => { undoRef.current = handleUndoClick; }, [handleUndoClick]);
  useEffect(() => { deletePointRef.current = handleDeletePointClick; }, [handleDeletePointClick]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); setIsSpacePressed(true); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); copyRef.current(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteRef.current(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoRef.current(); } // NEW: Ctrl+Z / Cmd+Z undo
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deletePointRef.current(); } // NEW: delete selected point
      if (e.key === 'Escape') { setPendingNodeIds([]); setInferenceGuides([]); }
    };
    const handleKeyUp = (e) => { if (e.code === "Space") setIsSpacePressed(false); };
    window.addEventListener("keydown", handleKeyDown); 
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#12121f"; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save(); ctx.translate(viewTransform.panX, viewTransform.panY); ctx.scale(viewTransform.zoom, viewTransform.zoom);

    if (bgImageRef.current && bgLoaded) {
      ctx.drawImage(bgImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1/viewTransform.zoom;
    (otherSections || []).forEach(sec => {
      (sec.faces || []).forEach(face => {
        const pts = face.nodeIds.map(id => (sec.nodes || []).find(n => n.id === id)).filter(Boolean);
        if(pts.length < 3) return;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill(); ctx.stroke();
      });
    });

    (faces || []).forEach(face => {
      const pts = face.nodeIds.map(id => renderNodes.find(n => n.id === id)).filter(Boolean);
      if(pts.length < 3) return;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath(); ctx.fillStyle = "rgba(99, 210, 255, 0.2)"; ctx.fill();
      ctx.strokeStyle = "#63d2ff"; ctx.lineWidth = 2 / viewTransform.zoom; ctx.stroke();
    });

    if (placementType === 'panel_area' && dragAreaStart && dragAreaCurrent) {
      ctx.fillStyle = "rgba(99, 210, 255, 0.15)";
      ctx.strokeStyle = "#63d2ff";
      ctx.lineWidth = 1 / viewTransform.zoom;
      const x = Math.min(dragAreaStart.x, dragAreaCurrent.x);
      const y = Math.min(dragAreaStart.y, dragAreaCurrent.y);
      const w = Math.abs(dragAreaStart.x - dragAreaCurrent.x);
      const h = Math.abs(dragAreaStart.y - dragAreaCurrent.y);
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([5/viewTransform.zoom, 5/viewTransform.zoom]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    if (inferenceGuides.length > 0 && currentFaceNodes.length > 0) {
      inferenceGuides.forEach(guide => {
        ctx.beginPath(); ctx.moveTo(guide.p1.x, guide.p1.y); ctx.lineTo(guide.p2.x, guide.p2.y);
        ctx.strokeStyle = guide.color; ctx.lineWidth = 1 / viewTransform.zoom; ctx.setLineDash([4 / viewTransform.zoom, 4 / viewTransform.zoom]); ctx.stroke(); ctx.setLineDash([]);
      });
    }

    if (currentFaceNodes.length > 0) {
      ctx.beginPath(); ctx.moveTo(currentFaceNodes[0].x, currentFaceNodes[0].y);
      for(let i=1; i<currentFaceNodes.length; i++) ctx.lineTo(currentFaceNodes[i].x, currentFaceNodes[i].y);
      
      if (cursorPos && !draggingNodeRef.current) {
        ctx.lineTo(isNearFirst ? currentFaceNodes[0].x : cursorPos.x, isNearFirst ? currentFaceNodes[0].y : cursorPos.y);
        
        const lastNode = currentFaceNodes[currentFaceNodes.length - 1];
        const targetX = isNearFirst ? currentFaceNodes[0].x : cursorPos.x;
        const targetY = isNearFirst ? currentFaceNodes[0].y : cursorPos.y;
        
        const dx = targetX - lastNode.x, dy = targetY - lastNode.y;
        const distPx = Math.sqrt(dx*dx + dy*dy);
        const distM = (distPx * mpp).toFixed(1);
        let angleDeg = Math.round(Math.atan2(dy, dx) * (180/Math.PI));
        if (angleDeg < 0) angleDeg += 360;
        
        ctx.fillStyle = "#fff"; ctx.font = `${12/viewTransform.zoom}px sans-serif`;
        ctx.fillText(`${distM}m, ${angleDeg}°`, (lastNode.x + targetX)/2 + 8/viewTransform.zoom, (lastNode.y + targetY)/2 - 8/viewTransform.zoom);
      }
      
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2 / viewTransform.zoom; 
      ctx.setLineDash([4/viewTransform.zoom, 4/viewTransform.zoom]); ctx.stroke(); ctx.setLineDash([]);
    }

    renderNodes.forEach(n => {
      const isSelected = n.id === selectedNodeId, isHovered = n.id === hoveredNodeId, isPendingFirst = pendingNodeIds.length > 0 && pendingNodeIds[0] === n.id;
      const isClosing = isPendingFirst && isNearFirst;
      
      ctx.beginPath(); ctx.arc(n.x, n.y, (isHovered || isPendingFirst ? POINT_RADIUS + 3 : POINT_RADIUS) / viewTransform.zoom, 0, Math.PI*2);
      ctx.fillStyle = isClosing ? "#22c55e" : isSelected ? "#ef4444" : isPendingFirst ? "#22c55e" : "#fbbf24";
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 / viewTransform.zoom; ctx.fill(); ctx.stroke();
      
      if (n.z > 0) {
        ctx.fillStyle = "#fff"; ctx.font = `${10/viewTransform.zoom}px sans-serif`;
        ctx.fillText(`+${n.z}m`, n.x + 12/viewTransform.zoom, n.y - 12/viewTransform.zoom);
      }
    });

    const allEntities = [...(solarUnits || []).map(u => ({ ...u, entityType: 'solar' })), ...(obstacles || []).map(o => ({ ...o, entityType: o.type }))];
    allEntities.forEach(entity => {
      if (entity.entityType !== 'tree' && entity.sectionId && entity.sectionId !== activeSectionId) return;
      const c = worldToCanvas(entity.position[0], entity.position[2]);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(entity.rotation || 0); 
      if (selectedEntityId === entity.id) { ctx.shadowColor = "#44aaff"; ctx.shadowBlur = 15 / viewTransform.zoom; ctx.strokeStyle = "#44aaff"; ctx.lineWidth = 3 / viewTransform.zoom; } 
      else { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5 / viewTransform.zoom; }

      if (entity.entityType === 'solar') {
        const isLandscape = entity.orientation === 'landscape', rawW = isLandscape ? 1.65 : 1.00, rawH = isLandscape ? 1.00 : 1.65;
        const pW = mToPx((entity.cols * rawW) + ((entity.cols - 1) * 0.05)), pH = mToPx((entity.rows * rawH * Math.cos(12 * (Math.PI / 180))) + ((entity.rows - 1) * 0.30)); 
        ctx.fillStyle = "rgba(15, 31, 58, 0.9)"; ctx.fillRect(-pW/2, -pH/2, pW, pH); ctx.strokeRect(-pW/2, -pH/2, pW, pH);
      } else if (entity.entityType === 'ac_unit') {
        const w = mToPx(entity.dimensions?.w || 1.2), d = mToPx(entity.dimensions?.d || 1.2);
        ctx.fillStyle = "#d4d4d4"; ctx.fillRect(-w/2, -d/2, w, d); ctx.strokeRect(-w/2, -d/2, w, d);
        ctx.beginPath(); ctx.arc(0, 0, Math.min(w,d)*0.3, 0, Math.PI*2); ctx.stroke();
      } else if (entity.entityType === 'water_tank') {
        const r = mToPx(entity.dimensions?.w || 1.5) / 2;
        ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      } else if (entity.entityType === 'tree') {
        const w = mToPx(entity.dimensions?.w || 4);
        ctx.fillStyle = "rgba(34, 197, 94, 0.5)"; ctx.strokeStyle = "#15803d";
        ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#5c4033"; ctx.beginPath(); ctx.arc(0, 0, w*0.15, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore(); 
  }, [renderNodes, faces, otherSections, currentFaceNodes, hoveredNodeId, selectedNodeId, cursorPos, viewTransform, bgLoaded, solarUnits, obstacles, selectedEntityId, worldToCanvas, mToPx, activeSectionId, inferenceGuides, mpp, isNearFirst, pendingNodeIds, dragAreaStart, dragAreaCurrent, placementType]);

  useEffect(() => { draw(); }, [draw]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * (CANVAS_WIDTH / rect.width) - viewTransform.panX) / viewTransform.zoom, y: ((e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height) - viewTransform.panY) / viewTransform.zoom };
  };

  const getClickedEntity = (pos) => {
    const hitRadius = 25 / viewTransform.zoom;
    const allEntities = [...(solarUnits||[]), ...(obstacles||[])];
    for (let i = allEntities.length - 1; i >= 0; i--) {
      const e = allEntities[i];
      if (e.type !== 'tree' && e.sectionId && e.sectionId !== activeSectionId) continue;
      const c = worldToCanvas(e.position[0], e.position[2]);
      const activeHit = e.type === 'tree' ? (mToPx(e.dimensions.w)/2) : hitRadius;
      if (Math.sqrt((pos.x - c.x)**2 + (pos.y - c.y)**2) < activeHit) return e.id;
    }
    return null;
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 2 || isSpacePressed) { e.preventDefault(); setIsPanning(true); lastPanMouse.current = { x: e.clientX, y: e.clientY }; return; }
    const pos = getCanvasPos(e);

    if (placementType === 'panel_area') {
      setDragAreaStart(pos);
      setDragAreaCurrent(pos);
      return; 
    }

    if (faces && faces.length > 0 && placementType && placementType !== 'panel_area') {
      const worldPos = canvasToWorld(pos.x, pos.y);
      const newId = `${placementType}-${Date.now()}`;
      if (placementType === 'solar') setSolarUnits(p => [...(p || []), { id: newId, position: [worldPos.x, activeRoofZ, worldPos.z], roofZ: activeRoofZ, rotation: 0, isValid: true, sectionId: activeSectionId, rows: 3, cols: 4, orientation: 'portrait' }]);
      else {
        const isTree = placementType === 'tree'; const defaultDim = isTree ? {w: 4, d: 4, h: 6} : (placementType === 'water_tank' ? {w: 1.5, d: 1.5, h: 1.5} : {w: 1.2, d: 1.2, h: 1});
        setObstacles(p => [...(p || []), { id: newId, type: placementType, dimensions: defaultDim, position: [worldPos.x, isTree ? 0 : activeRoofZ, worldPos.z], roofZ: isTree ? 0 : activeRoofZ, rotation: 0, isValid: true, sectionId: isTree ? null : activeSectionId }]);
      }
      setPlacementType(null); setSelectedEntityId(newId); return;
    }

    if (!placementType && faces && faces.length > 0) {
      const clickedId = getClickedEntity(pos);
      if (clickedId) { setSelectedEntityId(clickedId); setDraggingEntityId(clickedId); const entity = [...(solarUnits||[]), ...(obstacles||[])].find(x => x.id === clickedId); const c = worldToCanvas(entity.position[0], entity.position[2]); dragOffset.current = { x: c.x - pos.x, y: c.y - pos.y }; return; } 
      else setSelectedEntityId(null);
    }

    let nearestNode = null; let minDist = SNAP_DISTANCE / viewTransform.zoom;
    renderNodes.forEach(n => { const d = getDist(pos, n); if(d < minDist) { minDist = d; nearestNode = n; } });

    if (nearestNode) { 
      draggingNodeRef.current = nearestNode.id;
      hasDraggedNode.current = false;
      return; 
    }
    
    let targetNodeId = nearestNode ? nearestNode.id : null; let newNodes = [...(nodes || [])];
    let finalPos = pos;
    if (!targetNodeId) {
        if (currentFaceNodes.length > 0) {
            const { pos: snappedPos } = getSnappedPosition(pos);
            finalPos = snappedPos;
        }
        targetNodeId = `n-${Date.now()}`; 
        newNodes.push({ id: targetNodeId, x: finalPos.x, y: finalPos.y, z: 0 }); 
    }
    
    if (!pendingNodeIds.includes(targetNodeId)) {
      setPendingNodeIds([...pendingNodeIds, targetNodeId]); onMeshChange(newNodes, faces); 
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanMouse.current.x, dy = e.clientY - lastPanMouse.current.y; lastPanMouse.current = { x: e.clientX, y: e.clientY };
      setViewTransform(p => ({ ...p, panX: p.panX + dx, panY: p.panY + dy })); return;
    }
    const rawPos = getCanvasPos(e); 

    if (dragAreaStart && placementType === 'panel_area') {
      setDragAreaCurrent(rawPos);
      return; 
    }

    if (draggingEntityId) {
      const worldPos = canvasToWorld(rawPos.x + dragOffset.current.x, rawPos.y + dragOffset.current.y);
      const updateFn = p => (p || []).map(item => item.id === draggingEntityId ? { ...item, position: [worldPos.x, item.position[1], worldPos.z] } : item);
      setSolarUnits(updateFn); setObstacles(updateFn); return;
    }

    if (draggingNodeRef.current) {
      hasDraggedNode.current = true;
      setCursorPos(rawPos); 
      return;
    }
    
    let finalCursorPos = rawPos;
    if (currentFaceNodes.length > 0) {
        const { pos: snappedPos, guides } = getSnappedPosition(rawPos);
        finalCursorPos = snappedPos; setInferenceGuides(guides);
        const firstNode = currentFaceNodes[0];
        if (firstNode) setIsNearFirst(getDist(finalCursorPos, firstNode) < (SNAP_DISTANCE / viewTransform.zoom));
    } else { setInferenceGuides([]); setIsNearFirst(false); }
    
    setCursorPos(finalCursorPos);
    
    let nearest = null; let minDist = SNAP_DISTANCE / viewTransform.zoom;
    renderNodes.forEach(n => { const d = getDist(finalCursorPos, n); if(d < minDist) { minDist = d; nearest = n.id; } });
    setHoveredNodeId(nearest);
  };

  const handleMouseUp = () => { 
    setIsPanning(false); setDraggingEntityId(null); 
    
    if (dragAreaStart && placementType === 'panel_area') {
      if (dragAreaCurrent && faces && faces.length > 0) {
        const boxMinX = Math.min(dragAreaStart.x, dragAreaCurrent.x);
        const boxMaxX = Math.max(dragAreaStart.x, dragAreaCurrent.x);
        const boxMinY = Math.min(dragAreaStart.y, dragAreaCurrent.y);
        const boxMaxY = Math.max(dragAreaStart.y, dragAreaCurrent.y);

        const panelCols = 1, panelRows = 1;
        const pW = mToPx((panelCols * 1.00)); 
        const pH = mToPx((panelRows * 1.65 * Math.cos(12 * (Math.PI / 180)))); 
        const gap = mToPx(0.1); 
        const hardwareMargin = mToPx(0.15); 

        const newPanels = [];
        const obsData = (obstacles || []).filter(o => o.sectionId === activeSectionId).map(o => {
          const c = worldToCanvas(o.position[0], o.position[2]);
          const w = mToPx(o.dimensions?.w || 1.2), d = mToPx(o.dimensions?.d || 1.2);
          return { x: c.x, y: c.y, w: w * 1.5, h: d * 1.5 }; 
        });

        faces.forEach(face => {
          const faceNodes = face.nodeIds.map(id => renderNodes.find(n => n.id === id)).filter(Boolean);
          if(faceNodes.length < 3) return;

          const startY = boxMinY + pH/2 + hardwareMargin;
          const endY = boxMaxY - pH/2 - hardwareMargin;
          const startX = boxMinX + pW/2 + hardwareMargin;
          const endX = boxMaxX - pW/2 - hardwareMargin;

          for (let y = startY; y <= endY; y += pH + gap) {
            for (let x = startX; x <= endX; x += pW + gap) {
              const corners = [
                { x: x - pW/2, y: y - pH/2 }, { x: x + pW/2, y: y - pH/2 },
                { x: x + pW/2, y: y + pH/2 }, { x: x - pW/2, y: y + pH/2 }
              ];
              const isInside = corners.every(c => isPointInPolygon(c, faceNodes));
              let collides = false;

              if (isInside) {
                collides = obsData.some(obs => isRectOverlapping(x, y, pW, pH, obs.x, obs.y, obs.w, obs.h));
              }

              if (isInside && !collides) {
                const worldPos = canvasToWorld(x, y);
                newPanels.push({
                  id: `solar-auto-${Date.now()}-${x}-${y}`,
                  position: [worldPos.x, activeRoofZ, worldPos.z],
                  roofZ: activeRoofZ, rotation: 0, isValid: true, sectionId: activeSectionId,
                  rows: panelRows, cols: panelCols, orientation: 'portrait'
                });
              }
            }
          }
        });

        setSolarUnits(prev => [...(prev || []), ...newPanels]);
      }
      
      setDragAreaStart(null);
      setDragAreaCurrent(null);
      return;
    }

    if (draggingNodeRef.current) {
      if (hasDraggedNode.current && cursorPos) {
         const updatedNodes = nodes.map(n => n.id === draggingNodeRef.current ? { ...n, x: cursorPos.x, y: cursorPos.y } : n);
         onMeshChange(updatedNodes, faces);
         setSelectedNodeId(draggingNodeRef.current);
      } else {
        const clickedId = draggingNodeRef.current;
        if (pendingNodeIds.length === 0) {
            setSelectedNodeId(clickedId); setPendingNodeIds([clickedId]);
        } else {
            if (pendingNodeIds.length >= 3 && clickedId === pendingNodeIds[0]) {
                const newFace = { id: `f-${Date.now()}`, nodeIds: [...pendingNodeIds] };
                onMeshChange(nodes, [...faces, newFace]);
                setPendingNodeIds([]); setInferenceGuides([]);
            } else if (!pendingNodeIds.includes(clickedId)) {
                setPendingNodeIds([...pendingNodeIds, clickedId]);
            }
        }
      }
      draggingNodeRef.current = null;
    }
  };

  const handleEntityRotate = (e) => {
    const angleRad = parseInt(e.target.value) * (Math.PI / 180);
    const updateFn = p => (p || []).map(item => item.id === selectedEntityId ? { ...item, rotation: angleRad } : item);
    setSolarUnits(updateFn); setObstacles(updateFn);
  };
  
  const handleEntityDimensions = (newDim) => {
    setObstacles(p => (p || []).map(item => item.id === selectedEntityId ? { ...item, dimensions: newDim } : item));
  };

  const handleEntityLayout = (updates) => {
    setSolarUnits(p => (p || []).map(item => item.id === selectedEntityId ? { ...item, ...updates } : item));
  };

  const handleEntityDelete = () => { setSolarUnits(p => (p || []).filter(i => i.id !== selectedEntityId)); setObstacles(p => (p || []).filter(i => i.id !== selectedEntityId)); setSelectedEntityId(null); };
  
  const selectedEntity = [...(solarUnits || []), ...(obstacles || [])].find(e => e.id === selectedEntityId);
  const selectedRotationDeg = selectedEntity ? Math.round((selectedEntity.rotation || 0) * (180 / Math.PI)) : 0;
  const isSelectedSolar = selectedEntity && selectedEntity.cols !== undefined;
  const isSelectedObstacle = selectedEntity && selectedEntity.type !== undefined;

  return (
    <div className="polygon-drawer" style={{ position: 'relative' }}>
      <div className="drawer-mode-bar" style={{ background: '#1e1e2d', borderBottom: '1px solid #333', padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
        {/* NEW: UNDO BUTTON — always visible, works on nodes/faces edits for the active section */}
        <button
          className="mode-btn"
          style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
          onClick={handleUndoClick}
          disabled={!canUndo}
          title={canUndo ? "Undo last action (Ctrl+Z)" : "Nothing to undo"}
        >
          ↩️ Undo
        </button>

        {/* NEW: DELETE POINT BUTTON — shown only when a point is selected */}
        {selectedNodeId && (
          <button
            className="mode-btn danger"
            style={{ marginLeft: 6 }}
            onClick={handleDeletePointClick}
            title="Delete selected point (Delete / Backspace)"
          >
            🗑 Delete Point
          </button>
        )}

        <span className="toolbar-divider" style={{ margin: '0 8px', width: 1, height: 16, background: 'var(--border)' }} />

        {faces && faces.length > 0 ? (
          <>
            <span className="mode-label" style={{ color: '#6ee7b7', marginRight: '8px' }}>Place Layout:</span>
            <button className={`mode-btn ${placementType === 'panel_area' ? 'active' : ''}`} onClick={() => setPlacementType('panel_area')} title="Drag a box to auto-fill panels">📐 Area Fill</button>
            <span className="toolbar-divider" style={{ margin: '0 8px', width: 1, height: 16, background: 'var(--border)' }} />
            
            <button className={`mode-btn ${placementType === 'solar' ? 'active' : ''}`} onClick={() => setPlacementType('solar')}>☀️ Panel Array</button>
            <button className={`mode-btn ${placementType === 'ac_unit' ? 'active' : ''}`} onClick={() => setPlacementType('ac_unit')}>❄️ AC Unit</button>
            <button className={`mode-btn ${placementType === 'water_tank' ? 'active' : ''}`} onClick={() => setPlacementType('water_tank')}>🛢️ Water</button>
            <button className={`mode-btn ${placementType === 'tree' ? 'active' : ''}`} onClick={() => setPlacementType('tree')}>🌲 Tree</button>
            <span className="toolbar-divider" style={{ margin: '0 8px', width: 1, height: 16, background: 'var(--border)' }} />
            <button className="mode-btn" style={{ background: 'var(--accent)', color: 'black', fontWeight: 'bold' }} onClick={handleAutoFill} title="Fill entire active roof face">✨ Fill Entire Roof</button>
            
            <span className="toolbar-divider" style={{ margin: '0 8px', width: 1, height: 16, background: 'var(--border)' }} />
            <button 
              className="mode-btn" 
              style={{ opacity: clipboard ? 1 : 0.4, cursor: clipboard ? 'pointer' : 'not-allowed' }} 
              onClick={handlePaste} 
              disabled={!clipboard}
              title={clipboard ? `Paste ${clipboard.type} (Ctrl+V)` : "Copy an item first"}
            >
              📋 Paste
            </button>

            {/* NEW: REPORT BUTTON */}
            <span className="toolbar-divider" style={{ margin: '0 8px', width: 1, height: 16, background: 'var(--border)' }} />
            <button className="mode-btn" style={{ background: '#22c55e', color: 'black', fontWeight: 'bold' }} onClick={onGenerateReport}>📑 Generate Report</button>

            {pendingNodeIds.length > 0 && <button style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer'}} onClick={() => {setPendingNodeIds([]); setInferenceGuides([]);}}>Cancel Face</button>}
          </>
        ) : (
          <span style={{ fontSize: '11px', color: '#fbbf24' }}><strong>CAD MODE:</strong> Trace points to draw a flat roof. <strong>Click and drag</strong> to move points.</span>
        )}
      </div>
      <div className="drawer-canvas-wrapper" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="drawer-canvas"
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} 
          onMouseLeave={() => { handleMouseUp(); setDragAreaStart(null); setDragAreaCurrent(null); }} 
          onContextMenu={(e) => e.preventDefault()} 
          style={{ cursor: isPanning || draggingEntityId ? 'grabbing' : isSpacePressed ? 'grab' : placementType === 'panel_area' ? 'crosshair' : placementType ? 'copy' : 'default' }} />
        
        <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 12, zIndex: 10, alignItems: 'flex-end' }}>
          
          {/* NEW: SOLAR DATA INSIGHTS DASHBOARD */}
          {solarData && (
            <div style={{ background: 'rgba(15, 15, 26, 0.95)', border: '1px solid var(--accent)', padding: '12px', borderRadius: '8px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '6px', backdropFilter: 'blur(4px)', minWidth: '180px', pointerEvents: 'none' }}>
               <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)', borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px' }}>📊 Site Potential (API)</span>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                 <span style={{color: '#888'}}>Max Capacity:</span> 
                 <strong>{((solarData.maxArrayPanelsCount * 400)/1000).toFixed(1)} kW</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                 <span style={{color: '#888'}}>Sunshine:</span> 
                 <strong>{Math.round(solarData.maxSunshineHoursPerYear)} hrs/yr</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6ee7b7', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #444' }}>
                 <span>Panels Placed:</span> 
                 <strong>{solarUnits.reduce((acc, u) => acc + (u.rows * u.cols), 0)}</strong>
               </div>
            </div>
          )}

          {/* ZOOM CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => handleZoomButtons(1.2)} className="mode-btn" style={{ padding: '6px 10px', fontSize: 16, background: 'rgba(15,15,26,0.8)' }}>+</button>
            <button onClick={() => handleZoomButtons(0.8)} className="mode-btn" style={{ padding: '6px 10px', fontSize: 16, background: 'rgba(15,15,26,0.8)' }}>−</button>
            <button onClick={() => setViewTransform({ panX: 0, panY: 0, zoom: 1 })} className="mode-btn" style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(15,15,26,0.8)' }}>RESET</button>
          </div>

        </div>

        {selectedEntity && (
          <div style={{ position: 'absolute', top: 20, right: 20, width: 220, background: 'rgba(15, 15, 26, 0.95)', border: '1px solid var(--accent)', padding: 12, borderRadius: 8, color: '#fff', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 20, backdropFilter: 'blur(4px)' }} onPointerDown={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--accent)' }}>Edit Element</span>
              <button onClick={handleCopy} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '4px', fontSize: '10px', padding: '2px 6px', cursor: 'pointer' }} title="Copy (Ctrl+C)">📄 Copy</button>
            </div>
            
            {isSelectedSolar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ fontSize: '11px', color: '#aaa' }}>Layout: <strong style={{ color: '#fff' }}>{selectedEntity.rows} x {selectedEntity.cols}</strong></label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="mode-btn" onClick={() => handleEntityLayout({ rows: Math.max(1, selectedEntity.rows - 1) })} style={{flex: 1}}>-</button>
                  <span style={{fontSize: '11px', alignSelf: 'center'}}>Rows</span>
                  <button className="mode-btn" onClick={() => handleEntityLayout({ rows: selectedEntity.rows + 1 })} style={{flex: 1}}>+</button>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="mode-btn" onClick={() => handleEntityLayout({ cols: Math.max(1, selectedEntity.cols - 1) })} style={{flex: 1}}>-</button>
                  <span style={{fontSize: '11px', alignSelf: 'center'}}>Cols</span>
                  <button className="mode-btn" onClick={() => handleEntityLayout({ cols: selectedEntity.cols + 1 })} style={{flex: 1}}>+</button>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button className={`mode-btn ${selectedEntity.orientation === 'portrait' ? 'active' : ''}`} onClick={() => handleEntityLayout({ orientation: 'portrait' })} style={{flex: 1}}>Portrait</button>
                  <button className={`mode-btn ${selectedEntity.orientation === 'landscape' ? 'active' : ''}`} onClick={() => handleEntityLayout({ orientation: 'landscape' })} style={{flex: 1}}>Landscape</button>
                </div>
              </div>
            )}

            {isSelectedObstacle && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ fontSize: '11px', color: '#aaa' }}>Dimensions (W / D / H):</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="number" step="0.1" value={selectedEntity.dimensions.w} onChange={(e) => handleEntityDimensions({ ...selectedEntity.dimensions, w: parseFloat(e.target.value) || 0.1 })} style={{width: '33%', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '2px 4px', fontSize: '11px'}} title="Width" />
                  <input type="number" step="0.1" value={selectedEntity.dimensions.d} onChange={(e) => handleEntityDimensions({ ...selectedEntity.dimensions, d: parseFloat(e.target.value) || 0.1 })} style={{width: '33%', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '2px 4px', fontSize: '11px'}} title="Depth" />
                  <input type="number" step="0.1" value={selectedEntity.dimensions.h} onChange={(e) => handleEntityDimensions({ ...selectedEntity.dimensions, h: parseFloat(e.target.value) || 0.1 })} style={{width: '33%', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '2px 4px', fontSize: '11px'}} title="Height" />
                </div>
              </div>
            )}

            <label style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>Rotation: {selectedRotationDeg}° <input type="range" min="0" max="360" step="1" value={selectedRotationDeg} onChange={handleEntityRotate} /></label>
            <button className="mode-btn danger" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} onClick={handleEntityDelete}>🗑 Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

# FILE: src\components\SingleLineDiagram.jsx

```js
// FILE: src/components/SingleLineDiagram.jsx
import { DEFAULT_PANEL_VMP, DEFAULT_PANEL_IMP } from "../utils/reportUtils";

function Block({ x, y, w, h, title, lines = [] }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={6} fill="#0f1f3a" stroke="#63d2ff" strokeWidth={1.5} />
      <text x={w / 2} y={18} textAnchor="middle" fill="#fbbf24" fontSize={11} fontWeight="700">{title}</text>
      {lines.map((l, i) => (
        <text key={i} x={w / 2} y={34 + i * 14} textAnchor="middle" fill="#e5e7eb" fontSize={10}>{l}</text>
      ))}
    </g>
  );
}

function Connector({ x1, y1, x2, y2, label }) {
  const midX = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#sld-arrow)" />
      {label && <text x={midX} y={y1 - 6} textAnchor="middle" fill="#9ca3af" fontSize={9}>{label}</text>}
    </g>
  );
}

/**
 * Preliminary electrical single-line diagram: PV Array → DC Combiner/Disconnect
 * → Inverter(s) → AC Disconnect → Utility Meter/Grid, sized from
 * computeElectricalDesign() in reportUtils.js. Rendered as inline SVG so it
 * prints cleanly (vector, no rasterization) alongside the rest of the report.
 */
export default function SingleLineDiagram({ metrics, design }) {
  if (!design || !metrics?.totalPanels) {
    return (
      <div style={{ fontSize: 13, color: "#6b7280", padding: "20px 0", textAlign: "center" }}>
        Place at least one solar array to generate the single-line diagram.
      </div>
    );
  }

  const { stringing, inverterCount, perInverterKw, stringsPerInverter, acService, acCurrentTotal, breakerSize, dcAcRatio } = design;

  const W = 900, H = 220;
  const blockW = 150, blockH = 70, gap = 40;
  const y = 40;
  const xs = [20, 20 + (blockW + gap), 20 + 2 * (blockW + gap), 20 + 3 * (blockW + gap), 20 + 4 * (blockW + gap)];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", background: "#0c0c14", borderRadius: 6 }}>
        <defs>
          <marker id="sld-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
          </marker>
        </defs>

        <Block
          x={xs[0]} y={y} w={blockW} h={blockH} title="PV ARRAY"
          lines={[
            `${metrics.totalPanels} panels · ${metrics.totalCapacityKw} kW DC`,
            `${stringing.numStrings} string${stringing.numStrings > 1 ? "s" : ""} × ~${stringing.panelsPerString}`,
          ]}
        />
        <Connector x1={xs[0] + blockW} y1={y + blockH / 2} x2={xs[1]} y2={y + blockH / 2} label={`${stringing.totalDcCurrent} A DC`} />

        <Block
          x={xs[1]} y={y} w={blockW} h={blockH} title="DC COMBINER / DISCONNECT"
          lines={[`${stringing.numStrings} string input${stringing.numStrings > 1 ? "s" : ""}`, `~${stringing.stringVoltage} V per string`]}
        />
        <Connector x1={xs[1] + blockW} y1={y + blockH / 2} x2={xs[2]} y2={y + blockH / 2} />

        <Block
          x={xs[2]} y={y} w={blockW} h={blockH} title={inverterCount > 1 ? `INVERTERS (×${inverterCount})` : "INVERTER"}
          lines={[`${perInverterKw} kW each`, `DC:AC ratio ${dcAcRatio}`]}
        />
        <Connector x1={xs[2] + blockW} y1={y + blockH / 2} x2={xs[3]} y2={y + blockH / 2} label={`${acCurrentTotal} A AC`} />

        <Block
          x={xs[3]} y={y} w={blockW} h={blockH} title="AC DISCONNECT"
          lines={[acService.label, `${breakerSize} A breaker`]}
        />
        <Connector x1={xs[3] + blockW} y1={y + blockH / 2} x2={xs[4]} y2={y + blockH / 2} />

        <Block
          x={xs[4]} y={y} w={blockW} h={blockH} title="UTILITY METER / GRID"
          lines={["Main service panel", "Net metering"]}
        />
      </svg>

      <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 10 }}>
        ⚠️ Preliminary sizing based on a generic {stringing.panelWatts}W module (Vmp {DEFAULT_PANEL_VMP}V, Imp {DEFAULT_PANEL_IMP}A) and a ~1.2 DC:AC inverter ratio. Substitute the selected panel/inverter datasheets for a final, stamped SLD.
      </div>

      {stringing.stringSizes.length > 1 && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "#374151" }}>
          <strong>String breakdown:</strong> {stringing.stringSizes.map((n, i) => `S${i + 1}: ${n} panels`).join("  ·  ")}
          {inverterCount > 1 && <> — distributed across {inverterCount} inverters (~{stringsPerInverter} strings each)</>}
        </div>
      )}
    </div>
  );
}
```

# FILE: src\components\SolarArray.jsx

```js
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
```

# FILE: src\components\Toolbar.jsx

```js
export default function Toolbar({
  isManualDraw,
  polygon,
  onClear,
  onEnableManual,
  onView3D,
  buildingHeight,
  onHeightChange,
}) {
  const pointCount = polygon?.length || 0;
  const isClosed = pointCount >= 3;

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-section">
          <span className="toolbar-label">Roof Polygon</span>
          <div className="toolbar-actions">
            {!isManualDraw && (
              <button
                className="toolbar-btn secondary"
                onClick={onEnableManual}
                title="Switch to manual drawing mode"
              >
                ✏️ Draw Manually
              </button>
            )}
            {isManualDraw && (
              <span className="manual-badge">✏️ Manual Mode</span>
            )}
            {pointCount > 0 && (
              <button
                className="toolbar-btn danger"
                onClick={onClear}
                title="Clear all polygon points"
              >
                🗑 Clear
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <span className="toolbar-label">
            Building Height: <strong>{buildingHeight}m</strong>
          </span>
          <div className="slider-wrapper">
            <span className="slider-min">3m</span>
            <input
              type="range"
              min={3}
              max={15}
              step={0.5}
              value={buildingHeight}
              onChange={(e) => onHeightChange(parseFloat(e.target.value))}
              className="height-slider"
            />
            <span className="slider-max">15m</span>
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        <div className="polygon-stats">
          <span className={`stat-badge ${isClosed ? "good" : "warn"}`}>
            {isClosed ? `✅ ${pointCount} pts` : pointCount > 0 ? `⚠️ ${pointCount} pts` : "⭕ No polygon"}
          </span>
        </div>
        <button
          className={`toolbar-btn primary ${!isClosed ? "disabled" : ""}`}
          onClick={onView3D}
          disabled={!isClosed}
          title={!isClosed ? "Add at least 3 points to continue" : "View 3D building"}
        >
          🏗 View 3D Building →
        </button>
      </div>
    </div>
  );
}
```

# FILE: src\hooks\useGoogleMaps.js

```js
import { useState, useEffect, useRef, useCallback } from "react";
import { loadGoogleMapsScript, initMap, addMarker, removeMarker } from "../services/mapsService";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function useGoogleMaps({ mapContainerRef, searchInputRef, onLocationSelect }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const placeMarker = useCallback((latLng, address = "") => {
    if (!mapRef.current) return;
    removeMarker(markerRef.current);
    const position = {
      lat: typeof latLng.lat === "function" ? latLng.lat() : latLng.lat,
      lng: typeof latLng.lng === "function" ? latLng.lng() : latLng.lng,
    };
    markerRef.current = addMarker(mapRef.current, position);
    if (onLocationSelect) {
      onLocationSelect({ ...position, address });
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapContainerRef?.current) return;

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        const defaultCenter = { lat: 28.6139, lng: 77.2090 };
        mapRef.current = initMap(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 18,
        });

        mapRef.current.addListener("dblclick", (e) => {
          e.stop();
          placeMarker(e.latLng);
        });

        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Google Maps failed to load:", err);
        setError("Failed to load Google Maps. Check your API key.");
      });

    return () => {
      removeMarker(markerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !searchInputRef?.current || !mapRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      types: ["geocode", "establishment"],
    });

    autocomplete.bindTo("bounds", mapRef.current);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      if (place.geometry.viewport) {
        mapRef.current.fitBounds(place.geometry.viewport);
      } else {
        mapRef.current.setCenter(place.geometry.location);
        mapRef.current.setZoom(20);
      }

      setTimeout(() => {
        mapRef.current.setZoom(20);
        mapRef.current.setMapTypeId("satellite");
      }, 300);

      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || "",
      };

      placeMarker(position, position.address);
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded, searchInputRef, placeMarker]);

  const panTo = useCallback((lat, lng, zoom = 20) => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(zoom);
  }, []);

  const clearMarker = useCallback(() => {
    removeMarker(markerRef.current);
    markerRef.current = null;
  }, []);

  return { isLoaded, error, map: mapRef.current, panTo, clearMarker, placeMarker };
}
```

# FILE: src\index.css

```js
:root {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;
  --accent: #aa3bff;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --accent-border: rgba(170, 59, 255, 0.5);
  --social-bg: rgba(244, 243, 236, 0.5);
  --shadow:
    rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color-scheme: light dark;
  color: var(--text);
  background: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #9ca3af;
    --text-h: #f3f4f6;
    --bg: #16171d;
    --border: #2e303a;
    --code-bg: #1f2028;
    --accent: #c084fc;
    --accent-bg: rgba(192, 132, 252, 0.15);
    --accent-border: rgba(192, 132, 252, 0.5);
    --social-bg: rgba(47, 48, 58, 0.5);
    --shadow:
      rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
  }

  #social .button-icon {
    filter: invert(1) brightness(2);
  }
}

body {
  margin: 0;
}

#root {
  width: 1126px;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  border-inline: 1px solid var(--border);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}

h1 {
  font-size: 56px;
  letter-spacing: -1.68px;
  margin: 32px 0;
  @media (max-width: 1024px) {
    font-size: 36px;
    margin: 20px 0;
  }
}
h2 {
  font-size: 24px;
  line-height: 118%;
  letter-spacing: -0.24px;
  margin: 0 0 8px;
  @media (max-width: 1024px) {
    font-size: 20px;
  }
}
p {
  margin: 0;
}

code,
.counter {
  font-family: var(--mono);
  display: inline-flex;
  border-radius: 4px;
  color: var(--text-h);
}

code {
  font-size: 15px;
  line-height: 135%;
  padding: 4px 8px;
  background: var(--code-bg);
}

```

# FILE: src\main.jsx

```js
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

# FILE: src\services\mapsService.js

```js
export const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google.maps));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const initMap = (container, options = {}) => {
  const defaultOptions = {
    zoom: 20,
    mapTypeId: "satellite",
    tilt: 0,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    rotateControl: false,
  };
  return new window.google.maps.Map(container, { ...defaultOptions, ...options });
};

export const initAutocomplete = (inputElement, map, onPlaceSelected) => {
  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
    types: ["geocode", "establishment"],
  });

  autocomplete.bindTo("bounds", map);

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) return;

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(20);
    }

    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address || place.name || "",
    };

    onPlaceSelected(location);
  });

  return autocomplete;
};

export const addMarker = (map, position, options = {}) => {
  const marker = new window.google.maps.Marker({
    position,
    map,
    animation: window.google.maps.Animation.DROP,
    ...options,
  });
  return marker;
};

export const removeMarker = (marker) => {
  if (marker) marker.setMap(null);
};
```

# FILE: src\services\solarService.js

```js
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
```

# FILE: src\styles\app.css

```js
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --bg-card: #16213e;
  --bg-elevated: #1e2a45;
  --accent: #fbbf24;
  --accent-hover: #f59e0b;
  --accent-dim: rgba(251, 191, 36, 0.15);
  --green: #22c55e;
  --red: #ef4444;
  --blue: #3b82f6;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(251, 191, 36, 0.3);
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --radius: 10px;
  --radius-sm: 6px;
  --radius-lg: 14px;
}

html, body, #root {
  height: 100%;
  width: 100%;
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

/* ─── APP CONTAINER ─────────────────────────────────────── */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* ─── MAP SCREEN ─────────────────────────────────────────── */
.map-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-container {
  flex: 1;
  width: 100%;
  height: calc(100vh - 56px);
  min-height: 400px;
}

/* ─── SEARCH BAR ─────────────────────────────────────────── */
.search-bar-container {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 50px;
  padding: 10px 18px;
  width: min(520px, 90vw);
  box-shadow: var(--shadow);
  gap: 10px;
  backdrop-filter: blur(12px);
}

.search-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'Inter', sans-serif;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-loading {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ─── MAP ERROR ──────────────────────────────────────────── */
.map-error-banner {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 13px;
  backdrop-filter: blur(8px);
}

/* ─── MAP INSTRUCTIONS ───────────────────────────────────── */
.map-instructions {
  position: absolute;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(15, 15, 26, 0.85);
  border: 1px solid var(--border);
  border-radius: 50px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  backdrop-filter: blur(8px);
  white-space: nowrap;
}

.separator {
  color: var(--text-muted);
}

/* ─── LOCATION PANEL ─────────────────────────────────────── */
.location-panel {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-width: min(480px, 90vw);
  box-shadow: var(--shadow), 0 0 0 1px var(--accent-dim);
  backdrop-filter: blur(12px);
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.location-info span {
  font-size: 13px;
  color: var(--text-secondary);
}

.address-text {
  font-size: 12px !important;
  color: var(--text-muted) !important;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.open-editor-btn {
  background: var(--accent);
  color: #0f0f1a;
  border: none;
  border-radius: var(--radius);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, transform 0.1s;
  font-family: 'Inter', sans-serif;
}

.open-editor-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.open-editor-btn:active {
  transform: translateY(0);
}

/* ─── ROOF EDITOR ────────────────────────────────────────── */
.roof-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--bg-primary);
}

.roof-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.editor-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.editor-address {
  font-size: 11px;
  color: var(--text-muted);
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-coords {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}

/* ─── BACK BUTTON ────────────────────────────────────────── */
.back-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.back-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.back-btn.secondary {
  font-size: 12px;
  padding: 6px 12px;
}

/* ─── ERROR BANNER ───────────────────────────────────────── */
.editor-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 13px;
  flex-shrink: 0;
}

.editor-error-banner button {
  background: transparent;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
}

/* ─── LOADING SCREEN ─────────────────────────────────────── */
.loading-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── DRAW SCREEN ────────────────────────────────────────── */
.draw-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.draw-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ─── SECTIONS PANEL ─────────────────────────────────────── */
.sections-panel {
  width: 220px;
  min-width: 220px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.sections-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sections-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-section-btn {
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  color: var(--accent);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
}

.add-section-btn:hover {
  background: rgba(251, 191, 36, 0.25);
}

.sections-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── SECTION CARD ───────────────────────────────────────── */
.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 11px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.section-card:hover {
  border-color: rgba(251, 191, 36, 0.2);
  background: var(--bg-elevated);
}

.section-card.active {
  border-color: var(--accent);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 1px var(--accent-dim);
}

.section-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.section-label-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  width: 100%;
  cursor: text;
}

.section-label-input:focus {
  color: var(--accent);
}

.remove-section-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.remove-section-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

/* ─── ELEVATION INPUT ────────────────────────────────────── */
.section-elevation-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.section-elevation-row label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.elevation-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
}

.elevation-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  width: 38px;
  text-align: right;
}

.elevation-input::-webkit-inner-spin-button,
.elevation-input::-webkit-outer-spin-button {
  opacity: 0.4;
}

.elevation-unit {
  font-size: 11px;
  color: var(--text-muted);
}

/* ─── SECTION STATUS BADGE ───────────────────────────────── */
.section-status {
  display: flex;
}

.section-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.section-badge.done {
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.section-badge.partial {
  background: rgba(251, 191, 36, 0.1);
  color: var(--accent);
  border: 1px solid var(--border-accent);
}

.section-badge.empty {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

/* ─── SECTIONS PANEL FOOTER ──────────────────────────────── */
.sections-panel-footer {
  padding: 12px 10px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.view3d-btn {
  width: 100%;
  background: var(--accent);
  color: #0f0f1a;
  border: none;
  border-radius: var(--radius-sm);
  padding: 9px 0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.2s, transform 0.1s;
}

.view3d-btn:hover:not(.disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.view3d-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── DRAW CANVAS AREA ───────────────────────────────────── */
.draw-canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ─── TOOLBAR ────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.toolbar-label strong {
  color: var(--accent);
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  border: none;
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}

.toolbar-btn.primary {
  background: var(--accent);
  color: #0f0f1a;
}

.toolbar-btn.primary:hover:not(.disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.toolbar-btn.primary.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.toolbar-btn.secondary:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.toolbar-btn.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.toolbar-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.manual-badge {
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
}

/* ─── SLIDER ─────────────────────────────────────────────── */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-min,
.slider-max {
  font-size: 11px;
  color: var(--text-muted);
}

.height-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 120px;
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.height-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.height-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.height-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

/* ─── POLYGON STATS ──────────────────────────────────────── */
.polygon-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.stat-badge.good {
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.stat-badge.warn {
  background: rgba(251, 191, 36, 0.1);
  color: var(--accent);
  border: 1px solid var(--border-accent);
}

/* ─── DRAWER MODE BAR ────────────────────────────────────── */
.drawer-mode-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.mode-label {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.mode-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 5px 12px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.mode-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.mode-btn.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.mode-btn.danger {
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.mode-btn.danger:hover,
.mode-btn.active.danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
}

.mode-hint {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
  flex: 1;
}

.ml-auto {
  margin-left: auto;
}

/* ─── POLYGON DRAWER ─────────────────────────────────────── */
.polygon-drawer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.drawer-canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}

.drawer-canvas {
  background: #12121f;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.drawer-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
}

.status-badge.closed {
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.open {
  background: rgba(251, 191, 36, 0.1);
  color: var(--accent);
  border: 1px solid var(--border-accent);
}

.snap-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.clear-canvas-btn {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
}

.clear-canvas-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* ─── VIEWER SCREEN ──────────────────────────────────────── */
.viewer-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.height-control-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.height-control-inline label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.height-control-inline label strong {
  color: var(--accent);
}

/* ─── SECTIONS SUMMARY BADGES ────────────────────────────── */
.sections-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.section-summary-badge {
  font-size: 11px;
  padding: 3px 9px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  color: var(--accent);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

/* ─── BUILDING VIEWER ────────────────────────────────────── */
.building-viewer {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.building-viewer canvas {
  width: 100% !important;
  height: 100% !important;
}

.viewer-overlay-hints {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(15, 15, 26, 0.8);
  border: 1px solid var(--border);
  border-radius: 50px;
  padding: 6px 18px;
  font-size: 11px;
  color: var(--text-muted);
  backdrop-filter: blur(8px);
  pointer-events: none;
  white-space: nowrap;
}

.viewer-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
}

/* ─── GOOGLE MAPS AUTOCOMPLETE ───────────────────────────── */
.pac-container {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius) !important;
  box-shadow: var(--shadow) !important;
  margin-top: 6px;
  font-family: 'Inter', sans-serif !important;
}

.pac-item {
  padding: 8px 16px !important;
  color: var(--text-secondary) !important;
  border-top: 1px solid var(--border) !important;
  font-size: 13px !important;
  cursor: pointer;
}

.pac-item:hover,
.pac-item-selected {
  background: var(--bg-elevated) !important;
  color: var(--text-primary) !important;
}

.pac-item-query {
  color: var(--text-primary) !important;
  font-size: 13px !important;
}

.pac-icon {
  display: none !important;
}

/* ─── SCROLLBAR ──────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

/* ─── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .draw-layout {
    flex-direction: column;
  }

  .sections-panel {
    width: 100%;
    min-width: unset;
    height: auto;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .sections-list {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding: 8px;
  }

  .section-card {
    min-width: 160px;
  }

  .sections-panel-footer {
    padding: 8px;
  }

  .view3d-btn {
    padding: 7px 0;
  }
}

@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }

  .location-panel {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .open-editor-btn {
    width: 100%;
    text-align: center;
  }

  .map-instructions {
    display: none;
  }

  .viewer-overlay-hints {
    gap: 10px;
    font-size: 10px;
    padding: 5px 12px;
  }

  .viewer-controls-bar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .sections-summary {
    display: none;
  }
}



/* ─── Solar Control Panel ────────────────────────────────────────────────────
   Overlay in top-left of the 3D viewer.
   Add this to the bottom of src/styles/app.css
   ─────────────────────────────────────────────────────────────────────────── */

.solar-control-panel {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  background: rgba(15, 15, 26, 0.92);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  min-width: 190px;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  backdrop-filter: blur(8px);
  pointer-events: all;
}

.scp-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.scp-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scp-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
}

.scp-stat-row strong {
  color: var(--text-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.scp-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scp-btn {
  width: 100%;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  font-family: 'Inter', sans-serif;
}

.scp-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.scp-btn-add {
  background: var(--accent);
  color: #fff;
}
.scp-btn-add:hover:not(:disabled) {
  background: var(--accent-hover, #3b82f6);
}

.scp-btn-remove {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.scp-btn-remove:hover {
  background: rgba(239, 68, 68, 0.35);
}

.scp-btn-deselect {
  background: var(--bg-elevated, #2a2a3e);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.scp-btn-deselect:hover {
  background: var(--bg-hover, #333350);
}

.scp-hint {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  padding-top: 2px;
}

.scp-hint code {
  font-size: 10px;
  background: var(--bg-elevated, #2a2a3e);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--accent);
}

/* ─── Building height input in viewer bar ─────────────────────────────────── */
.height-number-input {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  width: 52px;
  text-align: right;
  padding: 2px 4px;
  font-family: 'Inter', sans-serif;
}
.height-number-input:focus {
  outline: none;
  border-color: var(--accent);
}

/* ─── Building height row in sections panel ───────────────────────────────── */
.building-height-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  gap: 8px;
}

.building-height-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ─── Solar summary in sections panel ────────────────────────────────────── */
.solar-summary {
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.solar-summary-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 2px;
}

.solar-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.solar-summary-row strong {
  color: var(--text-primary);
  font-weight: 600;
}

/* ─── Viewer solar badge ──────────────────────────────────────────────────── */
.viewer-solar-badge {
  font-size: 11px;
  color: var(--accent);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  white-space: nowrap;
}

/* 3D Dimension Labels */
.dimension-label {
  background: rgba(15, 15, 26, 0.85);
  color: #6ee7b7;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
  border: 1px solid rgba(110, 231, 183, 0.3);
  pointer-events: none; /* Prevents the label from blocking clicks on the roof */
  user-select: none;
  white-space: nowrap;
  backdrop-filter: blur(2px);
  transform: translate3d(0,0,0); /* Hardware acceleration */
}
```

# FILE: src\utils\buildingUtils.js

```js
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
```

# FILE: src\utils\collisionUtils.js

```js
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
```

# FILE: src\utils\heatmapUtils.js

```js
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
```

# FILE: src\utils\heightUtils.js

```js
import { fromArrayBuffer } from "geotiff";

export async function fetchExactBuildingHeight(dsmUrl, demUrl, apiKey) {
  try {
    console.log("📏 [Height Engine] Starting LiDAR extraction...");
    
    const [dsmRes, demRes] = await Promise.all([
      fetch(`${dsmUrl}&key=${apiKey}`),
      fetch(`${demUrl}&key=${apiKey}`)
    ]);

    if (!dsmRes.ok || !demRes.ok) {
      console.warn("📏 [Height Engine] API rejected the GeoTIFF request.");
      return null;
    }

    const [dsmBuffer, demBuffer] = await Promise.all([
      dsmRes.arrayBuffer(),
      demRes.arrayBuffer()
    ]);

    const dsmTiff = await fromArrayBuffer(dsmBuffer);
    const demTiff = await fromArrayBuffer(demBuffer);
    
    const dsmImage = await dsmTiff.getImage();
    const demImage = await demTiff.getImage();

    const dsmData = (await dsmImage.readRasters())[0];
    const demData = (await demImage.readRasters())[0];

    const width = dsmImage.getWidth();
    const height = dsmImage.getHeight();
    
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    // Google Solar API is usually ~0.1 meters per pixel.
    // To scan a 5x5 meter area in the center of our click, we scan a 50x50 pixel box.
    const scanRadius = 25; 
    
    let maxRoofElevation = -Infinity;
    let groundElevationAtMax = 0;
    let validPixelsFound = 0;

    // Scan a grid around the center to find the absolute highest point of the roof
    for (let y = centerY - scanRadius; y <= centerY + scanRadius; y++) {
      for (let x = centerX - scanRadius; x <= centerX + scanRadius; x++) {
        // Ensure we don't go out of bounds
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const index = (y * width) + x;
        const roofZ = dsmData[index];
        const groundZ = demData[index];

        if (roofZ !== -9999 && groundZ !== -9999) {
          validPixelsFound++;
          if (roofZ > maxRoofElevation) {
            maxRoofElevation = roofZ;
            groundElevationAtMax = groundZ;
          }
        }
      }
    }

    if (validPixelsFound === 0 || maxRoofElevation === -Infinity) {
      console.warn("📏 [Height Engine] No valid LiDAR data found in the scanned area.");
      return null;
    }

    const buildingHeightMeters = maxRoofElevation - groundElevationAtMax;
    console.log(`📏 [Height Engine] SUCCESS! Max Roof: ${maxRoofElevation.toFixed(2)}m, Ground: ${groundElevationAtMax.toFixed(2)}m`);
    console.log(`📏 [Height Engine] Final Calculated Height: ${buildingHeightMeters.toFixed(2)}m`);

    if (buildingHeightMeters < 2.5 || buildingHeightMeters > 150) {
      console.warn(`📏 [Height Engine] Height (${buildingHeightMeters.toFixed(2)}m) seems unrealistic. Falling back to default.`);
      return null;
    }

    return Number(buildingHeightMeters.toFixed(2));
  } catch (error) {
    console.error("📏 [Height Engine] Fatal error during extraction:", error);
    return null;
  }
}
```

# FILE: src\utils\polygonUtils.js

```js
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


```

# FILE: src\utils\reportUtils.js

```js
// FILE: src/utils/reportUtils.js
/**
 * reportUtils.js
 *
 * Pure calculation + formatting helpers for the Solar Project Report.
 * Nothing in this file touches React or the DOM — it only takes the
 * existing app state (solarUnits, obstacles, solarData, roofSections)
 * and derives the extra numbers/structures the report needs.
 */

import { PIXELS_TO_WORLD } from "./scaleUtils";

// ─── Defaults (all editable by the user inside the report) ────────────────────

export const DEFAULT_PANEL_WATTS = 400;          // W per panel
export const DEFAULT_SYSTEM_EFFICIENCY = 0.86;    // derate factor — see computeDerateBreakdown() for the itemized basis
export const DEFAULT_COST_PER_WATT = 0.75;        // $ per installed watt (DC)
export const DEFAULT_ELECTRICITY_RATE = 0.12;     // $ per kWh
export const DEFAULT_INCENTIVE_PCT = 30;          // % of gross system cost
export const DEFAULT_LIFETIME_YEARS = 25;

const CO2_KG_PER_TREE_PER_YEAR = 21;
const CO2_KG_PER_KM_DRIVEN = 0.12;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Coordinate helpers ─────────────────────────────────────────────────────

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

// ─── Sun-hours accuracy ─────────────────────────────────────────────────────

/**
 * Area-weighted average sunshine hours across every roof segment the Solar
 * API returned, instead of blindly using "maxSunshineHoursPerYear" (the
 * single BEST-facing segment). Using the max overstates production whenever
 * the actual array includes panels on less-optimal-facing roof planes, so
 * this is a materially more accurate basis for the annual estimate.
 */
export function computeWeightedSunshineHours(solarData) {
  const segs = solarData?.roofSegments;
  if (!segs || !segs.length) return solarData?.maxSunshineHoursPerYear ?? 1600;
  const totalArea = segs.reduce((a, s) => a + (s.areaMeters2 || 0), 0);
  if (!totalArea) return solarData?.maxSunshineHoursPerYear ?? 1600;
  return segs.reduce((a, s) => a + (s.areaMeters2 || 0) * (s.sunshineHoursPerYear || 0), 0) / totalArea;
}

/**
 * Itemized loss/derate breakdown so the production estimate is auditable
 * instead of hiding behind one opaque "efficiency" number. The combined
 * value approximates DEFAULT_SYSTEM_EFFICIENCY and is shown in the report
 * as the basis for that editable field.
 */
export function computeDerateBreakdown({ obstacles = [], totalPanels = 0 } = {}) {
  const inverterEff = 0.97;
  const wiringLoss = 0.98;
  const soilingLoss = 0.98;
  const mismatchLoss = 0.99;
  const tempDerate = 0.93; // annualized average cell-temperature loss

  const shadingLoss = totalPanels > 0
    ? Math.max(0.90, 1 - (obstacles.length * 0.5) / Math.max(totalPanels, 1))
    : 1;

  const combined = inverterEff * wiringLoss * soilingLoss * mismatchLoss * tempDerate * shadingLoss;

  return {
    inverterEff, wiringLoss, soilingLoss, mismatchLoss, tempDerate, shadingLoss,
    combined: +combined.toFixed(4),
  };
}

// ─── System sizing ──────────────────────────────────────────────────────────

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

// ─── Financials ─────────────────────────────────────────────────────────────

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
    annualSavingsUsd,
    grossSystemCostUsd,
    incentiveUsd,
    netSystemCostUsd,
    paybackYears,
    lifetimeYears,
    lifetimeSavingsUsd,
    monthlySavingsUsd,
  };
}

// ─── Monthly production estimate ───────────────────────────────────────────

export function estimateMonthlyProduction(annualKwh, lat = 20) {
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

// ─── Environmental equivalents ──────────────────────────────────────────────

export function computeEnvironmentalEquivalents(carbonOffsetKg) {
  return {
    treesPlanted: Math.round((carbonOffsetKg || 0) / CO2_KG_PER_TREE_PER_YEAR),
    kmNotDriven: Math.round((carbonOffsetKg || 0) / CO2_KG_PER_KM_DRIVEN),
  };
}

// ─── Roof segment analysis ──────────────────────────────────────────────────

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

// ─── Obstacles summary ──────────────────────────────────────────────────────

const OBSTACLE_LABELS = {
  ac_unit: "AC Unit",
  water_tank: "Water Tank",
  tree: "Tree",
};

export function summarizeObstacles(obstacles = []) {
  const counts = {};
  obstacles.forEach((o) => {
    const key = o.type || "other";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([type, count]) => ({
    type,
    label: OBSTACLE_LABELS[type] || type,
    count,
  }));
}

// ─── Electrical single-line diagram (SLD) sizing ───────────────────────────
//
// These sizing helpers use representative electrical characteristics for a
// generic ~400W monocrystalline module and common string-inverter voltage
// windows. They produce a preliminary, code-informed single-line diagram —
// substitute the actual selected panel/inverter datasheets before this is
// used for permitting or construction.

export const DEFAULT_PANEL_VOC = 41.0;   // V, open-circuit voltage per panel
export const DEFAULT_PANEL_VMP = 34.5;   // V, voltage at max power
export const DEFAULT_PANEL_ISC = 12.4;   // A, short-circuit current
export const DEFAULT_PANEL_IMP = 11.6;   // A, current at max power

const INVERTER_MAX_STRING_VOLTAGE = 600; // V, common 600V-class string-inverter window
const INVERTER_MIN_STRING_VOLTAGE = 200; // V, minimum MPPT start voltage
const COLD_TEMP_VOC_MULTIPLIER = 1.15;   // safety margin for cold-weather Voc rise

const STANDARD_INVERTER_SIZES_KW = [3, 3.8, 5, 6, 7.6, 10, 11.4, 15, 20, 25, 30, 36, 40, 50, 60, 75, 100, 125, 150];
const STANDARD_BREAKER_SIZES_A = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400];

function roundUpToStandard(value, table) {
  for (const t of table) if (t >= value) return t;
  return table[table.length - 1];
}

/** Splits the total panel count into strings that respect the inverter's MPPT voltage window. */
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

/**
 * Full electrical design used to draw the single-line diagram: stringing
 * plan, inverter sizing/count, AC output current, and recommended breaker
 * size. This is a preliminary, code-informed sizing exercise, not a stamped
 * design — a licensed electrical designer must finalize it.
 */
export function computeElectricalDesign({ totalPanels, totalCapacityKw, panelWatts = DEFAULT_PANEL_WATTS }) {
  const stringing = computeStringingPlan(totalPanels, { panelWatts });

  if (!totalPanels || !totalCapacityKw) {
    return null;
  }

  const targetInverterKw = totalCapacityKw / 1.2; // ~1.2 DC:AC ratio design point
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
    stringing,
    inverterCount,
    perInverterKw,
    totalInverterKw,
    stringsPerInverter,
    acService,
    acCurrentTotal: +acCurrentTotal.toFixed(1),
    breakerSize,
    dcAcRatio: totalInverterKw > 0 ? +(totalCapacityKw / totalInverterKw).toFixed(2) : null,
  };
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

export function formatCurrency(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString()}`;
}

// Add this to the BOTTOM of src/utils/reportUtils.js

/**
 * Generates a Month-by-Month Shadow Analysis Profile.
 * Uses a geometric heuristic: checks obstacle height and distance against 
 * average monthly sun elevation for the given latitude.
 */
export function generateShadowProfile(solarUnits = [], obstacles = [], lat = 20) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  if (!obstacles.length || !solarUnits.length) {
    return months.map(month => ({ month, shadingPct: 0 }));
  }

  return months.map((month, i) => {
    // 1. Calculate average sun elevation for this month
    const declination = 23.45 * Math.sin((360 / 365) * (284 + (i * 30)) * (Math.PI / 180));
    const avgElevation = 90 - Math.abs(lat - declination);
    const tanElevation = Math.tan(avgElevation * (Math.PI / 180));

    let totalShadingSeverity = 0;

    // 2. Check every panel against every obstacle
    solarUnits.forEach(unit => {
      obstacles.forEach(obs => {
        const dx = unit.position[0] - obs.position[0];
        const dz = unit.position[2] - obs.position[2];
        const distanceWorld = Math.sqrt(dx * dx + dz * dz);
        
        // Approximate height difference
        const obsHeight = obs.dimensions?.h || 1.5; 
        const shadowLength = obsHeight / Math.max(0.1, tanElevation);
        
        // If the panel is inside the shadow cast distance, calculate severity
        if (distanceWorld < shadowLength) {
           const severity = 1 - (distanceWorld / shadowLength);
           totalShadingSeverity += severity;
        }
      });
    });

    // 3. Normalize to a percentage (0% to 100%)
    const rawPct = (totalShadingSeverity / solarUnits.length) * 100;
    // Cap at reasonable limits (e.g. max 45% shading for realism unless heavily blocked)
    const finalPct = Math.min(Math.round(rawPct), 45); 

    return { month, shadingPct: finalPct };
  });
}
```

# FILE: src\utils\scaleUtils.js

```js
/**
 * scaleUtils.js
 *
 * Single source of truth for the coordinate-system bridge between:
 *   • Canvas pixels  (polygon drawing space, 700 × 500 px)
 *   • Real-world metres  (Solar API, building heights, panel dimensions)
 *   • Three.js world units  (the 3-D scene)
 *
 * Design rule: ONE conversion constant drives every spatial measurement
 * in the scene.  Nothing else may use a bare `* 0.1` or `* 0.012`.
 *
 * ─── Derivation ───────────────────────────────────────────────────────────
 *
 *  Google Maps zoom-20 satellite tile resolution (metres per pixel) at the
 *  equator is 0.149 m/px.  It scales with latitude:
 *
 *    metersPerPixel(lat, zoom) = (156543.03392 · cos(lat · π/180)) / 2^zoom
 *
 *  We render canvas pixels into Three.js world units with a fixed pixel→world
 *  scale (PIXELS_TO_WORLD = 0.012).  Therefore:
 *
 *    1 world unit = (1 / PIXELS_TO_WORLD) pixels
 *                 = (1 / 0.012) · metersPerPixel(lat, zoom)  metres
 *
 *    metersPerWorldUnit = metersPerPixel(lat, zoom) / PIXELS_TO_WORLD
 *
 *  At lat=28° (New Delhi), zoom=20:
 *    metersPerPixel ≈ 0.139 m/px
 *    metersPerWorldUnit ≈ 0.139 / 0.012 ≈ 11.6 m / world-unit
 *
 *  Consequence: to place a 6-metre-tall building wall we compute
 *    6 / 11.6 ≈ 0.517 world units   (not 6 * 0.1 = 0.6 — old wrong value)
 *
 * ─── Usage ────────────────────────────────────────────────────────────────
 *
 *  import { computeSceneScale, metersToWorld, worldToMeters } from './scaleUtils';
 *
 *  // Once, when location is known:
 *  const { mpu, pixelsToWorld } = computeSceneScale(location.lat);
 *
 *  // Then everywhere:
 *  const wallWorldHeight = metersToWorld(buildingHeightMeters, mpu);
 *  const panelWorldWidth = metersToWorld(1.0, mpu);   // 1-metre panel
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pixel-to-world-unit ratio used throughout the canvas→Three.js pipeline.
 *  Must match SCALE in Building3DViewer.jsx and polygonUtils.js. */
export const PIXELS_TO_WORLD = 0.012;

/** Google Maps zoom level at which the satellite tile is captured. */
export const SATELLITE_ZOOM = 20;

/** Canvas dimensions that the RoofPolygonDrawer uses. */
export const CANVAS_WIDTH  = 700;
export const CANVAS_HEIGHT = 500;

// ─── Core derivation ─────────────────────────────────────────────────────────

/**
 * Ground resolution in metres per pixel for a given latitude and zoom level.
 *
 * Formula: https://wiki.openstreetmap.org/wiki/Zoom_levels
 *   resolution = (156543.03392 * cos(lat_rad)) / 2^zoom
 *
 * @param {number} lat   Geographic latitude in decimal degrees.
 * @param {number} zoom  Map zoom level (default: 20).
 * @returns {number}  Metres covered by one canvas pixel.
 */
export function computeMetersPerPixel(lat, zoom = SATELLITE_ZOOM) {
  const latRad = (lat * Math.PI) / 180;
  return (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
}

/**
 * Metres covered by one Three.js world unit for a given location.
 *
 * @param {number} lat             Geographic latitude in decimal degrees.
 * @param {number} zoom            Map zoom level (default: 20).
 * @param {number} pixelsToWorld   Pixel→world multiplier (default: PIXELS_TO_WORLD).
 * @returns {number}  Real-world metres per world unit.
 */
export function computeMetersPerWorldUnit(
  lat,
  zoom = SATELLITE_ZOOM,
  pixelsToWorld = PIXELS_TO_WORLD,
) {
  const mpp = computeMetersPerPixel(lat, zoom);
  return mpp / pixelsToWorld;
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Convert a real-world measurement in metres to Three.js world units.
 *
 * @param {number} meters            Real-world distance in metres.
 * @param {number} metersPerWorldUnit  Output of computeMetersPerWorldUnit().
 * @returns {number}  Three.js world-unit distance.
 */
export function metersToWorld(meters, metersPerWorldUnit) {
  return meters / metersPerWorldUnit;
}

/**
 * Convert a Three.js world-unit distance back to real-world metres.
 *
 * @param {number} worldUnits        Distance in Three.js world units.
 * @param {number} metersPerWorldUnit  Output of computeMetersPerWorldUnit().
 * @returns {number}  Real-world distance in metres.
 */
export function worldToMeters(worldUnits, metersPerWorldUnit) {
  return worldUnits * metersPerWorldUnit;
}

// ─── Convenience bundle ───────────────────────────────────────────────────────

/**
 * Compute and return all scene-scale constants in one call.
 *
 * Call this once when the user's location is known and pass the result
 * (or just `mpu`) down to every component that needs to place geometry.
 *
 * @param {number} lat   Geographic latitude in decimal degrees.
 * @param {number} zoom  Map zoom level (default: 20).
 * @returns {{
 *   mpu: number,               // metres per Three.js world unit
 *   mpp: number,               // metres per canvas pixel
 *   pixelsToWorld: number,     // PIXELS_TO_WORLD constant (for reference)
 *   canvasWidthM: number,      // real-world width the canvas covers (metres)
 *   canvasHeightM: number,     // real-world height the canvas covers (metres)
 *   groundWidthWorld: number,  // ground plane width in world units
 *   groundHeightWorld: number, // ground plane height in world units
 * }}
 */
export function computeSceneScale(lat, zoom = SATELLITE_ZOOM) {
  const mpp = computeMetersPerPixel(lat, zoom);
  const mpu = computeMetersPerWorldUnit(lat, zoom, PIXELS_TO_WORLD);

  return {
    mpu,
    mpp,
    pixelsToWorld: PIXELS_TO_WORLD,
    canvasWidthM:      CANVAS_WIDTH  * mpp,
    canvasHeightM:     CANVAS_HEIGHT * mpp,
    groundWidthWorld:  CANVAS_WIDTH  * PIXELS_TO_WORLD,  // 8.4 world units
    groundHeightWorld: CANVAS_HEIGHT * PIXELS_TO_WORLD,  // 6.0 world units
  };
}

// ─── Solar panel defaults (real-world, in metres) ─────────────────────────────

/** Standard residential/commercial solar panel dimensions. */
export const PANEL_WIDTH_M  = 1.0;   // metres (narrow edge, horizontal on frame)
export const PANEL_HEIGHT_M = 1.7;   // metres (long edge, along tilt direction)

/** Gap between adjacent panels in the array. */
export const PANEL_GAP_M = 0.05;     // metres

/** Default tilt angle of panels from the roof surface. */
export const PANEL_TILT_DEG = 12;    // degrees

/** Height of the support pillar bases above the roof surface. */
export const MOUNT_HEIGHT_M = 0.30;  // metres

/** Rail cross-section (square tube). */
export const RAIL_THICKNESS_M = 0.05; // metres

/** Parapet wall height above roof surface. */
export const PARAPET_HEIGHT_M = 0.5; // metres

/** Parapet wall thickness. */
export const PARAPET_THICKNESS_M = 0.15; // metres
```

# FILE: src\utils\sunUtils.js

```js
/**
 * Calculates the exact Sun Position (Elevation and Azimuth) 
 * based on standard astronomical algorithms (similar to NOAA's calculations).
 * * @param {number} month - Month of the year (1-12)
 * @param {number} hour - Hour of the day (0-23.99)
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lng - Longitude in decimal degrees
 * @returns {{ elevation: number, azimuth: number }} In radians
 */
export function getSunPosition(month, hour, lat, lng) {
  const rad = Math.PI / 180;
  
  // Approximate day of year based on month (middle of the month)
  const dayOfYear = Math.floor((month - 1) * 30.4) + 15;
  
  // 1. Calculate Fractional Year (gamma)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  
  // 2. Estimate Equation of Time (in minutes)
  const eqTime = 229.18 * (
    0.000075 + 
    0.001868 * Math.cos(gamma) - 
    0.032077 * Math.sin(gamma) - 
    0.014615 * Math.cos(2 * gamma) - 
    0.040849 * Math.sin(2 * gamma)
  );
  
  // 3. Estimate Solar Declination (in radians)
  const declination = 0.006918 - 
    0.399912 * Math.cos(gamma) + 
    0.070257 * Math.sin(gamma) - 
    0.006758 * Math.cos(2 * gamma) + 
    0.000907 * Math.sin(2 * gamma) - 
    0.002697 * Math.cos(3 * gamma) + 
    0.00148 * Math.sin(3 * gamma);
    
  // 4. Calculate True Solar Time (in minutes)
  // Assuming timezone roughly aligns with longitude (15 degrees per hour)
  const timeOffset = eqTime + 4 * lng - (60 * Math.round(lng / 15));
  const trueSolarTime = hour * 60 + timeOffset;
  
  // 5. Calculate Solar Hour Angle (in radians)
  const hourAngle = (trueSolarTime / 4 - 180) * rad;
  const latRad = lat * rad;
  
  // 6. Calculate Elevation (Zenith Angle)
  const sinElevation = Math.sin(latRad) * Math.sin(declination) + 
                       Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = Math.asin(sinElevation);
  
  // 7. Calculate Azimuth
  const cosAzimuth = (Math.sin(latRad) * sinElevation - Math.sin(declination)) / 
                     (Math.cos(latRad) * Math.cos(elevation));
                     
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))); // clamp to prevent NaN
  
  if (hourAngle > 0) {
    azimuth = 2 * Math.PI - azimuth;
  }
  
  // Offset azimuth so North is -Z in Three.js coordinates
  return {
    elevation: elevation,
    azimuth: azimuth + Math.PI // Align to ThreeJS coordinate system
  };
}

/**
 * Converts spherical Sun coordinates (elevation, azimuth) to Cartesian [X, Y, Z] for Three.js directional lights.
 */
export function getSunVector(elevation, azimuth, distance = 100) {
  // If elevation is below 0, sun is below horizon (nighttime)
  if (elevation < 0) return null;
  
  const y = distance * Math.sin(elevation);
  const horizontalDist = distance * Math.cos(elevation);
  
  const x = horizontalDist * Math.sin(azimuth);
  const z = horizontalDist * Math.cos(azimuth);
  
  return [x, y, z];
}

/**
 * Calculates approximate sunrise / sunset local clock hours for a given
 * month, latitude and longitude, using the same solar-position model as
 * getSunPosition() so the two stay perfectly consistent with each other.
 *
 * @param {number} month - Month of the year (1-12)
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lng - Longitude in decimal degrees
 * @returns {{ sunrise: number|null, sunset: number|null, daylightHours: number, polar: 'day'|'night'|null }}
 */
export function getSunriseSunset(month, lat, lng) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((month - 1) * 30.4) + 15;

  // Use day-of-year (mid-day) to derive declination / equation-of-time;
  // the intra-day variation of these terms is negligible and this keeps
  // sunrise/sunset perfectly consistent with getSunPosition().
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

  const eqTime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  const declination = 0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = lat * rad;
  const cosH0 = -Math.tan(latRad) * Math.tan(declination);

  // Polar day / polar night guard (sun never sets / never rises)
  let polar = null;
  if (cosH0 <= -1) polar = "day";
  else if (cosH0 >= 1) polar = "night";

  const H0 = Math.acos(Math.max(-1, Math.min(1, cosH0))); // radians

  const timeOffset = eqTime + 4 * lng - (60 * Math.round(lng / 15));
  const hourAngleToHour = (hourAngleRad) => {
    const trueSolarTime = (hourAngleRad / rad + 180) * 4;
    return (trueSolarTime - timeOffset) / 60;
  };

  const sunrise = polar === "night" ? null : hourAngleToHour(-H0);
  const sunset = polar === "night" ? null : hourAngleToHour(H0);
  const daylightHours = polar === "day" ? 24 : polar === "night" ? 0 : Math.max(0, sunset - sunrise);

  return { sunrise, sunset, daylightHours, polar };
}

/**
 * Samples the sun's path (elevation/azimuth per hour) across a single day
 * for a given month/lat/lng. Used to draw the draggable sun-arc UI and to
 * keep the visual path perfectly in sync with the shadow-casting light.
 *
 * @returns {Array<{hour:number, elevation:number, azimuth:number}>}
 */
export function getSunPathPoints(month, lat, lng, steps = 96) {
  const { sunrise, sunset, polar } = getSunriseSunset(month, lat, lng);

  let start = 5, end = 19; // sensible fallback window
  if (polar === "day") { start = 0; end = 24; }
  else if (polar === "night") { return []; }
  else if (sunrise != null && sunset != null) {
    start = Math.max(0, sunrise - 0.4);
    end = Math.min(24, sunset + 0.4);
  }

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const hour = start + (end - start) * (i / steps);
    const pos = getSunPosition(month, hour, lat, lng);
    points.push({ hour, elevation: pos.elevation, azimuth: pos.azimuth });
  }
  return points;
}
```

