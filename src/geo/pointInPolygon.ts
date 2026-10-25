import type { PolygonCoords, Position, Ring } from './types';

// How close (in degrees, about 1 cm) a point must be to an edge to count as on it.
const EPSILON = 1e-7;

function onSegment([px, py]: Position, [ax, ay]: Position, [bx, by]: Position): boolean {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  const length = Math.hypot(bx - ax, by - ay);
  if (Math.abs(cross) > EPSILON * Math.max(length, 1)) return false;
  return (
    px >= Math.min(ax, bx) - EPSILON &&
    px <= Math.max(ax, bx) + EPSILON &&
    py >= Math.min(ay, by) - EPSILON &&
    py <= Math.max(ay, by) + EPSILON
  );
}

/**
 * Ray casting: shoot a ray from the point toward +x and count how many edges it crosses.
 * Odd = inside. A point exactly on an edge counts as inside, because for an evacuation
 * zone the safe answer at the boundary is "you're in it".
 */
export function pointInRing(point: Position, ring: Ring): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    if (onSegment(point, a, b)) return true;
    // The edge straddles the ray's y (half-open, so a shared vertex is counted once)...
    if (a[1] > y !== b[1] > y) {
      // ...and crosses it to the right of the point.
      const crossX = a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
      if (x < crossX) inside = !inside;
    }
  }
  return inside;
}

/** Inside the outer ring and not strictly inside any hole. A hole's edge is still in the zone. */
export function pointInPolygon(point: Position, polygon: PolygonCoords): boolean {
  const [outer, ...holes] = polygon;
  if (!outer || !pointInRing(point, outer)) return false;
  return !holes.some((hole) => pointInRing(point, hole) && !onRingEdge(point, hole));
}

export function pointInMultiPolygon(point: Position, polygons: PolygonCoords[]): boolean {
  return polygons.some((polygon) => pointInPolygon(point, polygon));
}

function onRingEdge(point: Position, ring: Ring): boolean {
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if (onSegment(point, ring[i]!, ring[j]!)) return true;
  }
  return false;
}
