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