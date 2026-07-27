import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import StatusBadge from './StatusBadge.jsx';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BOGOTA = [4.65, -74.08];

function FitBounds({ vehicles }) {
  const map = useMap();

  useEffect(() => {
    const withCoords = vehicles.filter((v) => v.last_lat != null && v.last_lng != null);
    if (withCoords.length === 0) return;

    if (withCoords.length === 1) {
      map.setView([withCoords[0].last_lat, withCoords[0].last_lng], 13);
      return;
    }

    const bounds = L.latLngBounds(
      withCoords.map((v) => [v.last_lat, v.last_lng]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [vehicles, map]);

  return null;
}

export default function VehicleMap({ vehicles }) {
  const markers = vehicles.filter((v) => v.last_lat != null && v.last_lng != null);

  return (
    <div className="map-shell">
      <MapContainer center={BOGOTA} zoom={12} className="map-canvas" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds vehicles={markers} />
        {markers.map((v) => (
          <Marker key={v.vehicle_id} position={[v.last_lat, v.last_lng]}>
            <Popup>
              <div className="map-popup">
                <strong className="mono">{v.vehicle_id}</strong>
                <StatusBadge status={v.status} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
