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

  it('should match sets by related artists and members', () => {
    // Shpongle has Simon Posford as member in artistConnections.json
    const shpongleSets = [
      { id: "s1", artist: "Shpongle", stage: "OZORA STAGE", day: "DAY 3", type: "Chill", start: "20:00" }
    ];
    // Search for 'Simon Posford' should match Shpongle
    const results = searchSchedule('Simon Posford', shpongleSets, {
      notes: {},
      friends: {},
      favorites: [],
      priorities: {},
      lang: 'en'
    });
    expect(results).toHaveLength(1);
    expect(results[0].artist).toBe('Shpongle');
    expect(results[0].matchReason.type).toBe('related');
    expect(results[0].matchReason.detail).toBe('Simon Posford');
  });

  it('should match sets by personal notes', () => {
    const results = searchSchedule('magic moment', sampleSets, {
      notes: { "1": "This is a magic moment set!" },
      friends: {},
      favorites: [],
      priorities: {},
      lang: 'en'
    });
    expect(results).toHaveLength(1);
    expect(results[0].artist).toBe('Astrix');
    expect(results[0].matchReason.type).toBe('note');
    expect(results[0].matchReason.detail).toContain('magic moment');
  });

  it('should match sets by friend name', () => {
    const results = searchSchedule('Maya', sampleSets, {
      notes: {},
      friends: {
        "friend-1": { name: "Maya", sets: ["2"], priorities: {}, notes: {}, coordinationNotes: {} }
      },
      favorites: [],
      priorities: {},
      lang: 'en'
    });
    expect(results).toHaveLength(1);
    expect(results[0].artist).toBe('Siblicity');
    expect(results[0].matchReason.type).toBe('friend');
    expect(results[0].matchReason.detail).toBe('Maya');
  });
});
