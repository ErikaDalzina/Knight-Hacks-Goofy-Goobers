'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import type { LatLon } from '@/lib/geo';
import type { RatingLabel } from '@/lib/types';
import { PIN_SIZE, badgeHtml } from './ScoreBadge';
import type { RatedSpot } from './SpotCard';

// Esri's dark gray canvas, as in the mockup: a base layer plus a layer of place names.
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
const BASE_TILES = `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`;
const LABEL_TILES = `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`;

// Score pins from ScoreBadge. divIcon also avoids Leaflet's broken default marker images in
// bundlers. Icons are cached so an unchanged pin keeps its element when the map re-renders.
const pins = new Map<string, L.DivIcon>();
function pinIcon(score: number | null, label: RatingLabel, active: boolean) {
  const key = `${score}|${label}|${active}`;
  let icon = pins.get(key);
  if (!icon) {
    const px = active ? PIN_SIZE.active : PIN_SIZE.normal;
    icon = L.divIcon({ className: '', html: badgeHtml(score, label, active), iconSize: [px, px], iconAnchor: [px / 2, px / 2] });
    pins.set(key, icon);
  }
  return icon;
}

const homeIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:rgba(185,174,240,.22);display:flex;align-items:center;justify-content:center">'
    + '<div style="width:8px;height:8px;border-radius:50%;background:#b9aef0;box-shadow:0 0 10px #b9aef0"></div></div>',
});

// Fits every spot plus home on first load and whenever home moves; filtering leaves the view
// alone. Leaflet can't see CSS size changes (such as the phone's Map tab showing a hidden
// map), so a ResizeObserver tells it, and the first fit waits until the map has a size.
function FitView({ spots, home }: { spots: RatedSpot[]; home: LatLon }) {
  const map = useMap();
  const fittedFor = useRef<string | null>(null);

  useEffect(() => {
    const fit = () => {
      const key = `${home.lat},${home.lon}`;
      const { x, y } = map.getSize();
      if (!x || !y || spots.length === 0 || fittedFor.current === key) return;
      fittedFor.current = key;
      const points: [number, number][] = [[home.lat, home.lon], ...spots.map((s): [number, number] => [s.spot.lat, s.spot.lon])];
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 11 });
    };
    fit();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fit();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, spots, home]);

  return null;
}

export default function SpotMap({ spots, home, date, activeId, onHover }: {
  spots: RatedSpot[];
  home: LatLon;
  date: string;
  activeId: string | null;
  onHover: (id: string | null) => void;
}) {
  const router = useRouter();

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Half-step zoom lets the fit hug the spots instead of jumping a whole level out. */}
      <MapContainer
        center={[home.lat, home.lon]}
        zoom={8}
        zoomSnap={0.5}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={BASE_TILES} maxZoom={16} attribution="Tiles &copy; Esri — Esri, DeLorme, NAVTEQ" />
        <TileLayer url={LABEL_TILES} maxZoom={16} />
        <ZoomControl position="bottomright" />
        <FitView spots={spots} home={home} />
        <Marker position={[home.lat, home.lon]} icon={homeIcon} interactive={false} keyboard={false} />
        {spots.map((s) => {
          const active = s.spot.id === activeId;
          return (
            <Marker
              key={s.spot.id}
              position={[s.spot.lat, s.spot.lon]}
              icon={pinIcon(s.score, s.label, active)}
              zIndexOffset={active ? 1000 : s.score ?? 0}
              eventHandlers={{
                click: () => router.push(`/spots/${s.spot.id}?date=${date}`),
                mouseover: () => onHover(s.spot.id),
                mouseout: () => onHover(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]}>{s.spot.name}</Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
