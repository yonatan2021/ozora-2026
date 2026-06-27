import { describe, expect, it } from 'vitest';
import timetable from './timetable.json';
import artistOrigins from './artistOrigins.json';
import { isValidCountryCode } from '../utils/countryFlags';

const VALID_CONFIDENCE = new Set(['high', 'medium', 'needs_review']);

function validateOriginEntries(origins) {
  return Object.entries(origins).flatMap(([artist, origin]) => {
    const errors = [];
    const hasCountries = Array.isArray(origin.countries);
    const hasSources = Array.isArray(origin.sources);
    const validCountries = [];

    if (!hasCountries) errors.push(`${artist}: countries must be an array`);
    if (!hasSources) errors.push(`${artist}: sources must be an array`);
    if (!VALID_CONFIDENCE.has(origin.confidence)) errors.push(`${artist}: invalid confidence`);

    if (hasCountries) {
      origin.countries.forEach((country) => {
        if (isValidCountryCode(country)) {
          validCountries.push(country);
        } else {
          errors.push(`${artist}: invalid country ${country}`);
        }
      });
    }

    if (origin.confidence !== 'needs_review') {
      if (hasCountries && validCountries.length === 0) {
        errors.push(`${artist}: renderable entries require countries`);
      }
      if (hasSources && origin.sources.length === 0) errors.push(`${artist}: renderable entries require sources`);
    }

    return errors;
  });
}

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
    expect(validateOriginEntries(artistOrigins)).toEqual([]);
  });

  it('requires renderable origin entries to include countries and sources', () => {
    expect(
      validateOriginEntries({
        'Reviewed Artist': {
          countries: [],
          sources: ['https://example.com/reviewed-artist'],
          confidence: 'medium',
        },
        'Sourced Artist': {
          countries: ['HU'],
          sources: [],
          confidence: 'high',
        },
      }),
    ).toEqual([
      'Reviewed Artist: renderable entries require countries',
      'Sourced Artist: renderable entries require sources',
    ]);
  });

  it('reports malformed country and source arrays without throwing', () => {
    expect(
      validateOriginEntries({
        'Malformed Artist': {
          countries: 'HU',
          sources: null,
          confidence: 'high',
        },
      }),
    ).toEqual([
      'Malformed Artist: countries must be an array',
      'Malformed Artist: sources must be an array',
    ]);
  });
});
