import { describe, expect, it } from 'vitest';
import timetable from './timetable.json';
import artistOrigins from './artistOrigins.json';
import { isValidCountryCode } from '../utils/countryFlags';

const VALID_CONFIDENCE = new Set(['high', 'medium', 'needs_review']);

function uniqueArtists() {
  return [...new Set(timetable.map((set) => set.artist))].sort((a, b) => a.localeCompare(b));
}

describe('artistOrigins data', () => {
  it('has an origin entry for every unique timetable artist', () => {
    const missing = uniqueArtists().filter((artist) => !artistOrigins[artist]);
    expect(missing).toEqual([]);
  });

  it('does not contain artist keys that are absent from the timetable', () => {
    const timetableArtists = new Set(uniqueArtists());
    const extra = Object.keys(artistOrigins).filter((artist) => !timetableArtists.has(artist));
    expect(extra).toEqual([]);
  });

  it('uses valid origin entry shapes', () => {
    const invalid = Object.entries(artistOrigins).flatMap(([artist, origin]) => {
      const errors = [];

      if (!Array.isArray(origin.countries)) errors.push(`${artist}: countries must be an array`);
      if (!Array.isArray(origin.sources)) errors.push(`${artist}: sources must be an array`);
      if (!VALID_CONFIDENCE.has(origin.confidence)) errors.push(`${artist}: invalid confidence`);
      if (origin.confidence !== 'needs_review' && origin.sources.length === 0) {
        errors.push(`${artist}: renderable entries require sources`);
      }

      origin.countries.forEach((country) => {
        if (!isValidCountryCode(country)) errors.push(`${artist}: invalid country ${country}`);
      });

      return errors;
    });

    expect(invalid).toEqual([]);
  });
});
