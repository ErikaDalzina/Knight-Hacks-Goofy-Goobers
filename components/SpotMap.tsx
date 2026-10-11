'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LatLon } from '@/lib/geo';
import type { RatedSpot } from './SpotCard';
import { badgeHtml, PIN_SIZE } from './ScoreBadge';


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

export default function SpotMap({ spots, center, date }: { spots: RatedSpot[]; center: LatLon; date: string }) {
  const router = useRouter();

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapContainer center={[center.lat, center.lon]} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer
              attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
          />
          <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
          />
        <FitToSpots spots={spots} />
        <CircleMarker center={[center.lat, center.lon]} radius={7} pathOptions={{ color: '#4da3ff' }} />
        {spots.map((s) => (
          <Marker
            key={s.spot.id}
            position={[s.spot.lat, s.spot.lon]}
            icon={L.divIcon({ html: badgeHtml(s.score, s.label), className: '', iconSize: [PIN_SIZE.normal, PIN_SIZE.normal] })}
            eventHandlers={{ click: () => router.push(`/spots/${s.spot.id}?date=${date}`) }}
          >
            <Tooltip>{s.spot.name}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
