import {
  worldToCanvasPoint,
  getPanelPixelSize,
  getObstaclePixelSize,
} from "../utils/reportUtils";

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
          width: 14,
          height: 14,
          background: color,
          border: `1.5px ${dashed ? "dashed" : "solid"} ${border}`,
          borderRadius: round ? "50%" : 3,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

/**
 * Top-down (plan-view) drawing of the roof outline(s), placed panel arrays,
 * and obstacles — reusing the exact same coordinate math the live editor
 * canvas (RoofPolygonDrawer.jsx) already uses, so the report matches what
 * the user actually designed.
 *
 * Renders an inline <svg>, so it can be embedded directly in the report
 * and also prints cleanly (vector, no rasterization needed).
 */
export default function ReportRoofLayout({
  roofSections = [],
  solarUnits = [],
  obstacles = [],
  globalCenter,
  mpp,
  satImageUrl,
  scaleMetersBar = 5,
}) {
  const safeMpp = mpp || 0.15;
  const scaleBarPx = scaleMetersBar / safeMpp;
  const totalPanelCount = solarUnits.reduce((acc, u) => acc + (u.rows || 0) * (u.cols || 0), 0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, background: "#0c0c14" }}
      >
        {satImageUrl && (
          <image
            href={satImageUrl}
            x={0}
            y={0}
            width={CANVAS_W}
            height={CANVAS_H}
            opacity={0.85}
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="rgba(0,0,0,0.22)" />

        {/* Roof outlines, for every building/section */}
        {roofSections.map((section) =>
          (section.faces || []).map((face) => {
            const pts = face.nodeIds.map((id) => (section.nodes || []).find((n) => n.id === id)).filter(Boolean);
            if (pts.length < 3) return null;
            const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(" ");
            return (
              <polygon
                key={`${section.id}-${face.id}`}
                points={pointsStr}
                fill="rgba(99,210,255,0.12)"
                stroke="#63d2ff"
                strokeWidth={2}
                strokeDasharray="6 3"
              />
            );
          })
        )}

        {/* Panel arrays */}
        {solarUnits.map((unit) => {
          const c = worldToCanvasPoint(unit.position, globalCenter);
          const { wPx, hPx } = getPanelPixelSize(unit, safeMpp);
          const deg = (unit.rotation || 0) * (180 / Math.PI);
          const cols = unit.cols || 1;
          const rows = unit.rows || 1;
          return (
            <g key={unit.id} transform={`translate(${c.x} ${c.y}) rotate(${deg})`}>
              <rect x={-wPx / 2} y={-hPx / 2} width={wPx} height={hPx} fill="#0f1f3a" stroke="#9fd6ff" strokeWidth={1} />
              {Array.from({ length: Math.max(cols - 1, 0) }).map((_, i) => {
                const cx = -wPx / 2 + ((i + 1) * wPx) / cols;
                return <line key={`c${i}`} x1={cx} y1={-hPx / 2} x2={cx} y2={hPx / 2} stroke="rgba(159,214,255,0.4)" strokeWidth={0.5} />;
              })}
              {Array.from({ length: Math.max(rows - 1, 0) }).map((_, i) => {
                const cy = -hPx / 2 + ((i + 1) * hPx) / rows;
                return <line key={`r${i}`} x1={-wPx / 2} y1={cy} x2={wPx / 2} y2={cy} stroke="rgba(159,214,255,0.4)" strokeWidth={0.5} />;
              })}
            </g>
          );
        })}

        {/* Obstacles / keep-outs */}
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

        {/* North arrow (canvas/satellite tiles are north-up, so this is a fixed indicator) */}
        <g transform="translate(28 32)">
          <line x1={0} y1={16} x2={0} y2={-16} stroke="#ffffff" strokeWidth={2} />
          <polygon points="0,-22 -7,-10 7,-10" fill="#ffffff" />
          <text x={0} y={32} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight="bold">
            N
          </text>
        </g>

        {/* Scale bar */}
        <g transform={`translate(24 ${CANVAS_H - 22})`}>
          <line x1={0} y1={0} x2={scaleBarPx} y2={0} stroke="#ffffff" strokeWidth={2} />
          <line x1={0} y1={-4} x2={0} y2={4} stroke="#ffffff" strokeWidth={2} />
          <line x1={scaleBarPx} y1={-4} x2={scaleBarPx} y2={4} stroke="#ffffff" strokeWidth={2} />
          <text x={scaleBarPx / 2} y={-8} textAnchor="middle" fill="#ffffff" fontSize={11}>
            {scaleMetersBar} m
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "10px 2px 0", fontSize: 12, color: "#444" }}>
        <LegendItem color="#0f1f3a" border="#9fd6ff" label={`Solar Panel (${totalPanelCount} total)`} />
        <LegendItem color="#d4d4d4" border="#555555" label="AC Unit" />
        <LegendItem color="#1a1a1a" border="#000000" label="Water Tank" round />
        <LegendItem color="rgba(34,197,94,0.55)" border="#15803d" label="Tree" round />
        <LegendItem color="rgba(99,210,255,0.12)" border="#63d2ff" dashed label="Roof Outline" />
      </div>
    </div>
  );
}