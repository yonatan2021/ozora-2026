import { describe, it, expect } from 'vitest';
import { compressPayload, decompressPayload } from './shareSerialization';

describe('shareSerialization', () => {
  it('should compress and decompress payload correctly with Hebrew characters', () => {
    const payload = {
      id: 'abc-123',
      name: 'משה',
      sets: [
        [1, 1],
        [2, 2, 'מנגן מעולה!']
      ],
      coord: {
        '2': 'ניפגש ליד העץ'
      }
    };

    const compressed = compressPayload(payload);
    expect(compressed).toBeTypeOf('string');
    expect(compressed.length).toBeGreaterThan(0);
    // Should not contain raw + / = characters (Base64url safe)
    expect(compressed).not.toMatch(/[+/=]/);

    const decompressed = decompressPayload(compressed);
    expect(decompressed.id).toBe('abc-123');
    expect(decompressed.name).toBe('משה');
    expect(decompressed.sets[1][2]).toBe('מנגן מעולה!');
    expect(decompressed.coord['2']).toBe('ניפגש ליד העץ');
  });

  it('should return null for invalid/corrupted base64url string', () => {
    const result = decompressPayload('!!!invalid!!!');
    expect(result).toBeNull();
  });

  it('should return empty string and null for edge cases', () => {
    const compressed = compressPayload(null);
    expect(compressed).toBe('');
    const decompressed = decompressPayload('');
    expect(decompressed).toBeNull();
  });
});
