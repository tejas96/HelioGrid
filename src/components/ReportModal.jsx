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