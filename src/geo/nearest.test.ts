import { describe, expect, it } from 'vitest';
import { nearestPlaces, type PlaceFeature } from './nearest';

const place = (id: string, lng: number, lat: number): PlaceFeature => ({
  type: 'Feature',
  properties: { id, name: id, kind: 'refuge' },
  geometry: { type: 'Point', coordinates: [lng, lat] },
});

// Test fixture, not real places.
const places = [
  place('far', 0, 1),
  place('near', 0, 0.01),
  place('mid', 0.1, 0),
  place('west', -0.05, 0),
];

describe('nearestPlaces', () => {
  it('sorts by distance', () => {
    expect(nearestPlaces([0, 0], places).map((p) => p.place.id)).toEqual([
      'near',
      'west',
      'mid',
      'far',
    ]);
  });

  it('respects the limit', () => {
    expect(nearestPlaces([0, 0], places, 2)).toHaveLength(2);
    expect(nearestPlaces([0, 0], places, 0)).toEqual([]);
    expect(nearestPlaces([0, 0], places, -3)).toEqual([]);
  });

  it('includes distance and direction', () => {
    const [near, west] = nearestPlaces([0, 0], places);
    expect(near!.direction).toBe('N');
    expect(near!.meters).toBeCloseTo(1111.95, 1);
    expect(west!.direction).toBe('W');
  });

  it('breaks ties by id so results are stable', () => {
    const tied = [place('b', 0, 1), place('a', 1, 0)];
    expect(nearestPlaces([0, 0], tied).map((p) => p.place.id)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(nearestPlaces([0, 0], [])).toEqual([]);
  });
});
