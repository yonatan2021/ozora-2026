import { describe, it, expect, beforeEach } from 'vitest';
import { getFriends, saveFriend, removeFriend } from './friends.js';

describe('friends utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load a friend schedule', () => {
    const name = 'Alice';
    const keys = ['Set1', 'Set2'];
    expect(saveFriend(name, keys)).toBe(true);
    expect(getFriends()[name].sets).toEqual(keys);
  });

  it('should enforce maximum friend schedule limit', () => {
    for (let i = 0; i < 10; i++) {
      saveFriend(`Friend ${i}`, [`Set${i}`]);
    }
    expect(saveFriend('Friend 11', ['Set11'])).toBe(false);
  });

  it('should remove a friend schedule', () => {
    saveFriend('Bob', ['SetB']);
    expect(getFriends()['Bob']).toBeDefined();
    removeFriend('Bob');
    expect(getFriends()['Bob']).toBeUndefined();
  });
});
