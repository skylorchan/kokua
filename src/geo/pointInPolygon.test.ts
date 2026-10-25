import { describe, expect, it } from 'vitest';
import { pointInMultiPolygon, pointInPolygon, pointInRing } from './pointInPolygon';
import type { PolygonCoords, Ring } from './types';

const square: Ring = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
];
// A "U" shape: the notch (4..6, 5..10) is outside even though it's inside the bounding box.
const concave: Ring = [
  [0, 0],
  [10, 0],
  [10, 10],
  [6, 10],
  [6, 5],
  [4, 5],
  [4, 10],
  [0, 10],
];
const hole: Ring = [
  [3, 3],
  [7, 3],
  [7, 7],
  [3, 7],
  [3, 3],
];

describe('pointInRing', () => {
  it('detects inside and outside a square', () => {
    expect(pointInRing([5, 5], square)).toBe(true);
    expect(pointInRing([15, 5], square)).toBe(false);
    expect(pointInRing([-1, -1], square)).toBe(false);
  });

  it('handles concave shapes', () => {
    expect(pointInRing([2, 8], concave)).toBe(true);
    expect(pointInRing([5, 8], concave)).toBe(false);
    expect(pointInRing([5, 2], concave)).toBe(true);
  });

  it('counts edges and vertices as inside', () => {
    expect(pointInRing([5, 0], square)).toBe(true);
    expect(pointInRing([10, 5], square)).toBe(true);
    expect(pointInRing([10, 10], square)).toBe(true);
  });

  it('does not double-count when the ray passes exactly through a vertex', () => {
    // y = 5 passes through the notch's vertices (6,5) and (4,5).
    expect(pointInRing([1, 5], concave)).toBe(true);
    expect(pointInRing([-1, 5], concave)).toBe(false);
    // Diamond: ray from (−1, 0) passes through the left and right tips.
    const diamond: Ring = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    expect(pointInRing([-2, 0], diamond)).toBe(false);
    expect(pointInRing([0, 0], diamond)).toBe(true);
  });

  it('works whether or not the ring repeats its first point', () => {
    const open = square.slice(0, -1);
    expect(pointInRing([5, 5], open)).toBe(true);
    expect(pointInRing([5, 0], open)).toBe(true);
    expect(pointInRing([11, 5], open)).toBe(false);
  });

  it('works with real Hawaiʻi coordinates (negative longitudes)', () => {
    const waikiki: Ring = [
      [-157.84, 21.27],
      [-157.82, 21.27],
      [-157.82, 21.29],
      [-157.84, 21.29],
    ];
    expect(pointInRing([-157.83, 21.28], waikiki)).toBe(true);
    expect(pointInRing([-157.85, 21.28], waikiki)).toBe(false);
  });
});

describe('pointInPolygon', () => {
  const withHole: PolygonCoords = [square, hole];

  it('excludes points inside a hole', () => {
    expect(pointInPolygon([5, 5], withHole)).toBe(false);
    expect(pointInPolygon([1, 1], withHole)).toBe(true);
  });

  it("treats a hole's edge as still in the zone", () => {
    expect(pointInPolygon([3, 5], withHole)).toBe(true);
  });

  it('is false for an empty polygon', () => {
    expect(pointInPolygon([0, 0], [])).toBe(false);
  });
});

describe('pointInMultiPolygon', () => {
  const far: Ring = square.map(([x, y]) => [x + 100, y]);

  it('is true if any part contains the point', () => {
    expect(pointInMultiPolygon([105, 5], [[square], [far]])).toBe(true);
    expect(pointInMultiPolygon([50, 5], [[square], [far]])).toBe(false);
  });
});
