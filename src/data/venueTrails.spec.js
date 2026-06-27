import { describe, it, expect } from 'vitest';
import trailsData from './venueTrails.json';

describe('venueTrails JSON validation', () => {
  it('should contain trails and restrictedZones arrays', () => {
    expect(Array.isArray(trailsData.trails)).toBe(true);
    expect(Array.isArray(trailsData.restrictedZones)).toBe(true);
    expect(trailsData.trails.length).toBeGreaterThan(0);
    expect(trailsData.restrictedZones.length).toBeGreaterThan(0);
  });
});
