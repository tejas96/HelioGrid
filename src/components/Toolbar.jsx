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