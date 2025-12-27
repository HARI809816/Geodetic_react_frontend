// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// function MapView({ stations }) {
//   const center = stations.length
//     ? [stations[0].latitude, stations[0].longitude]
//     : [20, 0];

//   return (
//     <MapContainer center={center} zoom={3} className="map">
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//       {stations.map((s, i) => (
//         <Marker key={i} position={[s.latitude, s.longitude]}>
//           <Popup>
//             <b>{s.station}</b><br />
//             Lat: {s.latitude}<br />
//             Lon: {s.longitude}<br />
//             Height: {s.height_m} m
//           </Popup>
//         </Marker>
//       ))}
//     </MapContainer>
//   );
// }

// export default MapView;


import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

/* Fix Leaflet icon issue */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ stations }) {
//   if (!stations || stations.length === 0) {
//     return <div>Loading map data...</div>;
//   }

  // ✅ FILTER INVALID COORDINATES
  const validStations = stations.filter(
    (s) =>
      s.latitude !== null &&
      s.longitude !== null &&
      !isNaN(s.latitude) &&
      !isNaN(s.longitude)
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup chunkedLoading>
        {validStations.map((s, i) => (
          <Marker
            key={i}
            position={[Number(s.latitude), Number(s.longitude)]}
          >
            <Popup>
              <b>{s.station}</b><br />
              Lat: {s.latitude}<br />
              Lon: {s.longitude}<br />
              Height: {s.height_m} m
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
