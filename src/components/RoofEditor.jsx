// FILE: src/components/RoofEditor.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import RoofPolygonDrawer from "./RoofPolygonDrawer";
import Building3DViewer from "./Building3dViewer";
import Toolbar from "./Toolbar";
import ReportModal from "./ReportModal";
import { fetchRoofAndSolarData, fetchSolarDataLayers } from "../services/solarService";
import { computeGlobalCenter } from "../utils/polygonUtils";
import { computeSceneScale, metersToWorld } from "../utils/scaleUtils";

const STEPS = { LOADING: "loading", DRAW: "draw", VIEW3D: "view3d" };
const DEFAULT_HEIGHT = 6;

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

  const handleMeshChange = (nodes, faces) => updateActiveSection({ nodes, faces });
  const handleClearSection = () => {
    updateActiveSection({ nodes: [], faces: [] }); setSelectedNodeId(null); setIsManualDraw(true);
    setSolarUnits(prev => prev.filter(u => u.sectionId !== activeSectionId));
    setObstacles(prev => prev.filter(o => o.sectionId !== activeSectionId));
  };

  const handleNodeElevationChange = (val) => {
    const newZ = parseFloat(val);
    if (isNaN(newZ) || !selectedNodeId) return;
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