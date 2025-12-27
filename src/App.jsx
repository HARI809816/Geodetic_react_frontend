import { useState, useRef } from "react";
import ArcGISMap from "./ArcGISMap";
import "./App.css";

function formatDateForAPI(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  const year = String(date.getFullYear()).slice(-2);
  const day = String(date.getDate()).padStart(2, "0");

  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];

  const month = months[date.getMonth()];

  return `${year}${month}${day}`;
}

function App() {
  const [selectedDate, setSelectedDate] = useState("");
  const [apiDate, setApiDate] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [showNav, setShowNav] = useState(false);
  const [basemap, setBasemap] = useState("gray-vector");
  const [viewMode, setViewMode] = useState("2d");
  const mapRef = useRef(null);

  const handleLoad = () => {
    const formatted = formatDateForAPI(selectedDate);
    if (formatted) {
      setApiDate(formatted);
    }
  };

  const goToLocation = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      alert("Please enter valid latitude & longitude");
      return;
    }

    window.zoomToLatLon(lat, lon);
    setShowNav(false);
  };

  return (
    <div className="app">
      <header className="header">
        <button
          className="hamburger"
          onClick={() => setShowNav(!showNav)}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            padding: "8px",
            marginRight: "12px",
            color: "white"
          }}
        >
          ☰
        </button>

        <h3>Station Location Viewer</h3>

        <span className="date-label" style={{ marginLeft: "auto" }}>
          API Date: <b>{apiDate || "None"}</b>
        </span>
      </header>

      {/* Popup Navigation */}
      {showNav && (
        <>
          <div
            className="nav-overlay"
            onClick={() => setShowNav(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999
            }}
          />

          <div
            className="nav-popup"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              zIndex: 1000,
              minWidth: "320px",
              maxWidth: "400px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Navigation</h3>
              <button
                onClick={() => setShowNav(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                ✕
              </button>
            </div>

            {/* View Mode Toggle */}
            <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #eee" }}>
              <h4 style={{ marginTop: 0, marginBottom: "12px" }}>View Mode</h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setViewMode("2d")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: viewMode === "2d" ? "#0078d4" : "#f0f0f0",
                    color: viewMode === "2d" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  2D Map
                </button>
                <button
                  onClick={() => setViewMode("3d")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: viewMode === "3d" ? "#0078d4" : "#f0f0f0",
                    color: viewMode === "3d" ? "white" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  3D Globe
                </button>
              </div>
            </div>

            {/* Date Selection Section */}
            <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #eee" }}>
              <h4 style={{ marginTop: 0, marginBottom: "12px" }}>Load Station Data</h4>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              />
              <button
                onClick={handleLoad}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#0078d4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Load Data
              </button>
            </div>

            {/* Location Search Section */}
            <div>
              <h4 style={{ marginTop: 0, marginBottom: "12px" }}>Go to Location</h4>
              <input
                placeholder="Latitude"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              />
              <input
                placeholder="Longitude"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              />
              <button
                onClick={goToLocation}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Go to Location
              </button>
            </div>

            {/* Bookmarks Section */}
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
              <h4 style={{ marginTop: 0, marginBottom: "12px" }}>Bookmarks</h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => mapRef.current?.addBookmark()}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => mapRef.current?.deleteBookmark()}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ArcGISMap ref={mapRef} date={apiDate} basemap={basemap} viewMode={viewMode} />
    </div>
  );
}

export default App;