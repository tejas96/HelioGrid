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