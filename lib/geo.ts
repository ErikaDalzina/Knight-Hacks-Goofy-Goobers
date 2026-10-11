import { useCallback, useEffect, useRef, useState } from 'react';

export type LatLon = { lat: number; lon: number };
export type Place = LatLon & { name: string };

// Default city if location is denied. TODO: change to your hackathon city if needed.
export const DEFAULT_LOCATION: LatLon = { lat: 28.6024, lon: -81.2001 }; // Orlando, FL

// Towns for the location picker. Orlando is DEFAULT_LOCATION (UCF), so the default and the
// list agree.
export const PLACES: Place[] = [
  { name: 'Orlando, FL', ...DEFAULT_LOCATION },
  { name: 'Winter Park, FL', lat: 28.6, lon: -81.3392 },
  { name: 'Kissimmee, FL', lat: 28.292, lon: -81.4076 },
  { name: 'Sanford, FL', lat: 28.8003, lon: -81.2731 },
  { name: 'Clermont, FL', lat: 28.5494, lon: -81.7729 },
  { name: 'Apopka, FL', lat: 28.6934, lon: -81.5322 },
  { name: 'DeLand, FL', lat: 29.0283, lon: -81.3031 },
  { name: 'Daytona Beach, FL', lat: 29.2108, lon: -81.0228 },
  { name: 'Titusville, FL', lat: 28.6122, lon: -80.8076 },
  { name: 'Melbourne, FL', lat: 28.0836, lon: -80.6081 },
  { name: 'Lakeland, FL', lat: 28.0395, lon: -81.9498 },
  { name: 'Tampa, FL', lat: 27.9506, lon: -82.4572 },
  { name: 'Ocala, FL', lat: 29.1872, lon: -82.1401 },
  { name: 'The Villages, FL', lat: 28.9342, lon: -81.9598 },
];

// Haversine distance in miles.
export function distanceMiles(a: LatLon, b: LatLon): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestPlace(location: LatLon): { place: Place; miles: number } {
  return PLACES
    .map((place) => ({ place, miles: distanceMiles(location, place) }))
    .reduce((best, p) => (p.miles < best.miles ? p : best));
}

const STORAGE_KEY = 'umbra:home'; // the chosen town's name
const NEAR_MILES = 30; // close enough to say "Near <town>"

// Storage can be missing or blocked (private windows, previews), so failures are ignored.
function readStoredPlace(): Place | null {
  try {
    const name = localStorage.getItem(STORAGE_KEY);
    return PLACES.find((p) => p.name === name) ?? null;
  } catch {
    return null;
  }
}
function storePlace(place: Place | null) {
  try {
    if (place) localStorage.setItem(STORAGE_KEY, place.name);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

type Home = { location: LatLon; source: 'default' | 'device' | 'place'; place: Place | null; blocked: boolean };
const DEFAULT_HOME: Home = { location: DEFAULT_LOCATION, source: 'default', place: null, blocked: false };

/**
 * Where distances are measured from. Renders right away with the default city, then uses a
 * town the user chose earlier, or the device's location if they allow it.
 */
export function useUserLocation() {
  const [home, setHome] = useState<Home>(DEFAULT_HOME);
  // Bumped on every choice, so a slow location fix can't override a town picked meanwhile.
  const request = useRef(0);

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const id = ++request.current;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== request.current) return;
        setHome({ location: { lat: pos.coords.latitude, lon: pos.coords.longitude }, source: 'device', place: null, blocked: false });
      },
      (err) => {
        // Denied or failed: keep the default city.
        if (id === request.current && err.code === err.PERMISSION_DENIED) setHome((h) => ({ ...h, blocked: true }));
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const stored = readStoredPlace();
    if (stored) setHome({ location: { lat: stored.lat, lon: stored.lon }, source: 'place', place: stored, blocked: false });
    else locate();
  }, [locate]);

  const choosePlace = useCallback((place: Place) => {
    request.current++;
    storePlace(place);
    setHome({ location: { lat: place.lat, lon: place.lon }, source: 'place', place, blocked: false });
  }, []);

  const locateMe = useCallback(() => {
    storePlace(null);
    setHome(DEFAULT_HOME);
    locate();
  }, [locate]);

  let label = PLACES[0].name;
  let subLabel = home.blocked ? 'location blocked' : 'default';
  if (home.source === 'place' && home.place) {
    label = home.place.name;
    subLabel = 'chosen location';
  } else if (home.source === 'device') {
    const near = nearestPlace(home.location);
    label = near.miles <= NEAR_MILES ? `Near ${near.place.name}` : 'Your location';
    subLabel = 'using your location';
  }

  return {
    location: home.location,
    isDefault: home.source === 'default',
    source: home.source,
    /** The town to tick in the picker, if any. */
    placeName: home.source === 'place' ? home.place?.name ?? null : home.source === 'default' ? PLACES[0].name : null,
    label,
    subLabel,
    choosePlace,
    locateMe,
  };
}
