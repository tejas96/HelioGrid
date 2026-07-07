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