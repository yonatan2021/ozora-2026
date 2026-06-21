import { describe, it, expect } from 'vitest';
import { getSetUniqueKey, migrateFavorites } from './time.js';

describe('time utils', () => {
  it('should generate a unique key for a set', () => {
    const sampleSet = {
      artist: "Siblicity",
      stage: "PUMPUI",
      date: "2026-07-25",
      start: "19:00"
    };
    const key = getSetUniqueKey(sampleSet);
    expect(key).toBe("Siblicity::PUMPUI::2026-07-25::19:00");
  });

  it('should migrate old favorites to new key format', () => {
    const timetable = [
      { id: "set-1", artist: "Artist A", stage: "PUMPUI", date: "2026-07-25", start: "16:00" },
      { id: "set-2", artist: "Artist B", stage: "OZORA STAGE", date: "2026-07-25", start: "19:00" }
    ];
    const oldFavs = ["set-1", "Artist B::OZORA STAGE::2026-07-25::19:00", "invalid-id"];
    const migrated = migrateFavorites(oldFavs, timetable);
    expect(migrated).toEqual([
      "Artist A::PUMPUI::2026-07-25::16:00",
      "Artist B::OZORA STAGE::2026-07-25::19:00"
    ]);
  });
});
