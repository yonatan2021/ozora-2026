// src/utils/time.test.js
import assert from 'assert';
import { getSetUniqueKey, migrateFavorites } from './time.js';

// Test 1: getSetUniqueKey
const sampleSet = {
  artist: "Siblicity",
  stage: "PUMPUI",
  date: "2026-07-25",
  start: "19:00"
};
const key = getSetUniqueKey(sampleSet);
assert.strictEqual(key, "Siblicity::PUMPUI::2026-07-25::19:00");

// Test 2: migrateFavorites
const timetable = [
  { id: "set-1", artist: "Artist A", stage: "PUMPUI", date: "2026-07-25", start: "16:00" },
  { id: "set-2", artist: "Artist B", stage: "OZORA STAGE", date: "2026-07-25", start: "19:00" }
];
const oldFavs = ["set-1", "Artist B::OZORA STAGE::2026-07-25::19:00", "invalid-id"];
const migrated = migrateFavorites(oldFavs, timetable);
assert.deepStrictEqual(migrated, [
  "Artist A::PUMPUI::2026-07-25::16:00",
  "Artist B::OZORA STAGE::2026-07-25::19:00"
]);

console.log("All time utils tests passed!");
