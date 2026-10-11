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
// Being active is not part of the icon (see SpotPin).
const pins = new Map<string, L.DivIcon>();
function pinIcon(score: number | null, label: RatingLabel) {
  const key = `${score}|${label}`;
  let icon = pins.get(key);
  if (!icon) {
    const px = PIN_SIZE.normal;
    icon = L.divIcon({ className: '', html: badgeHtml(score, label), iconSize: [px, px], iconAnchor: [px / 2, px / 2] });
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

// The view that shows every spot plus home, used on load and by the "Show all spots" button.
const FIT = { padding: [40, 40] as L.PointTuple, maxZoom: 11 };

function spotBounds(spots: RatedSpot[], home: LatLon) {
  return L.latLngBounds([[home.lat, home.lon], ...spots.map((s): L.LatLngTuple => [s.spot.lat, s.spot.lon])]);
}

// The whole world, as far as the map's projection goes (it stops at about 85° north and south).
// Panning stops at its edges, so the world is never repeated beside itself.
const WORLD = L.latLngBounds([[-85, -180], [85, 180]]);

// The furthest you can zoom out: the world is 256 × 2^zoom px square, so this is the first
// half-step zoom (the map's zoomSnap) at which one world covers the whole map, edge to edge.
function minZoomToFill(map: L.Map) {
  const { x, y } = map.getSize();
  return Math.ceil(Math.log2(Math.max(x, y) / 256) * 2) / 2;
}

// Fits every spot plus home on first load and whenever home moves; filtering leaves the view
// alone. Leaflet can't see CSS size changes (such as the phone's Map tab showing a hidden
// map), so a ResizeObserver tells it, and the first fit waits until the map has a size.
function FitView({ spots, home }: { spots: RatedSpot[]; home: LatLon }) {
  const map = useMap();
  const fittedFor = useRef<string | null>(null);

  useEffect(() => {
    const capZoom = () => {
      const { x, y } = map.getSize();
      if (x && y) map.setMinZoom(minZoomToFill(map));
    };
    const fit = () => {
      const key = `${home.lat},${home.lon}`;
      const { x, y } = map.getSize();
      if (!x || !y || spots.length === 0 || fittedFor.current === key) return;
      fittedFor.current = key;
      map.fitBounds(spotBounds(spots, home), FIT);
    };
    capZoom();
    fit();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      capZoom(); // a bigger map needs a bigger world to fill it
      fit();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, spots, home]);

  return null;
}

const FIT_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">'
    + '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/>'
    + '<line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/>'
    + '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>';

// A "Show all spots" button under the zoom buttons that returns to the fitted view, for the
// spots the filters currently show. A plain Leaflet control so it matches +/−.
function FitControl({ spots, home }: { spots: RatedSpot[]; home: LatLon }) {
  const map = useMap();
  const latest = useRef({ spots, home });
  useEffect(() => {
    latest.current = { spots, home };
  }, [spots, home]);

  useEffect(() => {
    const control = new L.Control({ position: 'bottomright' });
    control.onAdd = () => {
      const bar = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', '', bar);
      button.href = '#';
      button.setAttribute('role', 'button');
      button.title = 'Show all spots';
      button.setAttribute('aria-label', 'Show all spots');
      button.innerHTML = FIT_ICON;
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      L.DomEvent.disableClickPropagation(bar);
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        const { spots, home } = latest.current;
        if (spots.length) map.fitBounds(spotBounds(spots, home), FIT);
      });
      return bar;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

// One spot's pin. Hovering it makes it active, and a new icon would make Leaflet replace the
// element under the cursor. The removed element never fires mouseout, so a fast swipe left the
// tooltip stuck open. Instead the active look is a class on the same element. The effect also
// runs when the icon changes (a new score), since that element is new.
function SpotPin({ item, active, date, onHover }: {
  item: RatedSpot;
  active: boolean;
  date: string;
  onHover: (id: string | null) => void;
}) {
  const router = useRouter();
  const marker = useRef<L.Marker>(null);
  const icon = pinIcon(item.score, item.label);

  useEffect(() => {
    marker.current?.getElement()?.classList.toggle('umbra-pin-active', active);
  }, [active, icon]);

  return (
    <Marker
      ref={marker}
      position={[item.spot.lat, item.spot.lon]}
      icon={icon}
      zIndexOffset={active ? 1000 : item.score ?? 0}
      eventHandlers={{
        click: () => router.push(`/spots/${item.spot.id}?date=${date}`),
        mouseover: () => onHover(item.spot.id),
        mouseout: () => onHover(null),
      }}
    >
      <Tooltip direction="top" offset={[0, -18]}>{item.spot.name}</Tooltip>
    </Marker>
  );
}

export default function SpotMap({ spots, home, date, activeId, onHover }: {
  spots: RatedSpot[];
  home: LatLon;
  date: string;
  activeId: string | null;
  onHover: (id: string | null) => void;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Half-step zoom lets the fit hug the spots instead of jumping a whole level out. */}
      <MapContainer
        center={[home.lat, home.lon]}
        zoom={8}
        zoomSnap={0.5}
        maxBounds={WORLD}
        maxBoundsViscosity={1}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={BASE_TILES} maxZoom={16} attribution="Tiles &copy; Esri — Esri, DeLorme, NAVTEQ" />
        <TileLayer url={LABEL_TILES} maxZoom={16} />
        {/* Before ZoomControl: Leaflet stacks later bottom-corner controls above earlier ones. */}
        <FitControl spots={spots} home={home} />
        <ZoomControl position="bottomright" />
        <FitView spots={spots} home={home} />
        <Marker position={[home.lat, home.lon]} icon={homeIcon} interactive={false} keyboard={false} />
        {spots.map((s) => (
          <SpotPin key={s.spot.id} item={s} active={s.spot.id === activeId} date={date} onHover={onHover} />
        ))}
      </MapContainer>
    </div>
  );
}
