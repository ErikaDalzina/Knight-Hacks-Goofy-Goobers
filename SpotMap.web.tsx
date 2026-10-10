import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { LABEL_COLORS, SpotMapProps } from '../lib/types';

// divIcon avoids Leaflet's broken default marker image paths in bundlers.
const pinIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

// MapContainer's center prop is initial-only, so re-center when location changes.
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function SpotMap({ spots, center, onSelect }: SpotMapProps) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <MapContainer center={[center.lat, center.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={center.lat} lng={center.lng} />
        <CircleMarker center={[center.lat, center.lng]} radius={7} pathOptions={{ color: '#1565c0' }} />
        {spots.map((s) => (
          <Marker
            key={s.spotId}
            position={[s.lat, s.lng]}
            icon={pinIcon(LABEL_COLORS[s.label])}
            eventHandlers={{ click: () => onSelect(s.spotId) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
