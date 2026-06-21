import { describe, it, expect } from 'vitest';
import { searchSchedule } from './search.js';

const sampleSets = [
  { id: "1", artist: "Astrix", stage: "OZORA STAGE", day: "DAY 1", type: "Trance", start: "22:00" },
  { id: "2", artist: "Siblicity", stage: "PUMPUI", day: "Warmup Sat", type: "Ambient", start: "19:00" },
  { id: "3", artist: "Vibrasphere", stage: "THE DOME", day: "DAY 2", type: "Chill", start: "15:00" }
];

describe('search utils', () => {
  it('should find sets by exact artist name case-insensitively', () => {
    const results = searchSchedule('astrix', sampleSets);
    expect(results).toHaveLength(1);
    expect(results[0].artist).toBe('Astrix');
  });

  it('should translate Hebrew search inputs for stages and days', () => {
    const stageResults = searchSchedule('פומפוי', sampleSets);
    expect(stageResults).toHaveLength(1);
    expect(stageResults[0].stage).toBe('PUMPUI');

    const dayResults = searchSchedule('חימום שבת', sampleSets);
    expect(dayResults).toHaveLength(1);
    expect(dayResults[0].day).toBe('Warmup Sat');
  });

  it('should translate common Hebrew artist names', () => {
    const artistResults = searchSchedule('אסטריקס', sampleSets);
    expect(artistResults).toHaveLength(1);
    expect(artistResults[0].artist).toBe('Astrix');
  });

  it('should perform multi-term matching', () => {
    const results = searchSchedule('astrix ozora', sampleSets);
    expect(results).toHaveLength(1);
  });
});
