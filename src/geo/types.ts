// Minimal GeoJSON types (RFC 7946). Positions are [longitude, latitude], in that order.

export type Position = [lng: number, lat: number];
/** A closed loop of positions. The last point may or may not repeat the first. */
export type Ring = Position[];
/** Outer ring first, then any holes. */
export type PolygonCoords = Ring[];

export type Geometry =
  | { type: 'Polygon'; coordinates: PolygonCoords }
  | { type: 'MultiPolygon'; coordinates: PolygonCoords[] }
  | { type: 'Point'; coordinates: Position };

export type Feature<G extends Geometry, P> = { type: 'Feature'; geometry: G; properties: P };

/** Describes where a dataset came from. `sample: true` means it is made-up demo data. */
export type DatasetMeta = {
  sample: boolean;
  source: string;
  retrieved: string | null;
  /** [west, south, east, north] of the area the dataset is meant to cover. */
  coverage: [number, number, number, number];
};

export type FeatureCollection<F> = {
  type: 'FeatureCollection';
  metadata: DatasetMeta;
  features: F[];
};
