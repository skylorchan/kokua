// Sanity checks against the real zone file in public/data. If the official data
// changes so much that these fail, someone should look at it before shipping.
import { describe, expect, it } from 'vitest';
import raw from '../../public/data/zones.geojson?raw';
import type { Position } from './types';
import { lookupZone, type ZoneCollection } from './zoneLookup';

const zones = JSON.parse(raw) as ZoneCollection;
const kinds = (p: Position) => {
  const r = lookupZone(p, zones);
  return r.status === 'in-zone' ? r.zones.map((z) => z.kind).sort() : r.status;
};

describe.skipIf(zones.metadata.sample)('official zone data', () => {
  it('puts Waikīkī Beach in the tsunami evacuation zone', () => {
    expect(kinds([-157.8268, 21.2764])).toContain('tsunami');
  });

  it('puts Hilo bayfront in the tsunami evacuation zone', () => {
    expect(kinds([-155.083, 19.724])).toContain('tsunami');
  });

  it('keeps Punahou School and UH Mānoa outside every zone', () => {
    expect(kinds([-157.83, 21.303])).toBe('not-in-zone');
    expect(kinds([-157.8171, 21.2969])).toBe('not-in-zone');
  });

  it('covers every main island and nothing far away', () => {
    expect(kinds([-156.33, 20.8])).not.toBe('outside-coverage'); // Maui
    expect(kinds([-159.5, 22.05])).not.toBe('outside-coverage'); // Kauaʻi
    expect(kinds([-118.24, 34.05])).toBe('outside-coverage'); // Los Angeles
  });
});
