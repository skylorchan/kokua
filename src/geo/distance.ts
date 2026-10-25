import type { Position } from './types';

/** Mean Earth radius (IUGG), in meters. */
const EARTH_RADIUS_M = 6_371_008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Great-circle ("straight-line") distance in meters, using the haversine formula.
 * Accurate to about 0.5% because it treats the Earth as a sphere; plenty for "how far
 * is the nearest safe place", and it never claims to be a walking route.
 */
export function haversineMeters([lng1, lat1]: Position, [lng2, lat2]: Position): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `from` to `to`, in degrees clockwise from north [0, 360). */
export function bearingDegrees([lng1, lat1]: Position, [lng2, lat2]: Position): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Compass = (typeof COMPASS)[number];

/** Rounds a bearing to the nearest of 8 compass points (each covers 45°). */
export function compassDirection(bearing: number): Compass {
  const normalized = ((bearing % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % 8]!;
}
