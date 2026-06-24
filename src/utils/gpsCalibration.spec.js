import { describe, it, expect } from 'vitest';
import { calculateMean, calibrateGPS } from './gpsCalibration';

describe('GPS Calibration', () => {
  it('should calculate the mean correctly', () => {
    const samples = [
      { lat: 10, lng: 20, accuracy: 5 },
      { lat: 12, lng: 22, accuracy: 5 }
    ];
    const mean = calculateMean(samples);
    expect(mean).toEqual({ lat: 11, lng: 21 });
  });

  it('should filter outliers and average remaining samples', () => {
    const samples = [
      { lat: 46.7710, lng: 18.4340, accuracy: 5 },
      { lat: 46.7711, lng: 18.4341, accuracy: 6 },
      { lat: 46.7712, lng: 18.4339, accuracy: 4 },
      // Outlier coordinate (far away)
      { lat: 46.7900, lng: 18.4500, accuracy: 5 },
      // High inaccuracy coordinate
      { lat: 46.7715, lng: 18.4345, accuracy: 99 }
    ];

    const result = calibrateGPS(samples, 25);
    
    // The outlier at lat 46.79 and high inaccuracy sample (99) should be filtered out
    expect(result.lat).toBeLessThan(46.772);
    expect(result.lat).toBeGreaterThan(46.770);
    expect(result.accuracy).toBeLessThan(10);
  });
});
