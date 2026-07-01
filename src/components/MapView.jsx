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