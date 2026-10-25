import { describe, expect, it } from 'vitest';
import { lookupZone, zonesContaining, type ZoneCollection, type ZoneFeature } from './zoneLookup';

// Test fixture, not real zones.
const zoneA: ZoneFeature = {
  type: 'Feature',
  properties: { id: 'a', name: 'Zone A', kind: 'tsunami' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0],
      ],
    ],
  },
};
const zoneExtreme: ZoneFeature = {
  type: 'Feature',
  properties: { id: 'x', name: 'Extreme', kind: 'extreme-tsunami' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0],
      ],
    ],
  },
};
// Same id split across two polygons, like real layers often are.
const zoneSplit: ZoneFeature = {
  type: 'Feature',
  properties: { id: 's', name: 'Split', kind: 'tsunami' },
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [6, 0],
          [7, 0],
          [7, 1],
          [6, 1],
        ],
      ],
      [
        [
          [8, 0],
          [9, 0],
          [9, 1],
          [8, 1],
        ],
      ],
    ],
  },
};

const collection: ZoneCollection = {
  type: 'FeatureCollection',
  metadata: { sample: true, source: 'test', retrieved: null, coverage: [-1, -1, 10, 10] },
  features: [zoneA, zoneExtreme, zoneSplit, { ...zoneSplit }],
};

describe('lookupZone', () => {
  it('reports every zone containing the point', () => {
    expect(lookupZone([1, 1], collection)).toEqual({
      status: 'in-zone',
      zones: [zoneA.properties, zoneExtreme.properties],
    });
  });

  it('reports only the extreme zone between the two', () => {
    expect(lookupZone([3, 3], collection)).toEqual({
      status: 'in-zone',
      zones: [zoneExtreme.properties],
    });
  });

  it('deduplicates zones that share an id', () => {
    expect(lookupZone([6.5, 0.5], collection)).toEqual({
      status: 'in-zone',
      zones: [zoneSplit.properties],
    });
  });

  it('says not-in-zone inside coverage', () => {
    expect(lookupZone([5, 5], collection)).toEqual({ status: 'not-in-zone' });
  });

  it('refuses to answer outside coverage', () => {
    expect(lookupZone([50, 50], collection)).toEqual({ status: 'outside-coverage' });
  });
});

describe('zonesContaining', () => {
  it('finds the second part of a multipolygon', () => {
    expect(zonesContaining([8.5, 0.5], [zoneSplit])).toEqual([zoneSplit]);
  });
});
