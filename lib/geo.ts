import { useCallback, useEffect, useRef, useState } from 'react';

export type LatLon = { lat: number; lon: number };
export type Place = LatLon & { name: string };

// Default city if location is denied: UCF in Orlando, home of Knight Hacks.
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
  // One anchor city per other continental state, each with 2 demo spots in data/spots.json.
  { name: 'Birmingham, AL', lat: 33.5186, lon: -86.8104 },
  { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.074 },
  { name: 'Little Rock, AR', lat: 34.7465, lon: -92.2896 },
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
  { name: 'Denver, CO', lat: 39.7392, lon: -104.9903 },
  { name: 'Hartford, CT', lat: 41.7658, lon: -72.6734 },
  { name: 'Wilmington, DE', lat: 39.7391, lon: -75.5398 },
  { name: 'Atlanta, GA', lat: 33.749, lon: -84.388 },
  { name: 'Boise, ID', lat: 43.615, lon: -116.2023 },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
  { name: 'Indianapolis, IN', lat: 39.7684, lon: -86.1581 },
  { name: 'Des Moines, IA', lat: 41.5868, lon: -93.625 },
  { name: 'Wichita, KS', lat: 37.6872, lon: -97.3301 },
  { name: 'Louisville, KY', lat: 38.2527, lon: -85.7585 },
  { name: 'New Orleans, LA', lat: 29.9511, lon: -90.0715 },
  { name: 'Portland, ME', lat: 43.6591, lon: -70.2568 },
  { name: 'Baltimore, MD', lat: 39.2904, lon: -76.6122 },
  { name: 'Boston, MA', lat: 42.3601, lon: -71.0589 },
  { name: 'Detroit, MI', lat: 42.3314, lon: -83.0458 },
  { name: 'Minneapolis, MN', lat: 44.9778, lon: -93.265 },
  { name: 'Jackson, MS', lat: 32.2988, lon: -90.1848 },
  { name: 'St. Louis, MO', lat: 38.627, lon: -90.1994 },
  { name: 'Billings, MT', lat: 45.7833, lon: -108.5007 },
  { name: 'Omaha, NE', lat: 41.2565, lon: -95.9345 },
  { name: 'Las Vegas, NV', lat: 36.1699, lon: -115.1398 },
  { name: 'Manchester, NH', lat: 42.9956, lon: -71.4548 },
  { name: 'Newark, NJ', lat: 40.7357, lon: -74.1724 },
  { name: 'Albuquerque, NM', lat: 35.0844, lon: -106.6504 },
  { name: 'New York City, NY', lat: 40.7128, lon: -74.006 },
  { name: 'Charlotte, NC', lat: 35.2271, lon: -80.8431 },
  { name: 'Fargo, ND', lat: 46.8772, lon: -96.7898 },
  { name: 'Columbus, OH', lat: 39.9612, lon: -82.9988 },
  { name: 'Oklahoma City, OK', lat: 35.4676, lon: -97.5164 },
  { name: 'Portland, OR', lat: 45.5152, lon: -122.6784 },
  { name: 'Philadelphia, PA', lat: 39.9526, lon: -75.1652 },
  { name: 'Providence, RI', lat: 41.824, lon: -71.4128 },
  { name: 'Columbia, SC', lat: 34.0007, lon: -81.0348 },
  { name: 'Sioux Falls, SD', lat: 43.5446, lon: -96.7311 },
  { name: 'Nashville, TN', lat: 36.1627, lon: -86.7816 },
  { name: 'Houston, TX', lat: 29.7604, lon: -95.3698 },
  { name: 'Salt Lake City, UT', lat: 40.7608, lon: -111.891 },
  { name: 'Burlington, VT', lat: 44.4759, lon: -73.2121 },
  { name: 'Richmond, VA', lat: 37.5407, lon: -77.436 },
  { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Charleston, WV', lat: 38.3498, lon: -81.6326 },
  { name: 'Milwaukee, WI', lat: 43.0389, lon: -87.9065 },
  { name: 'Cheyenne, WY', lat: 41.14, lon: -104.8202 },
];

// A place's two-letter state, from the ", ST" every name ends with.
export const placeState = (place: Place) => place.name.slice(-2);

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
  let state = placeState(PLACES[0]);
  if (home.source === 'place' && home.place) {
    label = home.place.name;
    subLabel = 'chosen location';
    state = placeState(home.place);
  } else if (home.source === 'device') {
    const near = nearestPlace(home.location);
    label = near.miles <= NEAR_MILES ? `Near ${near.place.name}` : 'Your location';
    subLabel = 'using your location';
    state = placeState(near.place);
  }

  return {
    location: home.location,
    /** The state whose spots the home page rates; only this code is sent to the API. */
    state,
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
