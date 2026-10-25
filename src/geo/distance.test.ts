import { describe, expect, it } from 'vitest';
import { bearingDegrees, compassDirection, haversineMeters } from './distance';

// One degree along a meridian on a sphere of radius 6,371,008.8 m.
const ONE_DEGREE_M = (2 * Math.PI * 6_371_008.8) / 360;

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters([-157.85, 21.3], [-157.85, 21.3])).toBe(0);
  });

  it('matches one degree of latitude', () => {
    expect(haversineMeters([-157.85, 21], [-157.85, 22])).toBeCloseTo(ONE_DEGREE_M, 3);
  });

  it('matches a quarter of the equator', () => {
    expect(haversineMeters([0, 0], [90, 0])).toBeCloseTo(90 * ONE_DEGREE_M, 3);
  });

  it('is symmetric', () => {
    const a: [number, number] = [-157.8583, 21.3069];
    const b: [number, number] = [-155.0868, 19.7241];
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });

  it('shrinks east-west distance with latitude (cos φ)', () => {
    const atEquator = haversineMeters([0, 0], [0.01, 0]);
    const atHonolulu = haversineMeters([0, 21.3], [0.01, 21.3]);
    expect(atHonolulu / atEquator).toBeCloseTo(Math.cos((21.3 * Math.PI) / 180), 4);
  });

  it('handles antipodal points without NaN', () => {
    expect(haversineMeters([0, 0], [180, 0])).toBeCloseTo(180 * ONE_DEGREE_M, 3);
  });
});

describe('bearingDegrees', () => {
  it('gives the four cardinal directions', () => {
    expect(bearingDegrees([0, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(bearingDegrees([0, 0], [1, 0])).toBeCloseTo(90, 6);
    expect(bearingDegrees([0, 0], [0, -1])).toBeCloseTo(180, 6);
    expect(bearingDegrees([0, 0], [-1, 0])).toBeCloseTo(270, 6);
  });

  it('stays in [0, 360)', () => {
    const b = bearingDegrees([-157.85, 21.3], [-157.86, 21.31]);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('compassDirection', () => {
  it.each([
    [0, 'N'],
    [22.4, 'N'],
    [22.6, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [337.6, 'N'],
    [359.9, 'N'],
    [-90, 'W'],
    [450, 'E'],
  ] as const)('%s° is %s', (deg, dir) => {
    expect(compassDirection(deg)).toBe(dir);
  });
});
