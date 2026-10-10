'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { LABEL_COLORS } from '@/lib/constants';
import type { LatLon } from '@/lib/geo';
import type { RatedSpot } from './SpotCard';

// divIcon avoids Leaflet's broken default marker image paths in bundlers.
const pinIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.5)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

// Zoom to fit all spots once they load.
function FitToSpots({ spots }: { spots: RatedSpot[] }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length === 0) return;
    const bounds = L.latLngBounds(spots.map((s) => [s.spot.lat, s.spot.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots.length, map]);
  return null;
}

export default function SpotMap({ spots, center }: { spots: RatedSpot[]; center: LatLon }) {
  const router = useRouter();

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapContainer center={[center.lat, center.lon]} zoom={8} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToSpots spots={spots} />
        <CircleMarker center={[center.lat, center.lon]} radius={7} pathOptions={{ color: '#4da3ff' }} />
        {spots.map((s) => (
          <Marker
            key={s.spot.id}
            position={[s.spot.lat, s.spot.lon]}
            icon={pinIcon(LABEL_COLORS[s.label])}
            eventHandlers={{ click: () => router.push(`/spots/${s.spot.id}`) }}
          >
            <Tooltip>{s.spot.name}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
