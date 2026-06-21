import { describe, it, expect, beforeEach } from 'vitest';
import { getPriorities, getPriority, cyclePriority, prioritySortValue } from './priorities.js';

describe('priorities utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should cycle priorities (null -> must -> want -> maybe -> null)', () => {
    const key = 'set_1';
    expect(getPriority(key)).toBeNull();
    expect(cyclePriority(key)).toBe('must');
    expect(cyclePriority(key)).toBe('want');
    expect(cyclePriority(key)).toBe('maybe');
    expect(cyclePriority(key)).toBeNull();
  });

  it('should return correct sort value based on priorities map', () => {
    const map = { 'set_1': 'must', 'set_2': 'want', 'set_3': 'maybe' };
    expect(prioritySortValue('set_1', map)).toBe(0);
    expect(prioritySortValue('set_2', map)).toBe(1);
    expect(prioritySortValue('set_3', map)).toBe(2);
  });
});
