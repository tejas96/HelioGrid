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
  onGenerateReport // <-- NEW PROP
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

  const copyRef = useRef(handleCopy);
  const pasteRef = useRef(handlePaste);
  useEffect(() => { copyRef.current = handleCopy; }, [handleCopy]);
  useEffect(() => { pasteRef.current = handlePaste; }, [handlePaste]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); setIsSpacePressed(true); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); copyRef.current(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteRef.current(); }
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