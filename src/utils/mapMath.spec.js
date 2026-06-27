import { describe, it, expect } from 'vitest';
import { calculateBearing, intersect, doesSegmentCrossPolygon } from './mapMath';

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
});
