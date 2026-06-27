import { describe, it, expect } from 'vitest';
import { calculateBearing, ccw, intersect, doesSegmentCrossPolygon } from './mapMath';

describe('mapMath utility tests', () => {
  it('should calculate bearing correctly', () => {
    // Bearing from (0,0) to (1,0) (due North)
    const bearing = calculateBearing(0, 0, 1, 0);
    expect(bearing).toBeCloseTo(0, 1);
  });

  it('should detect segment intersections correctly', () => {
    // Intersecting segments
    expect(intersect([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true);
    // Non-intersecting segments
    expect(intersect([0, 0], [2, 2], [5, 5], [7, 7])).toBe(false);
  });

  it('should check if segment crosses a polygon', () => {
    const polygon = [[2, 2], [2, 8], [8, 8], [8, 2]];
    // Crosses through the polygon
    expect(doesSegmentCrossPolygon([0, 5], [10, 5], polygon)).toBe(true);
    // Outside the polygon
    expect(doesSegmentCrossPolygon([0, 0], [1, 1], polygon)).toBe(false);
  });

  describe('defensive and edge case checks', () => {
    it('should handle degenerate coordinates for bearing', () => {
      expect(calculateBearing(0, 0, 0, 0)).toBe(0);
      expect(calculateBearing(10, 20, 10, 20)).toBe(0);
    });

    it('should return safe defaults for null/undefined/missing inputs without throwing exceptions', () => {
      // calculateBearing
      expect(calculateBearing(null, 0, 0, 0)).toBe(0);
      expect(calculateBearing(0, undefined, 0, 0)).toBe(0);
      expect(calculateBearing(0, 0, null, 0)).toBe(0);
      expect(calculateBearing(0, 0, 0, undefined)).toBe(0);

      // ccw
      expect(ccw(null, [1, 2], [3, 4])).toBe(false);
      expect(ccw([1, 2], undefined, [3, 4])).toBe(false);
      expect(ccw([1, 2], [3, 4], null)).toBe(false);
      expect(ccw([1], [2, 3], [4, 5])).toBe(false); // incorrect dimensions
      expect(ccw([1, 2], [3], [4, 5])).toBe(false); // incorrect dimensions
      expect(ccw([1, 2], [3, 4], [5])).toBe(false); // incorrect dimensions

      // intersect
      expect(intersect(null, [1, 2], [3, 4], [5, 6])).toBe(false);
      expect(intersect([1, 2], undefined, [3, 4], [5, 6])).toBe(false);
      expect(intersect([1, 2], [3, 4], null, [5, 6])).toBe(false);
      expect(intersect([1, 2], [3, 4], [5, 6], undefined)).toBe(false);
      expect(intersect([1], [2, 3], [4, 5], [6, 7])).toBe(false); // incorrect dimensions

      // doesSegmentCrossPolygon
      expect(doesSegmentCrossPolygon(null, [1, 2], [[0, 0], [0, 10], [10, 10]])).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], null, [[0, 0], [0, 10], [10, 10]])).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], null)).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], [])).toBe(false);
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], [[0, 0], [0, 10]])).toBe(false); // length < 3
      expect(doesSegmentCrossPolygon([1, 2], [3, 4], [[0, 0], [0, 10], [10]])).toBe(false); // invalid dimensions in one coord
    });

    it('should handle collinear segments or shared endpoints safely', () => {
      // Shared endpoint collinear: segment [0,0]-[1,1] and segment [1,1]-[2,2]
      expect(intersect([0, 0], [1, 1], [1, 1], [2, 2])).toBe(false);
      // Collinear but separate: [0,0]-[1,1] and [2,2]-[3,3]
      expect(intersect([0, 0], [1, 1], [2, 2], [3, 3])).toBe(false);
      // Shared endpoint, not collinear: [0,0]-[1,1] and [1,1]-[2,0]
      expect(intersect([0, 0], [1, 1], [1, 1], [2, 0])).toBe(true);
    });
  });
});
