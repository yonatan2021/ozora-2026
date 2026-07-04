import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    vi.restoreAllMocks();
  });

  it('should generate and persist a unique 8-character schedule ID', () => {
    const id1 = getMyScheduleId();
    expect(id1).toBeTypeOf('string');
    expect(id1).toHaveLength(8);

    const id2 = getMyScheduleId();
    expect(id1).toBe(id2); // should persist
  });

  it('should generate deterministic 8-char ID using crypto if available or Math.random fallback', () => {
    // Test fallback path
    localStorage.clear();
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', undefined);
    
    const idFallback = getMyScheduleId();
    expect(idFallback).toHaveLength(8);

    // Test crypto path
    localStorage.clear();
    const fakeCrypto = {
      randomUUID: () => '12345678-1234-1234-1234-123456789012'
    };
    vi.stubGlobal('crypto', fakeCrypto);
    const idCrypto = getMyScheduleId();
    expect(idCrypto).toBe('12345678');

    // Restore crypto
    if (originalCrypto) {
      vi.stubGlobal('crypto', originalCrypto);
    } else {
      vi.unstubAllGlobals();
    }
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

  it('should guard against null/undefined inputs in saveFriend', () => {
    expect(saveFriend(null, { name: 'Yossi' })).toBe(false);
    expect(saveFriend('friend-123', null)).toBe(false);
    expect(saveFriend(undefined, undefined)).toBe(false);
  });

  it('should enforce MAX_FRIENDS limit of 10', () => {
    for (let i = 1; i <= 10; i++) {
      const success = saveFriend(`friend-${i}`, { name: `Friend ${i}` });
      expect(success).toBe(true);
    }
    // The 11th friend should fail to save
    const success11 = saveFriend('friend-11', { name: 'Friend 11' });
    expect(success11).toBe(false);
    expect(getFriends()['friend-11']).toBeUndefined();

    // Saving an existing friend (update) should still succeed even if at limit
    const successUpdate = saveFriend('friend-1', { name: 'Friend 1 Updated' });
    expect(successUpdate).toBe(true);
    expect(getFriends()['friend-1'].name).toBe('Friend 1 Updated');
  });

  it('should remove a saved friend', () => {
    saveFriend('friend-123', { name: 'Yossi' });
    expect(getFriends()['friend-123']).toBeDefined();

    removeFriend('friend-123');
    expect(getFriends()['friend-123']).toBeUndefined();
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

  it('should guard against non-string note text in saveCoordinationNote', () => {
    saveFriend('friend-123', { name: 'Yossi' });
    
    // Pass a number as noteText
    saveCoordinationNote('friend-123', 'set-1', 12345);
    const friends = getFriends();
    expect(friends['friend-123'].coordinationNotes['set-1']).toBe('12345');

    // Pass an object as noteText
    saveCoordinationNote('friend-123', 'set-2', { toString: () => 'custom-note' });
    const friends2 = getFriends();
    expect(friends2['friend-123'].coordinationNotes['set-2']).toBe('custom-note');
  });
});
