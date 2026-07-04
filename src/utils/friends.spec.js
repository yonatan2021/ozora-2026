import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMyScheduleId,
  getFriends,
  saveFriend,
  removeFriend,
  saveCoordinationNote,
} from './friends';

describe('friends utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should generate and persist a unique 8-character schedule ID', () => {
    const id1 = getMyScheduleId();
    expect(id1).toBeTypeOf('string');
    expect(id1).toHaveLength(8);

    const id2 = getMyScheduleId();
    expect(id1).toBe(id2); // should persist
  });

  it('should save and retrieve friends by unique ID', () => {
    const success = saveFriend('friend-123', {
      name: 'Yossi',
      sets: ['set-1::stage-1::2026-07-25::16:00'],
      priorities: { 'set-1::stage-1::2026-07-25::16:00': 'must' },
      notes: { 'set-1::stage-1::2026-07-25::16:00': 'Personal Note' }
    });
    expect(success).toBe(true);

    const friends = getFriends();
    expect(friends['friend-123']).toBeDefined();
    expect(friends['friend-123'].name).toBe('Yossi');
    expect(friends['friend-123'].sets).toContain('set-1::stage-1::2026-07-25::16:00');
  });

  it('should allow saving coordination notes for a friend', () => {
    saveFriend('friend-123', {
      name: 'Yossi',
      sets: ['set-1::stage-1::2026-07-25::16:00'],
    });

    saveCoordinationNote('friend-123', 'set-1::stage-1::2026-07-25::16:00', 'Meet at stage gate');

    const friends = getFriends();
    expect(friends['friend-123'].coordinationNotes['set-1::stage-1::2026-07-25::16:00']).toBe('Meet at stage gate');
  });
});
