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