import { useEffect, useState } from 'react';
import { LatLng } from './types';

// TODO: set this to your hackathon's city.
export const DEFAULT_LOCATION: LatLng = { lat: 40.7128, lng: -74.006 };

// Haversine distance in km.
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Renders immediately with the default city, then updates if the user allows location.
export function useUserLocation() {
  const [location, setLocation] = useState<LatLng>(DEFAULT_LOCATION);
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsDefault(false);
      },
      () => {}, // denied or failed: keep the default city
      { timeout: 8000 }
    );
  }, []);

  return { location, isDefault };
}
