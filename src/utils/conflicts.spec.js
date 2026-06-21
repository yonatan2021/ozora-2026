import { describe, it, expect } from 'vitest';
import { detectConflicts, getConflictsForSet } from './conflicts.js';

const setA = { id: 'a', artist: 'Artist A', date: '2026-07-27', start: '14:00', end: '16:00' };
const setB = { id: 'b', artist: 'Artist B', date: '2026-07-27', start: '15:00', end: '17:00' };
const setC = { id: 'c', artist: 'Artist C', date: '2026-07-27', start: '17:00', end: '19:00' };

describe('conflicts utils', () => {
  it('should detect overlaps between sets', () => {
    const conflicts = detectConflicts([setA, setB, setC]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapMinutes).toBe(60);
    expect(conflicts[0].setA.id).toBe('a');
    expect(conflicts[0].setB.id).toBe('b');
  });

  it('should filter conflicts for a specific set ID', () => {
    const conflicts = detectConflicts([setA, setB, setC]);
    const filtered = getConflictsForSet('a', conflicts);
    expect(filtered).toHaveLength(1);
  });
});
