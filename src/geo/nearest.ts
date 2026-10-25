import { bearingDegrees, compassDirection, haversineMeters, type Compass } from './distance';
import type { Feature, FeatureCollection, Position } from './types';

export type PlaceKind = 'shelter' | 'refuge' | 'assembly';
export type PlaceProps = { id: string; name: string; kind: PlaceKind; address?: string };
export type PlaceFeature = Feature<{ type: 'Point'; coordinates: Position }, PlaceProps>;
export type PlaceCollection = FeatureCollection<PlaceFeature>;

export type NearbyPlace = {
  place: PlaceProps;
  position: Position;
  meters: number;
  bearing: number;
  direction: Compass;
};

/**
 * The `limit` closest places by straight-line distance. A linear scan is fine: Oʻahu
 * has at most a few hundred candidate sites, which takes well under a millisecond.
 */
export function nearestPlaces(origin: Position, places: PlaceFeature[], limit = 5): NearbyPlace[] {
  return places
    .map((f) => {
      const position = f.geometry.coordinates;
      const bearing = bearingDegrees(origin, position);
      return {
        place: f.properties,
        position,
        meters: haversineMeters(origin, position),
        bearing,
        direction: compassDirection(bearing),
      };
    })
    .sort((a, b) => a.meters - b.meters || a.place.id.localeCompare(b.place.id))
    .slice(0, Math.max(0, limit));
}
