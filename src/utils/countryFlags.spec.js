import { describe, expect, it } from 'vitest';
import {
  countryCodeToFlag,
  getRenderableOrigin,
  isValidCountryCode,
  uniqueCountryCodes
} from './countryFlags';

describe('countryFlags utilities', () => {
  it('validates supported ISO country codes', () => {
    expect(isValidCountryCode('IL')).toBe(true);
    expect(isValidCountryCode('gb')).toBe(true);
    expect(isValidCountryCode('XX')).toBe(false);
    expect(isValidCountryCode('ISR')).toBe(false);
  });

  it('converts supported country codes to emoji flags', () => {
    expect(countryCodeToFlag('IL')).toBe('🇮🇱');
    expect(countryCodeToFlag('gb')).toBe('🇬🇧');
  });

  it('deduplicates and normalizes country codes while preserving order', () => {
    expect(uniqueCountryCodes(['il', 'GB', 'IL', ' jm '])).toEqual(['IL', 'GB', 'JM']);
  });

  it('returns null for missing or unreviewed origins', () => {
    expect(getRenderableOrigin(undefined)).toBeNull();
    expect(getRenderableOrigin({ countries: ['IL'], confidence: 'needs_review' })).toBeNull();
    expect(getRenderableOrigin({ countries: [], confidence: 'high' })).toBeNull();
  });

  it('returns normalized renderable countries for high and medium confidence origins', () => {
    expect(getRenderableOrigin({ countries: ['il', 'GB', 'IL'], confidence: 'medium' })).toEqual({
      countries: ['IL', 'GB'],
      flags: ['🇮🇱', '🇬🇧']
    });
  });
});
