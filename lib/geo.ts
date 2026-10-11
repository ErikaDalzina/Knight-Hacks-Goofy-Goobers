import { useEffect, useState } from 'react';

export type LatLon = { lat: number; lon: number };

// Default city if location is denied. TODO: change to your hackathon city if needed.
export const DEFAULT_LOCATION: LatLon = { lat: 28.6024, lon: -81.2001 }; // Orlando, FL

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

// Renders right away with the default city, then updates if the user allows location.
export function useUserLocation() {
  const [location, setLocation] = useState<LatLon>(DEFAULT_LOCATION);
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsDefault(false);
      },
      () => {}, // denied or failed: keep the default city
      { timeout: 8000 }
    );
  }, []);

  return { location, isDefault };
}
