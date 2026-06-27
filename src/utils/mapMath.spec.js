import { describe, it, expect } from 'vitest';
import {
  calculateBearing,
  normalizeCoord,
  intersect,
  isPointInPolygon,
  doesSegmentCrossPolygon
} from './mapMath';

describe('mapMath utility tests', () => {
  describe('calculateBearing tests', () => {
    it('should calculate bearing correctly', () => {
      // Bearing from (0,0) to (1,0) (due North in grid coordinates, lat increase)
      const bearing = calculateBearing(0, 0, 1, 0);
      expect(bearing).toBeCloseTo(0, 1);
    });

    it('should handle degenerate coordinates for bearing', () => {
      expect(calculateBearing(0, 0, 0, 0)).toBe(0);
      expect(calculateBearing(10, 20, 10, 20)).toBe(0);
    });

    it('should calculate bearing using LatLng objects and arrays', () => {
      const p1 = { lat: 0, lng: 0 };
      const p2 = [1, 0];
      const bearing = calculateBearing(p1, p2);
      expect(bearing).toBeCloseTo(0, 1);
    });

    it('should return safe defaults for null/undefined/missing inputs', () => {
      expect(calculateBearing(null, 0, 0, 0)).toBe(0);
      expect(calculateBearing(0, undefined, 0, 0)).toBe(0);
      expect(calculateBearing(0, 0, null, 0)).toBe(0);
      expect(calculateBearing(0, 0, 0, undefined)).toBe(0);
      expect(calculateBearing({ lat: 0 }, { lat: 1, lng: 0 })).toBe(0);
    });
  });

  describe('normalizeCoord tests', () => {
    it('should normalize arrays', () => {
      expect(normalizeCoord([12.34, 56.78])).toEqual([12.34, 56.78]);
      expect(normalizeCoord(['12.34', '56.78'])).toEqual([12.34, 56.78]);
      expect(normalizeCoord([12.34])).toBeNull();
      expect(normalizeCoord([])).toBeNull();
    });

    it('should normalize LatLng objects', () => {
      expect(normalizeCoord({ lat: 12.34, lng: 56.78 })).toEqual([12.34, 56.78]);
      expect(normalizeCoord({ lat: '12.34', lng: '56.78' })).toEqual([12.34, 56.78]);
      expect(normalizeCoord({ lat: 12.34 })).toBeNull();
      expect(normalizeCoord({ lng: 56.78 })).toBeNull();
      expect(normalizeCoord(null)).toBeNull();
      expect(normalizeCoord(undefined)).toBeNull();
    });

    it('should reject coordinates with NaN values', () => {
      expect(normalizeCoord([NaN, 56.78])).toBeNull();
      expect(normalizeCoord([12.34, NaN])).toBeNull();
      expect(normalizeCoord({ lat: NaN, lng: 56.78 })).toBeNull();
      expect(normalizeCoord({ lat: 12.34, lng: NaN })).toBeNull();
      expect(normalizeCoord(['abc', 'def'])).toBeNull();
    });
  });

  describe('isPointInPolygon tests', () => {
    const polygon = [[0, 0], [0, 10], [10, 10], [10, 0]];

    it('should identify points inside the polygon', () => {
      expect(isPointInPolygon([5, 5], polygon)).toBe(true);
      expect(isPointInPolygon({ lat: 5, lng: 5 }, polygon)).toBe(true);
    });

    it('should identify points outside the polygon', () => {
      expect(isPointInPolygon([15, 15], polygon)).toBe(false);
      expect(isPointInPolygon({ lat: -5, lng: 5 }, polygon)).toBe(false);
    });

    it('should handle edge cases and safety', () => {
      expect(isPointInPolygon(null, polygon)).toBe(false);
      expect(isPointInPolygon([5, 5], null)).toBe(false);
      expect(isPointInPolygon([5, 5], [])).toBe(false);
      expect(isPointInPolygon([5, 5], [[0, 0], [0, 10]])).toBe(false); // length < 3
    });
  });

  describe('intersect tests', () => {
    it('should detect segment intersections correctly', () => {
      // Intersecting segments
      expect(intersect([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true);
      // Non-intersecting segments
      expect(intersect([0, 0], [2, 2], [5, 5], [7, 7])).toBe(false);
    });

    it('should handle symmetrical intersection of segments sharing an endpoint', () => {
      const pA = [0, 0];
      const pB = [1, 1];
      const pC = [1, 1];
      const pD = [2, 0];

      // Segment AB and CD share endpoint [1,1]
      expect(intersect(pA, pB, pC, pD)).toBe(true);
      expect(intersect(pA, pB, pD, pC)).toBe(true);
      expect(intersect(pB, pA, pC, pD)).toBe(true);
      expect(intersect(pB, pA, pD, pC)).toBe(true);
      
      expect(intersect(pC, pD, pA, pB)).toBe(true);
      expect(intersect(pD, pC, pA, pB)).toBe(true);
      expect(intersect(pC, pD, pB, pA)).toBe(true);
      expect(intersect(pD, pC, pB, pA)).toBe(true);
    });

    it('should handle collinear overlapping and touching segments', () => {
      // Collinear overlapping segments: [0,0]-[2,2] and [1,1]-[3,3]
      expect(intersect([0, 0], [2, 2], [1, 1], [3, 3])).toBe(true);
      expect(intersect([1, 1], [3, 3], [0, 0], [2, 2])).toBe(true);

      // Collinear touching segments: [0,0]-[1,1] and [1,1]-[2,2]
      expect(intersect([0, 0], [1, 1], [1, 1], [2, 2])).toBe(true);
      expect(intersect([1, 1], [2, 2], [0, 0], [1, 1])).toBe(true);

      // Collinear non-overlapping segments: [0,0]-[1,1] and [2,2]-[3,3]
      expect(intersect([0, 0], [1, 1], [2, 2], [3, 3])).toBe(false);
      expect(intersect([2, 2], [3, 3], [0, 0], [1, 1])).toBe(false);
    });

    it('should return safe defaults for null/undefined/missing inputs', () => {
      expect(intersect(null, [1, 2], [3, 4], [5, 6])).toBe(false);
      expect(intersect([1, 2], undefined, [3, 4], [5, 6])).toBe(false);
      expect(intersect([1, 2], [3, 4], null, [5, 6])).toBe(false);
      expect(intersect([1, 2], [3, 4], [5, 6], undefined)).toBe(false);
      expect(intersect([1], [2, 3], [4, 5], [6, 7])).toBe(false); // incorrect dimensions
    });
  });

  describe('doesSegmentCrossPolygon tests', () => {
    const polygon = [[2, 2], [2, 8], [8, 8], [8, 2]];

    it('should check if segment crosses a polygon boundaries', () => {
      // Crosses through the polygon
      expect(doesSegmentCrossPolygon([0, 5], [10, 5], polygon)).toBe(true);
      // Outside the polygon
      expect(doesSegmentCrossPolygon([0, 0], [1, 1], polygon)).toBe(false);
    });

    it('should detect crossing if one or both endpoints are inside the polygon', () => {
      // One endpoint inside, one outside
      expect(doesSegmentCrossPolygon([5, 5], [10, 5], polygon)).toBe(true);
      // Both endpoints inside
      expect(doesSegmentCrossPolygon([4, 4], [6, 6], polygon)).toBe(true);
    });

    it('should handle safety checks', () => {
      expect(doesSegmentCrossPolygon(null, [1, 2], polygon)).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], null, polygon)).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], null)).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], [])).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], [[0, 0], [0, 10]])).toBe(false); // length < 3
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], [[0, 0], [0, 10], [10]])).toBe(false); // invalid dimensions
    });
  });
});
