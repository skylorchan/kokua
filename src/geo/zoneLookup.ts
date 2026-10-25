import { pointInMultiPolygon, pointInPolygon } from './pointInPolygon';
import type { DatasetMeta, Feature, FeatureCollection, Position } from './types';

export type ZoneKind = 'tsunami' | 'extreme-tsunami';
export type ZoneProps = { id: string; name: string; kind: ZoneKind };
export type ZoneFeature = Feature<
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] },
  ZoneProps
>;
export type ZoneCollection = FeatureCollection<ZoneFeature>;

export type ZoneResult =
  | { status: 'outside-coverage' }
  | { status: 'in-zone'; zones: ZoneProps[] }
  | { status: 'not-in-zone' };

type BBox = [number, number, number, number];

// Bounding boxes are computed once per feature and reused, so most features are
// rejected with four comparisons instead of a full ray cast.
const bboxCache = new WeakMap<ZoneFeature, BBox>();

function featureBBox(feature: ZoneFeature): BBox {
  let box = bboxCache.get(feature);
  if (box) return box;
  box = [Infinity, Infinity, -Infinity, -Infinity];
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  for (const polygon of polygons) {
    for (const [lng, lat] of polygon[0] ?? []) {
      box = [
        Math.min(box[0], lng),
        Math.min(box[1], lat),
        Math.max(box[2], lng),
        Math.max(box[3], lat),
      ];
    }
  }
  bboxCache.set(feature, box);
  return box;
}

const inBBox = ([lng, lat]: Position, [w, s, e, n]: BBox) =>
  lng >= w && lng <= e && lat >= s && lat <= n;

export function inCoverage(point: Position, meta: DatasetMeta): boolean {
  return inBBox(point, meta.coverage);
}

/** Every zone that contains the point, without the coverage check. */
export function zonesContaining(point: Position, features: ZoneFeature[]): ZoneFeature[] {
  return features.filter((f) => {
    if (!inBBox(point, featureBBox(f))) return false;
    return f.geometry.type === 'Polygon'
      ? pointInPolygon(point, f.geometry.coordinates)
      : pointInMultiPolygon(point, f.geometry.coordinates);
  });
}

/**
 * Answers "am I in an evacuation zone?". Outside the dataset's coverage area we refuse
 * to answer, because "not in a zone" there would just mean "we have no data".
 */
export function lookupZone(point: Position, zones: ZoneCollection): ZoneResult {
  if (!inCoverage(point, zones.metadata)) return { status: 'outside-coverage' };
  const hits = zonesContaining(point, zones.features);
  if (hits.length === 0) return { status: 'not-in-zone' };
  // Deduplicate: real layers often split one zone into several polygons.
  const byId = new Map(hits.map((f) => [f.properties.id, f.properties]));
  return { status: 'in-zone', zones: [...byId.values()] };
}
